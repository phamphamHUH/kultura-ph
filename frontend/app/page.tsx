import React from "react";
import Header from "../components/layout/Header";
import Footer from "@/components/layout/Footer";

function page() {
  return (
    <div>
      <Header />
      <main className="flex flex-col gap-5 p-10">
        <p className="text-[10px] tracking-widest font-semibold text-blue-800">
          THE PHILIPPINES, THROUGH ITS PLACES
        </p>
        <h1 className="text-5xl font-bold">Every island holds a story.</h1>
        <p className="text-sm font-ligth text-gray-600">
          Begin with a place. Discover the people, traditions and everyday
          creativity that give it meaning.
        </p>
      </main>
      <Footer />
    </div>
  );
}

export default page;
