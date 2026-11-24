import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { cacheLife } from "next/cache";

const REGIONS_DIR = path.join(process.cwd(), "public/content/data/regions");

export type StoryCategory = "crafts" | "food" | "heritage";

export const CATEGORY_LABELS: Record<StoryCategory, string> = {
  crafts: "Crafts & Design",
  food: "Food & Cuisine",
  heritage: "Heritage Places",
};

// Matches the "### <Heading>: <Title>" prefix in each region file
const HEADING_TO_CATEGORY: Record<string, StoryCategory> = {
  "crafts and arts": "crafts",
  "food and cuisine": "food",
  "heritage places": "heritage",
};

export type Story = {
  regionSlug: string;
  regionName: string;
  category: StoryCategory;
  title: string;
  summary: string;
  paragraphs: string[];
};

function parseStories(slug: string, name: string, body: string): Story[] {
  const section = body.split(/^## Cultural Stories\s*$/m)[1];
  if (!section) return [];

  return section
    .split(/^### /m)
    .slice(1)
    .flatMap((chunk) => {
      const [headingLine, ...rest] = chunk.split("\n");
      const [rawCategory, ...titleParts] = headingLine.split(":");
      const category = HEADING_TO_CATEGORY[rawCategory.trim().toLowerCase()];
      if (!category) return [];

      const text = rest.join("\n");
      const summary =
        text.match(
          /\*\*Summary:\*\*\s*([\s\S]*?)\s*\*\*Detailed Story:\*\*/,
        )?.[1] ?? "";
      const detail = text.split("**Detailed Story:**")[1] ?? "";

      return [
        {
          regionSlug: slug,
          regionName: name,
          category,
          title: titleParts.join(":").trim(),
          summary: summary.trim(),
          paragraphs: detail
            .split(/\n{2,}/)
            .map((p) => p.replace(/^---+$/gm, "").trim())
            .filter(Boolean),
        },
      ];
    });
}

export async function getStories(): Promise<Story[]> {
  "use cache";
  cacheLife("max");

  console.log("REGIONS_DIR:", REGIONS_DIR);
  const files = (await fs.readdir(REGIONS_DIR)).filter((f) =>
    f.endsWith(".md"),
  );
  console.log("FILES:", files);
  const all = await Promise.all(
    files.map(async (file) => {
      const raw = await fs.readFile(path.join(REGIONS_DIR, file), "utf8");
      const { data, content } = matter(raw);
      return parseStories(data.slug, data.name, content);
    }),
  );
  const result = all.flat();
  console.log(
    "STORIES:",
    result.map((s) => `${s.regionSlug}/${s.category}`),
  );
  return result;
}

export async function getStory(regionSlug: string, category: string) {
  return (await getStories()).find(
    (s) => s.regionSlug === regionSlug && s.category === category,
  );
}
