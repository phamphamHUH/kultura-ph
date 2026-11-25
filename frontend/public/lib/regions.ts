import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const REGIONS_DIR = path.join(
  process.cwd(),
  "public",
  "content",
  "data",
  "regions",
);

export type RegionFestival = {
  name: string;
  place: string;
  when: string;
  tagline: string;
  description: string;
  image: string;
  credit: string;
};

export type Region = {
  slug: string;
  name: string;
  islandGroup: string;
  regionalCenter: string;
  overview: string;
  provinces: string[];
  languages: string[];
  festivals: RegionFestival[];
  tentativeFestivals: RegionFestival[];
  food: string[];
  crafts: string[];
  heritageSites: string[];
  image: string;
  imageCredit: string;
};

const str = (v: unknown) => (typeof v === "string" ? v : "");
const list = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
const festivals = (v: unknown): RegionFestival[] =>
  Array.isArray(v)
    ? v.map((f) => ({
        name: str(f?.name),
        place: str(f?.place),
        when: str(f?.when),
        tagline: str(f?.tagline),
        description: str(f?.description),
        image: str(f?.image),
        credit: str(f?.credit),
      }))
    : [];

export async function getRegionSlugs(): Promise<string[]> {
  const files = await fs.readdir(REGIONS_DIR);
  return files
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

export async function getRegion(slug: string): Promise<Region | null> {
  if (!/^[a-z0-9-]+$/.test(slug)) return null; // keep URL input out of the file path

  try {
    const raw = await fs.readFile(path.join(REGIONS_DIR, `${slug}.md`), "utf8");
    const { data, content } = matter(raw);
    const body = content.replace(/\r\n?/g, "\n");

    const overview =
      body
        .match(
          /^##[ \t]+Overview[ \t]*\n([\s\S]*?)(?=^#{1,2}[ \t]+|(?![\s\S]))/m,
        )?.[1]
        ?.trim()
        .replace(/\s+/g, " ") ?? "";

    return {
      slug,
      name: str(data.name),
      islandGroup: str(data.islandGroup),
      regionalCenter: str(data.regionalCenter),
      overview,
      provinces: list(data.provinces),
      languages: list(data.languages),
      festivals: festivals(data.festivals),
      tentativeFestivals: festivals(data.tentativeFestivals),
      food: list(data.food),
      crafts: list(data.crafts),
      heritageSites: list(data.heritageSites),
      image: str(data.image),
      imageCredit: str(data.imageCredit),
    };
  } catch {
    return null;
  }
}
