import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HomeExplorer from "@/components/layout/HomeExplorer";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kultura PH",
  description:
    "Meet Kultura PH, a digital atlas for discovering Philippine places, cultural traditions, and stories with curiosity and care.",
};

export default function HomePage() {
  return (
    <div>
      <Header />
      <main className="flex flex-col gap-5 bg-gray-50 p-10">
        <p className="text-[10px] font-semibold tracking-widest text-blue-800">
          THE PHILIPPINES, THROUGH ITS PLACES
        </p>

        <h1 className="text-5xl font-bold text-gray-900">
          Every island holds a story.
        </h1>

        <p className="max-w-2xl text-sm font-light text-gray-600">
          Begin with a place. Discover the people, traditions, and everyday
          creativity that give it meaning.
        </p>

        <HomeExplorer />
      </main>
      <Footer />
    </div>
  );
}
