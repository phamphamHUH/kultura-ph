import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";

const DIR = path.join(process.cwd(), "public", "content", "data", "regions");

export type Festival = {
  name: string;
  place: string;
  when: string;
  tagline: string;
  description: string;
  image?: string;
  credit?: string;
  month?: number;
  endMonth?: number;
  day?: number;
  regionName: string;
  regionSlug: string;
  isTentative?: boolean;
};

export async function getFestivals() {
  const files = (await fs.readdir(DIR)).filter((file) => file.endsWith(".md"));

  const dated: Festival[] = [];
  const tentative: Festival[] = [];

  for (const file of files) {
    const { data } = matter(await fs.readFile(path.join(DIR, file), "utf8"));

    const base = {
      regionName: data.name as string,
      regionSlug: data.slug as string,
    };

    for (const festival of data.festivals ?? []) {
      dated.push({
        ...festival,
        ...base,
        isTentative: false,
      });
    }

    for (const festival of data.tentativeFestivals ?? []) {
      tentative.push({
        ...festival,
        ...base,
        isTentative: true,
      });
    }
  }

  return {
    dated,
    tentative,
    festivals: sortByUpcoming([...dated, ...tentative]),
  };
}

// Today's month/day in Manila, regardless of where the server runs.
function manilaToday() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "Asia/Manila",
    }),
  );
}

function hasValidMonth(festival: Festival) {
  return (
    typeof festival.month === "number" &&
    Number.isInteger(festival.month) &&
    festival.month >= 1 &&
    festival.month <= 12
  );
}

// 0 if the festival's month range includes this month;
// otherwise, days until its next starting date.
function daysUntil(festival: Festival, today: Date) {
  const start = festival.month!;
  const end = festival.endMonth ?? start;
  const month = today.getMonth() + 1;

  const inSeason =
    start <= end
      ? month >= start && month <= end
      : month >= start || month <= end;

  if (inSeason) return 0;

  const next = new Date(today.getFullYear(), start - 1, festival.day ?? 1);

  if (next < today) {
    next.setFullYear(today.getFullYear() + 1);
  }

  return (next.getTime() - today.getTime()) / 86_400_000;
}

export function sortByUpcoming(list: Festival[]) {
  const today = manilaToday();

  const dated = list.filter(
    (festival) => !festival.isTentative && hasValidMonth(festival),
  );

  const tentative = list.filter(
    (festival) => festival.isTentative || !hasValidMonth(festival),
  );

  dated.sort(
    (a, b) =>
      daysUntil(a, today) - daysUntil(b, today) || a.name.localeCompare(b.name),
  );

  tentative.sort((a, b) => a.name.localeCompare(b.name));

  return [
    ...dated,
    ...tentative.map((festival) => ({
      ...festival,
      isTentative: true,
    })),
  ];
}
