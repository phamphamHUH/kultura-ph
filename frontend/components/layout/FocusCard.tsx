import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

export type RegionInfo = {
  image: string;
  name: string;
  slug: string;
  islandGroup: string;
  overview: string;
  threads: string[];
};

export default function FocusCard({
  region,
  loading,
}: {
  region: RegionInfo | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="h-full min-h-105 animate-pulse rounded-md border border-gray-200 bg-white px-5 py-4">
        <div className="h-4 w-28 rounded bg-gray-200" />
        <div className="mt-8 h-5 w-20 rounded bg-gray-200" />
        <div className="mt-3 h-8 w-48 rounded bg-gray-200" />
        <div className="mt-4 h-20 rounded bg-gray-200" />
      </div>
    );
  }

  if (!region) {
    return (
      <div className="h-full min-h-105 rounded-md border border-gray-200 bg-white px-5 py-4">
        <p className="text-xs font-semibold tracking-wider text-blue-800">
          PLACE IN FOCUS
        </p>

        <p className="mt-6 text-sm text-gray-600">
          Region information unavailable.
        </p>
      </div>
    );
  }

  return (
    <article className="h-full min-h-105 rounded-md border border-gray-200 bg-white px-5 py-4">
      <p className="text-xs font-semibold tracking-wider text-blue-800">
        PLACE IN FOCUS
      </p>

      {/* Image: fills the card width and is cropped from the center.
          Falls back to a gray block when the region has no image yet. */}
      <div className="relative mx-auto mt-4 h-40 w-full overflow-hidden rounded-lg bg-gray-200">
        {region.image && (
          <Image
            src={region.image}
            alt={`${region.name}`}
            fill
            sizes="(max-width: 1024px) 100vw, 400px"
            className="object-cover object-center"
          />
        )}
      </div>

      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-blue-800">
          {region.islandGroup}
        </p>
        <h2 className="mt-2 text-3xl font-bold text-gray-900">{region.name}</h2>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {region.overview}
        </p>
      </div>

      {region.threads.length > 0 && (
        <div className="mt-6 border-t border-gray-200 pt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            A few threads to follow
          </h3>
          <ul className="mt-3 space-y-2">
            {region.threads.map((thread) => (
              <li
                key={thread}
                className="border-l-2 border-blue-800 pl-3 text-xs font-light text-gray-600"
              >
                {thread}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href={`/regions/${region.slug}`}
        className="mt-6 flex w-fit items-center gap-3 rounded-md border border-gray-200 bg-blue-800 p-4 text-sm font-semibold text-white transition-colors hover:bg-blue-900"
      >
        <span>Discover {region.name}</span>
        <ArrowUpRight size={18} />
      </Link>
    </article>
  );
}
