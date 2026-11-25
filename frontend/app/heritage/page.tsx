import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  getStories,
  CATEGORY_LABELS,
  type StoryCategory,
} from "@/public/lib/stories";
import { Metadata } from "next";

const PAGE_SIZE = 10;

const tabBase =
  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors";
const tabActive = "border-blue-800 bg-blue-800 text-white";
const tabIdle = "border-gray-200 bg-white text-gray-700 hover:bg-gray-100";

const paginationButtonClass =
  "flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100";
const disabledPaginationClass =
  "flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-md border border-gray-200 opacity-40";

// Keeps the active category when moving between pages.
function pageHref(page: number, category?: StoryCategory) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/heritage?${query}` : "/heritage";
}

export const metadata: Metadata = {
  title: "Heritage | Kultura PH",
  description:
    "Explore Philippine festivals through the places, communities, and traditions that give them meaning.",
};

export default async function CulturesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; page?: string }>;
}) {
  const { category: categoryParam, page: pageParam } = await searchParams;

  // Ignore unknown category values.
  const category =
    categoryParam && categoryParam in CATEGORY_LABELS
      ? (categoryParam as StoryCategory)
      : undefined;

  const filtered = (await getStories()).filter(
    (s) => !category || s.category === category,
  );

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const requestedPage = Number(pageParam);
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1, 1),
    totalPages,
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const stories = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  const from = total > 0 ? startIndex + 1 : 0;
  const to = Math.min(startIndex + PAGE_SIZE, total);

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <div className="bg-gray-50">
      <Header />

      <main className="flex flex-col gap-8 px-5 py-10 sm:px-10">
        {/* Intro */}
        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-semibold tracking-widest text-blue-800">
            KNOWLEDGE / PRACTICE / BELONGING
          </p>
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Culture is something people keep making.
          </h1>
          <p className="max-w-md text-sm font-light leading-6 text-gray-600">
            Stories of skills, places and spoken knowledge—carried forward,
            questioned and renewed by the people who live them.
          </p>
        </div>

        {/* Filters */}
        <nav aria-label="Story categories" className="flex flex-wrap gap-2">
          <Link
            href="/heritage"
            aria-current={!category ? "page" : undefined}
            className={`${tabBase} ${!category ? tabActive : tabIdle}`}
          >
            All stories
          </Link>

          {(Object.keys(CATEGORY_LABELS) as StoryCategory[]).map((c) => (
            <Link
              key={c}
              href={`/heritage?category=${c}`}
              aria-current={category === c ? "page" : undefined}
              className={`${tabBase} ${category === c ? tabActive : tabIdle}`}
            >
              {CATEGORY_LABELS[c]}
            </Link>
          ))}
        </nav>

        {/* Count row */}
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>
            {total} {total === 1 ? "story" : "stories"} · Many ways of carrying
            culture
          </span>
          <span className="font-semibold uppercase tracking-widest text-blue-800">
            The editorial collection
          </span>
        </div>

        {/* Story rows */}
        <section aria-label="Stories" className="flex flex-col gap-2">
          {stories.length > 0 ? (
            <ul className="divide-y divide-gray-200 border-t border-gray-200">
              {stories.map((s) => (
                <li
                  key={`${s.regionSlug}-${s.category}`}
                  className="grid gap-6 py-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[25rem_1fr]"
                >
                  <Link
                    href={`/heritage/${s.regionSlug}/${s.category}`}
                    aria-label={s.title}
                    className="relative aspect-5/3 overflow-hidden rounded-lg bg-gray-300"
                  >
                    {s.image?.trim() ? (
                      <Image
                        src={s.image}
                        alt={s.title}
                        fill
                        sizes="(min-width: 1024px) 40vw, 100vw"
                        className="object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-xs text-gray-600">
                        Photo coming soon
                      </span>
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-col gap-1">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-800">
                      {CATEGORY_LABELS[s.category]}
                    </p>

                    <p className="text-xs text-gray-500">{s.regionName}</p>

                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
                      {s.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {s.summary}
                    </p>

                    {s.image?.trim() && s.credit && (
                      <p className="mt-1 text-[10px] text-gray-500">
                        Photo: {s.credit}
                      </p>
                    )}

                    <Link
                      href={`/heritage/${s.regionSlug}/${s.category}`}
                      className="mt-3 inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-blue-800 hover:underline"
                    >
                      Explore the story
                      <ArrowUpRight size={13} aria-hidden="true" />
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-sm text-gray-500">
              No stories in this category yet.
            </p>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
              <span>
                Showing {from} - {to} of {total}{" "}
                {total === 1 ? "story" : "stories"}
              </span>

              <nav
                aria-label="Story pagination"
                className="flex flex-wrap items-center gap-1.5"
              >
                {currentPage > 1 ? (
                  <Link
                    href={pageHref(currentPage - 1, category)}
                    aria-label="Previous page"
                    className={paginationButtonClass}
                  >
                    &lt;
                  </Link>
                ) : (
                  <span
                    aria-label="Previous page"
                    aria-disabled="true"
                    className={disabledPaginationClass}
                  >
                    &lt;
                  </span>
                )}

                {pages.map((page) => (
                  <Link
                    key={page}
                    href={pageHref(page, category)}
                    aria-label={`Page ${page}`}
                    aria-current={page === currentPage ? "page" : undefined}
                    className={`flex h-7 w-7 items-center justify-center rounded-md ${
                      page === currentPage
                        ? "bg-blue-800 font-bold text-white shadow-xs"
                        : "border border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    {page}
                  </Link>
                ))}

                {currentPage < totalPages ? (
                  <Link
                    href={pageHref(currentPage + 1, category)}
                    aria-label="Next page"
                    className={paginationButtonClass}
                  >
                    &gt;
                  </Link>
                ) : (
                  <span
                    aria-label="Next page"
                    aria-disabled="true"
                    className={disabledPaginationClass}
                  >
                    &gt;
                  </span>
                )}
              </nav>
            </div>
          )}
        </section>

        {/* Closing note */}
        <section className="grid gap-6 rounded-md px-6 py-6 bg-[#eef2ff] pt-8 md:grid-cols-2 md:gap-10">
          <h2 className="text-2xl font-semibold tracking-tight">
            Recognition is a beginning, not the whole story.
          </h2>

          <div className="flex flex-col items-start gap-4">
            <p className="text-xs leading-6 text-gray-600">
              Heritage listings can help us find a place or practice. The people
              who sustain it offer a deeper understanding. Read alongside
              community perspectives and cultural institutions, including UNESCO
              and the NCCA.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-blue-800 hover:bg-blue-50"
            >
              Our approach to the atlas
              <ArrowUpRight size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
