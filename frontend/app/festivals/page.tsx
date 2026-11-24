import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import {
  getFestivals,
  sortByUpcoming,
  type Festival,
} from "@/public/lib/festivals";

const PAGE_SIZE = 10;

function Photo({ f, className }: { f: Festival; className: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg bg-gray-300 ${className}`}
    >
      {f.image?.trim() ? (
        <Image
          src={f.image}
          alt={f.name}
          fill
          sizes="(min-width: 1024px) 40vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs text-gray-600">Photo coming soon</span>
        </div>
      )}
    </div>
  );
}

function dateLabel(festival: Festival) {
  if (festival.isTentative) {
    return festival.when?.trim()
      ? `${festival.when} · Tentative`
      : "Dates to be confirmed";
  }

  return festival.when || "Dates to be confirmed";
}

export const metadata: Metadata = {
  title: "Festivals | Kultura PH",
  description:
    "Explore Philippine festivals through the places, communities, and traditions that give them meaning.",
};

export default async function FestivalsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const { dated, tentative } = await getFestivals();

  // Mark each group explicitly, then sort dated festivals first.
  const sorted = sortByUpcoming([
    ...dated.map((festival) => ({
      ...festival,
      isTentative: false,
    })),
    ...tentative.map((festival) => ({
      ...festival,
      isTentative: true,
    })),
  ]);

  // Only a dated festival can become the featured item.
  const focus = sorted.find((festival) => !festival.isTentative);

  // The featured festival is separate from the paginated calendar.
  const rest = focus ? sorted.filter((festival) => festival !== focus) : sorted;

  const total = rest.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const requestedPage = Number(pageParam);
  const currentPage = Math.min(
    Math.max(Number.isFinite(requestedPage) ? Math.floor(requestedPage) : 1, 1),
    totalPages,
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const items = rest.slice(startIndex, startIndex + PAGE_SIZE);

  const from = total > 0 ? startIndex + 1 : 0;
  const to = Math.min(startIndex + PAGE_SIZE, total);

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  const paginationButtonClass =
    "flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 hover:bg-gray-100";

  const disabledPaginationClass =
    "flex h-7 w-7 cursor-not-allowed items-center justify-center rounded-md border border-gray-200 opacity-40";

  return (
    <div className="bg-gray-50">
      <Header />

      <main className="flex flex-col gap-10 px-5 py-10 sm:px-10">
        <div className="flex flex-col gap-4">
          <p className="text-[10px] font-semibold tracking-widest text-blue-800">
            RHYTHMS, FAITH + CELEBRATION
          </p>

          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Festivals carry a place&apos;s rhythm.
          </h1>
        </div>

        {/* Featured festival */}
        {focus && currentPage === 1 && (
          <section
            aria-labelledby="focus-heading"
            className="grid gap-8 lg:grid-cols-[3fr_2fr]"
          >
            <Photo f={focus} className="aspect-5/3" />

            <div className="flex flex-col justify-center gap-3">
              <p className="text-[10px] font-semibold tracking-widest text-blue-800">
                FESTIVAL IN FOCUS
              </p>

              <p className="text-xs">
                <span className="font-semibold uppercase text-red-700">
                  {dateLabel(focus)}
                </span>{" "}
                / {focus.place}
              </p>

              <h2 id="focus-heading" className="text-3xl font-bold">
                {focus.name}
              </h2>

              {focus.tagline && (
                <p className="text-lg font-semibold">{focus.tagline}</p>
              )}

              <p className="text-sm leading-6 text-gray-600">
                {focus.description}
              </p>

              {focus.image?.trim() && focus.credit && (
                <p className="text-[10px] text-gray-500">
                  Photo: {focus.credit}
                </p>
              )}

              <Link
                href={`/regions/${focus.regionSlug}`}
                className="mt-2 w-fit rounded-md bg-blue-800 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900"
              >
                Explore {focus.regionName}
              </Link>
            </div>
          </section>
        )}

        {/* Combined calendar */}
        <section
          aria-labelledby="calendar-heading"
          className="flex flex-col gap-2"
        >
          <h2 id="calendar-heading" className="text-2xl font-bold">
            A calendar of connection
          </h2>

          <p className="text-xs leading-5 text-gray-500">
            These are recurring seasons, not confirmed event dates. Programmes
            and local schedules can change. Festivals awaiting confirmed dates
            appear at the end.
          </p>

          {items.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {items.map((festival) => (
                <li
                  key={`${festival.regionSlug}-${festival.name}`}
                  className="grid gap-6 py-8 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[25rem_1fr]"
                >
                  <Photo f={festival} className="aspect-5/3" />

                  <div className="flex min-w-0 flex-col gap-1">
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-widest ${
                        festival.isTentative ? "text-amber-700" : "text-red-700"
                      }`}
                    >
                      {dateLabel(festival)}
                    </p>

                    <h3 className="text-2xl font-bold">{festival.name}</h3>

                    <p className="text-xs text-blue-800">
                      {festival.place} · {festival.regionName}
                    </p>

                    {festival.tagline && (
                      <p className="mt-2 font-semibold">{festival.tagline}</p>
                    )}

                    <p className="text-sm leading-6 text-gray-600">
                      {festival.description}
                    </p>

                    {festival.image?.trim() && festival.credit && (
                      <p className="mt-2 text-[10px] text-gray-500">
                        Photo: {festival.credit}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-8 text-sm text-gray-500">
              {focus
                ? "More festival stories are coming soon."
                : "No festivals available yet."}
            </p>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
              <span>
                Showing {from} - {to} of {total} festivals
              </span>

              <nav
                aria-label="Festival pagination"
                className="flex flex-wrap items-center gap-1.5"
              >
                {currentPage > 1 ? (
                  <Link
                    href={`/festivals?page=${currentPage - 1}`}
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
                    href={`/festivals?page=${page}`}
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
                    href={`/festivals?page=${currentPage + 1}`}
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

        <section className="flex flex-col gap-1 w-full bg-[#eef2ff] px-6 py-8 rounded-md">
          <h1 className="text-xs tracking-widest font-semibold text-blue-800">
            BE A THOUGHTFUL GUEST
          </h1>
          <p className="text-2xl font-semibold">
            Enjoy the celebration. Respect its meaning.
          </p>
          <span className="text-xs font-light w-1/2 text-gray-600">
            Check local organisers for current schedules. Give religious
            observances and community protocols space, ask before taking
            portraits, and remember that not every ceremony is open to visitors.
          </span>
        </section>
      </main>

      <Footer />
    </div>
  );
}
