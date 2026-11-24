"use client";

import { useEffect, useRef, useState } from "react";
import { geoJSON, map as createMap } from "leaflet";
import { Minus, Plus, RotateCcw } from "lucide-react";

import type { ReactNode } from "react";
import type { Feature, FeatureCollection } from "geojson";
import type {
  GeoJSON as LeafletGeoJSON,
  Layer,
  LeafletMouseEvent,
  Map as LeafletMap,
  Path,
  PathOptions,
} from "leaflet";

import "leaflet/dist/leaflet.css";

export type MapRegion = {
  slug: string;
  name: string;
};

export type PhilippinesMapProps = {
  regions: MapRegion[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
};

const CENTER: [number, number] = [12.5, 122];
const ZOOM = 6;

const BASE_STYLE: PathOptions = {
  color: "#1e40af",
  weight: 1,
  fillColor: "#93c5fd",
  fillOpacity: 0.45,
};

const HOVER_STYLE: PathOptions = {
  color: "#1e40af",
  weight: 2,
  fillColor: "#3b82f6",
  fillOpacity: 0.7,
};

const SELECTED_STYLE: PathOptions = {
  color: "#1e3a8a",
  weight: 2,
  fillColor: "#1e40af",
  fillOpacity: 0.75,
};

function styleFor(slug: string | undefined, selectedSlug: string): PathOptions {
  return slug && slug === selectedSlug ? SELECTED_STYLE : BASE_STYLE;
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 bg-white text-blue-800 transition hover:bg-blue-50"
    >
      {children}
    </button>
  );
}

export default function PhilippinesMap({
  regions,
  selectedSlug,
  onSelect,
}: PhilippinesMapProps) {
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [failed, setFailed] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LeafletGeoJSON | null>(null);

  // Leaflet handlers are created once, so they read the latest values
  // from refs instead of from props.
  const selectedRef = useRef(selectedSlug);
  const onSelectRef = useRef(onSelect);
  const regionsRef = useRef(regions);

  useEffect(() => {
    onSelectRef.current = onSelect;
    regionsRef.current = regions;
  }, [onSelect, regions]);

  // 1) Load the boundaries
  useEffect(() => {
    const controller = new AbortController();

    async function loadBoundaries() {
      try {
        const response = await fetch("/content/regions.geojson", {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load map data: ${response.status}`);
        }

        const json = (await response.json()) as FeatureCollection;

        if (json.type !== "FeatureCollection") {
          throw new Error("Expected a GeoJSON FeatureCollection");
        }

        if (!controller.signal.aborted) {
          setData(json);
          setFailed(false);
        }
      } catch (error) {
        if (controller.signal.aborted) return;

        console.error("Unable to load region boundaries:", error);
        setFailed(true);
      }
    }

    void loadBoundaries();

    return () => {
      controller.abort();
    };
  }, []);

  // 2) Create the map and the region layer. Creating and removing happen in
  //    the same effect, so React Strict Mode, Fast Refresh and hidden pages
  //    can never leave a layer attached to a map that was already removed.
  useEffect(() => {
    const container = containerRef.current;
    if (!data || !container) return;

    const map = createMap(container, {
      center: CENTER,
      zoom: ZOOM,
      minZoom: 5,
      maxZoom: 10,
      maxBounds: [
        [2, 112],
        [23, 132],
      ],
      zoomControl: false,
      scrollWheelZoom: false,
    });
    mapRef.current = map;

    const nameBySlug = new Map(
      regionsRef.current.map((region) => [region.slug, region.name]),
    );

    const layer = geoJSON(data, {
      style: (feature) =>
        styleFor(
          feature?.properties?.slug as string | undefined,
          selectedRef.current,
        ),
      attribution: "Boundaries: NAMRIA / PSA via OCHA COD-AB (CC BY-IGO)",
      onEachFeature: (feature: Feature, featureLayer: Layer) => {
        const slug = feature.properties?.slug as string | undefined;
        if (!slug) return;

        const name =
          nameBySlug.get(slug) ??
          (feature.properties?.name as string | undefined) ??
          slug;

        // textContent, so feature names are never interpreted as HTML
        const tooltip = document.createElement("span");
        tooltip.textContent = name;
        featureLayer.bindTooltip(tooltip, { sticky: true });

        featureLayer.on({
          mouseover: (event: LeafletMouseEvent) => {
            if (slug !== selectedRef.current) {
              (event.target as Path).setStyle(HOVER_STYLE);
            }
          },
          mouseout: (event: LeafletMouseEvent) => {
            (event.target as Path).setStyle(
              styleFor(slug, selectedRef.current),
            );
          },
          click: () => {
            onSelectRef.current(slug);
          },
        });
      },
    }).addTo(map);
    layerRef.current = layer;

    // Keep the map correctly sized when the layout changes
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => map.invalidateSize())
        : null;
    observer?.observe(container);

    return () => {
      observer?.disconnect();
      layerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [data]);

  // 3) Restyle regions when the selection changes
  useEffect(() => {
    selectedRef.current = selectedSlug;

    layerRef.current?.eachLayer((layer) => {
      const path = layer as Path & { feature?: Feature };
      const slug = path.feature?.properties?.slug as string | undefined;

      path.setStyle(styleFor(slug, selectedSlug));
      if (slug === selectedSlug) path.bringToFront();
    });
  }, [selectedSlug, data]);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="px-5 py-4">
        <h2 className="text-sm font-medium text-gray-900">Explore by place</h2>
      </div>

      <div className="relative z-0 min-h-80 flex-1 bg-[#e9eef2]">
        <div className="absolute inset-0">
          <div ref={containerRef} className="h-full w-full !bg-[#e9eef2]" />
        </div>

        {data ? (
          <div className="absolute right-4 top-4 z-[1000] flex gap-2">
            <ControlButton
              label="Zoom in"
              onClick={() => mapRef.current?.zoomIn()}
            >
              <Plus size={16} />
            </ControlButton>
            <ControlButton
              label="Zoom out"
              onClick={() => mapRef.current?.zoomOut()}
            >
              <Minus size={16} />
            </ControlButton>
            <ControlButton
              label="Reset view"
              onClick={() => mapRef.current?.setView(CENTER, ZOOM)}
            >
              <RotateCcw size={16} />
            </ControlButton>
          </div>
        ) : (
          <div
            role={failed ? "alert" : "status"}
            className="absolute inset-0 z-[1000] flex items-center justify-center px-5 text-center text-sm"
          >
            <p className={failed ? "text-red-700" : "text-gray-500"}>
              {failed ? "The map data could not be loaded." : "Loading map…"}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 px-5 py-3 text-[10px] tracking-wider">
        <span className="uppercase text-gray-500">
          Philippine Cultural Atlas
        </span>

        <span className="text-blue-800">Place-led exploration</span>
      </div>
    </div>
  );
}
