import Header from "../components/layout/Header";
import Footer from "@/components/layout/Footer";
import MapSection from "@/components/map/MapSection";

function page() {
  return (
    <div>
      <Header />
      <main className="flex flex-col gap-5 p-10 bg-gray-50">
        <p className="text-[10px] track font-semibold text-blue-800">
          THE PHILIPPINES, THROUGH ITS PLACES
        </p>
        <h1 className="text-5xl font-bold">Every island holds a story.</h1>
        <p className="text-sm font-ligth text-gray-600">
          Begin with a place. Discover the people, traditions and everyday
          creativity that give it meaning.
        </p>
        <MapSection />
      </main>
      <Footer />
    </div>
  );
}

export default page;
