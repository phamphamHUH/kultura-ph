"use client";

import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const regionSlugs = [
  "region-1",
  "region-2",
  "region-3",
  "calabarzon",
  "mimaropa",
  "bicol",
  "western-visayas",
  "central-visayas",
  "eastern-visayas",
  "negros-island-region",
  "ncr",
  "car",
  "northern-mindanao",
  "davao-region",
  "soccsksargen",
  "caraga",
  "zamboanga-peninsula",
  "barmm",
];

type Suggestion = {
  islandGroup: string;
  name: string;
  description: string;
  slug: string;
  image: string;
};

function readFrontmatterValue(frontmatter: string, key: string) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.replace(/^"(.*)"$/, "$1").trim() ?? "";
}

function shuffle<T>(items: T[]) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

export default function SuggestionCard({
  selectedSlug,
}: {
  selectedSlug: string;
}) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestions() {
      setLoading(true);

      try {
        const candidates = shuffle(
          regionSlugs.filter((slug) => slug !== selectedSlug),
        ).slice(0, 3);

        const loaded = await Promise.all(
          candidates.map(async (slug) => {
            const response = await fetch(`/content/data/regions/${slug}.md`);
            if (!response.ok) throw new Error("Region unavailable");

            const markdown = await response.text();
            const frontmatter =
              markdown.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
            const normalizedMarkdown = markdown.replace(/\r\n?/g, "\n");

            const overview =
              normalizedMarkdown
                .match(
                  /^##[ \t]+Overview[ \t]*\n([\s\S]*?)(?=^#{1,2}[ \t]+|(?![\s\S]))/m,
                )?.[1]
                ?.trim()
                .replace(/\s+/g, " ") ?? "";

            return {
              slug,
              name: readFrontmatterValue(frontmatter, "name"),
              islandGroup: readFrontmatterValue(
                frontmatter,
                "islandGroup",
              ).toUpperCase(),
              description: overview,
              image: readFrontmatterValue(frontmatter, "image"),
            };
          }),
        );

        if (!cancelled) setSuggestions(loaded);
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSuggestions();
    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  return (
    <section
      className="rounded-md border-t border-gray-200 px-6 py-8 mt-6 sm:px-8 lg:px-9"
      aria-labelledby="suggestion-heading"
    >
      <div className="flex items-end justify-between gap-4">
        <h2
          id="suggestion-heading"
          className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl"
        >
          Where will curiosity take you?
        </h2>
        <p className="hidden text-sm text-gray-600 sm:block">
          A few places to begin
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {loading
          ? [0, 1, 2].map((item) => (
              <article key={item} className="animate-pulse">
                <div className="aspect-[1.85/1] rounded-xl bg-gray-300" />
                <div className="mt-5 h-3 w-28 rounded bg-gray-200" />
                <div className="mt-3 h-7 w-44 rounded bg-gray-200" />
                <div className="mt-3 h-12 rounded bg-gray-100" />
              </article>
            ))
          : suggestions.map((suggestion) => (
              <article key={suggestion.slug}>
                <div className="relative mx-auto mt-4 h-40 w-full overflow-hidden rounded-lg bg-gray-200">
                  {suggestion.image && (
                    <Image
                      src={suggestion.image}
                      alt={`${suggestion.name}`}
                      fill
                      sizes="(max-width: 1024px) 100vw, 400px"
                      className="object-cover object-center"
                    />
                  )}
                </div>
                <p className="mt-5 text-xs font-bold tracking-[0.22em] text-blue-800">
                  {suggestion.islandGroup}
                </p>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <h3 className="text-2xl font-bold tracking-tight text-gray-900">
                    {suggestion.name}
                  </h3>
                  <Link
                    href={`/regions/${suggestion.slug}`}
                    aria-label={`Discover ${suggestion.name}`}
                    className="shrink-0 text-blue-700 transition hover:text-blue-900"
                  >
                    <ArrowUpRight size={21} strokeWidth={2} />
                  </Link>
                </div>
                <p className="mt-3 text-sm leading-6 text-gray-600">
                  {suggestion.description}
                </p>
              </article>
            ))}
      </div>
    </section>
  );
}
