import { ArrowUpRight } from "lucide-react";

export type RegionInfo = {
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
        <h1 className="font-medium">PLACE IN FOCUS</h1>
        <p className="mt-6 text-sm text-gray-600">
          Region information unavailable.
        </p>
      </div>
    );
  }

  return (
    <article className="h-full min-h-105 rounded-md border border-gray-200 bg-white px-5 py-4">
      <h1 className="text-xs tracking-wider font-semibold text-blue-800">
        PLACE IN FOCUS
      </h1>
      <div className="mt-6">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-800">
          {region.islandGroup}
        </h2>
        <h1 className="mt-2 text-3xl font-bold text-gray-900">{region.name}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">
          {region.overview}
        </p>
      </div>
      {region.threads.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            A few threads to follow
          </h2>
          <ul className="mt-3 space-y-2">
            {region.threads.map((thread) => (
              <li
                key={thread}
                className="border-l-2 border-blue-800 pl-3 text-sm text-gray-700"
              >
                {thread}
              </li>
            ))}
          </ul>
        </div>
      )}
      <a
        href={`/regions/${region.slug}`}
        className="mt-6 flex items-center w-fit gap-3 border border-gray-200 p-4 rounded-md text-sm font-semibold text-white bg-blue-800"
      >
        <span>Discover {region.name}</span>
        <ArrowUpRight size={18} />
      </a>
    </article>
  );
}
