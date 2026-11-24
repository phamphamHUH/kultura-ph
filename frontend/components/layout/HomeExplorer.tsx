"use client";

import { useState } from "react";
import MapSection from "@/components/map/MapSection";
import SuggestionCard from "@/components/layout/SuggestionCard";

export default function HomeExplorer() {
  const [selectedSlug, setSelectedSlug] = useState("region-1");

  return (
    <>
      <MapSection
        selectedSlug={selectedSlug}
        onSelectedSlugChange={setSelectedSlug}
      />

      <SuggestionCard selectedSlug={selectedSlug} />
    </>
  );
}
