"use client";

import { useState } from "react";
import MapLoader from "./MapLoader";
import FocusCard, { type RegionInfo } from "../layout/FocusCard";
import { useEffect } from "react";

const regions = [
  { slug: "region-1", name: "Ilocos Region" },
  { slug: "region-2", name: "Cagayan Valley" },
  { slug: "region-3", name: "Central Luzon" },
  { slug: "calabarzon", name: "CALABARZON" },
  { slug: "mimaropa", name: "MIMAROPA" },
  { slug: "bicol", name: "Bicol Region" },
  { slug: "western-visayas", name: "Western Visayas" },
  { slug: "central-visayas", name: "Central Visayas" },
  { slug: "eastern-visayas", name: "Eastern Visayas" },
  { slug: "negros-island-region", name: "Negros Island Region" },
  { slug: "ncr", name: "National Capital Region" },
  { slug: "car", name: "Cordillera Administrative Region" },
  { slug: "northern-mindanao", name: "Northern Mindanao" },
  { slug: "davao-region", name: "Davao Region" },
  { slug: "soccsksargen", name: "SOCCSKSARGEN" },
  { slug: "caraga", name: "Caraga" },
  { slug: "zamboanga-peninsula", name: "Zamboanga Peninsula" },
  { slug: "barmm", name: "Bangsamoro Autonomous Region in Muslim Mindanao" },
];

export default function MapSection() {
  const [selectedSlug, setSelectedSlug] = useState("region-1");
  const [region, setRegion] = useState<RegionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRegion() {
      setLoading(true);

      try {
        const response = await fetch(`/content/data/regions/${selectedSlug}.md`);
        if (!response.ok) throw new Error("Region content unavailable");

        const markdown = await response.text();
        const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---/);
        const frontmatter = frontmatterMatch?.[1] ?? "";

        const readValue = (key: string) => {
          const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
          return match?.[1]?.replace(/^"(.*)"$/, "$1").trim() ?? "";
        };

        const readList = (key: string) => {
          const value = readValue(key);
          return [...value.matchAll(/"([^"]+)"/g)].map((match) => match[1]);
        };

        const overviewMatch = markdown.match(/^## Overview\n([\s\S]*?)(?=\n## |\n*$)/m);
        const overview = overviewMatch?.[1]?.trim().replace(/\n+/g, " ") ?? "";

        const food = readList("food");
        const crafts = readList("crafts");
        const festivals = [...frontmatter.matchAll(/\{\s*name:\s*"([^"]+)"/g)].map(
          (match) => match[1],
        );

        if (!cancelled) {
          setRegion({
            name: readValue("name"),
            slug: readValue("slug") || selectedSlug,
            islandGroup: readValue("islandGroup"),
            overview,
            threads: [festivals[0], food[0], crafts[0]].filter(
              (thread): thread is string => Boolean(thread),
            ),
          });
        }
      } catch {
        if (!cancelled) setRegion(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadRegion();
    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  return (
    <section
      className="h-140 w-full grid grid-cols-5 gap-6"
      aria-label="Philippines region map"
    >
      <div className="col-span-3">
        <MapLoader
          regions={regions}
          selectedSlug={selectedSlug}
          onSelect={setSelectedSlug}
        />
      </div>
      <div className="col-span-2">
        <FocusCard region={region} loading={loading} />
      </div>
    </section>
  );
}
