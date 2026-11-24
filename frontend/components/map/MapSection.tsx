"use client";

import { useEffect, useState } from "react";
import MapLoader from "./MapLoader";
import FocusCard, { type RegionInfo } from "../layout/FocusCard";

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

export default function MapSection({
  selectedSlug,
  onSelectedSlugChange,
}: {
  selectedSlug: string;
  onSelectedSlugChange: (slug: string) => void;
}) {
  const [region, setRegion] = useState<RegionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadRegion() {
      setLoading(true);

      try {
        const response = await fetch(
          `/content/data/regions/${selectedSlug}.md`,
        );
        if (!response.ok) throw new Error("Region content unavailable");

        // Windows/Git can save files with CRLF line endings; normalize them
        // so the patterns below work on any machine.
        const markdown = (await response.text()).replace(/\r\n/g, "\n");

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

        // Everything under "## Overview" up to the next "## " heading or the
        // end of the file. (`$(?![\s\S])` means "end of the whole string",
        // since the `m` flag makes a plain `$` match at every line end.)
        const overviewMatch = markdown.match(
          /^## Overview\s*\n([\s\S]*?)(?=\n## |$(?![\s\S]))/m,
        );
        const overview = overviewMatch?.[1]?.trim().replace(/\n+/g, " ") ?? "";

        const food = readList("food");
        const crafts = readList("crafts");
        const festivals = [
          ...frontmatter.matchAll(/\{\s*name:\s*"([^"]+)"/g),
        ].map((match) => match[1]);

        if (!cancelled) {
          setRegion({
            name: readValue("name"),
            slug: readValue("slug") || selectedSlug,
            islandGroup: readValue("islandGroup"),
            overview,
            threads: [festivals[0], food[0], crafts[0]].filter(
              (thread): thread is string => Boolean(thread),
            ),
            image: readValue("image"),
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
      className="grid  w-full grid-cols-5 gap-6"
      aria-label="Philippines region map"
    >
      <div className="col-span-3">
        <MapLoader
          regions={regions}
          selectedSlug={selectedSlug}
          onSelect={onSelectedSlugChange}
        />
      </div>
      <div className="col-span-2">
        <FocusCard region={region} loading={loading} />
      </div>
    </section>
  );
}
