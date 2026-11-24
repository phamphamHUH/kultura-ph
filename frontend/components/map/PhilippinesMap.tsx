"use client";

import { useEffect, useRef, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import { Minus, Plus, RotateCcw } from "lucide-react";
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

export type MapRegion = { slug: string; name: string };

export type PhilippinesMapProps = {
  regions: MapRegion[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
};

const CENTER: [number, number] = [12.5, 122];
const ZOOM = 6;

// Set to true to draw OpenStreetMap tiles under the regions.
const SHOW_TILES = false;

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

function styleFor(slug: string | undefined, selected: string): PathOptions {
  return slug && slug === selected ? SELECTED_STYLE : BASE_STYLE;
}

function ControlButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
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
  const [map, setMap] = useState<LeafletMap | null>(null);
  const [data, setData] = useState<FeatureCollection | null>(null);
  const [failed, setFailed] = useState(false);

  const geoRef = useRef<LeafletGeoJSON | null>(null);
  // Leaflet handlers are created once, so they read the latest values from refs
  const selectedRef = useRef(selectedSlug);
  const onSelectRef = useRef(onSelect);

  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  // Load boundaries from /public/data/regions.geojson
  useEffect(() => {
    let cancelled = false;
    fetch("/content/regions.geojson")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load map data");
        return res.json();
      })
      .then((json: FeatureCollection) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Restyle regions whenever the selection changes
  useEffect(() => {
    selectedRef.current = selectedSlug;
    geoRef.current?.eachLayer((layer) => {
      const l = layer as Path & { feature?: Feature };
      const slug = l.feature?.properties?.slug as string | undefined;
      l.setStyle(styleFor(slug, selectedSlug));
      if (slug === selectedSlug) l.bringToFront();
    });
  }, [selectedSlug, data]);

  const nameBySlug = new Map(regions.map((r) => [r.slug, r.name]));

  const onEachFeature = (feature: Feature, layer: Layer) => {
    const slug = feature.properties?.slug as string | undefined;
    if (!slug) return;

    layer.bindTooltip(
      nameBySlug.get(slug) ?? (feature.properties?.name as string) ?? slug,
      { sticky: true },
    );

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const path = e.target as Path;
        if (slug !== selectedRef.current) path.setStyle(HOVER_STYLE);
        path.bringToFront();
      },
      mouseout: (e: LeafletMouseEvent) => {
        (e.target as Path).setStyle(styleFor(slug, selectedRef.current));
      },
      click: () => onSelectRef.current(slug),
    });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      {/* Header: title + zoom controls */}
      <div className="flex items-center justify-between px-5 py-4">
        <h2 className="text-sm font-medium text-gray-900">Explore by place</h2>
        <div className="flex gap-2">
          <ControlButton label="Zoom in" onClick={() => map?.zoomIn()}>
            <Plus size={16} />
          </ControlButton>
          <ControlButton label="Zoom out" onClick={() => map?.zoomOut()}>
            <Minus size={16} />
          </ControlButton>
          <ControlButton
            label="Reset view"
            onClick={() => map?.setView(CENTER, ZOOM)}
          >
            <RotateCcw size={16} />
          </ControlButton>
        </div>
      </div>

      {/* Map */}
      <div className="relative z-0 min-h-80 flex-1 bg-[#e9eef2]">
        <div className="absolute inset-0">
          <MapContainer
            ref={setMap}
            center={CENTER}
            zoom={ZOOM}
            minZoom={5}
            maxZoom={10}
            maxBounds={[
              [2, 112],
              [23, 132],
            ]}
            zoomControl={false}
            scrollWheelZoom={false}
            className="h-full w-full bg-[#e9eef2]!"
          >
            {SHOW_TILES && (
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
            )}
            {data && (
              <GeoJSON
                ref={geoRef}
                data={data}
                style={(feature) =>
                  styleFor(feature?.properties?.slug, selectedRef.current)
                }
                onEachFeature={onEachFeature}
                attribution="Boundaries: NAMRIA / PSA via OCHA COD-AB (CC BY-IGO)"
              />
            )}
          </MapContainer>
        </div>

        {failed && (
          <p className="absolute inset-x-0 top-3 z-1000 mx-auto w-fit rounded-md bg-white px-3 py-2 text-sm text-red-700 shadow">
            The map data could not be loaded.
          </p>
        )}
      </div>

      {/* Footer strip */}
      <div className="flex items-center justify-between px-5 py-3 text-[10px] tracking-wider">
        <span className="uppercase text-gray-500">
          Philippine Cultural Atlas
        </span>
        <span className="text-blue-800">Place-led exploration</span>
      </div>
    </div>
  );
}
