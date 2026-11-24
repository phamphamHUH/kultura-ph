"use client";

import dynamic from "next/dynamic";
import type { PhilippinesMapProps } from "./PhilippinesMap";

// Leaflet touches `window`, so it must never render on the server.
// `ssr: false` is only allowed inside a Client Component, which is why
// this wrapper exists.
const PhilippinesMap = dynamic(() => import("./PhilippinesMap"), {
  ssr: false,
  loading: () => (
    <div
      role="status"
      aria-label="Loading map"
      className="h-full min-h-105 animate-pulse rounded-md border border-gray-200 bg-gray-100"
    />
  ),
});

export default function MapLoader(props: PhilippinesMapProps) {
  return <PhilippinesMap {...props} />;
}
