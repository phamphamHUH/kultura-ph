import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Page not found | Kultura PH",
  description: "This page could not be found.",
};

const eyebrow =
  "text-[10px] font-semibold uppercase tracking-widest text-blue-800";

const paths = [
  {
    label: "Explore the atlas",
    description: "Begin with a place on the map.",
    href: "/",
  },
  {
    label: "Festivals",
    description: "Follow a celebration through the year.",
    href: "/festivals",
  },
  {
    label: "Living heritage",
    description: "Read stories of crafts, food and places.",
    href: "/heritage",
  },
];

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="mx-auto flex w-full flex-1 flex-col gap-10 px-5 py-14 sm:px-10">
        <div className="flex flex-col gap-4">
          <p className={eyebrow}>Error 404</p>

          <h1 className="text-4xl font-bold sm:text-5xl">
            This path leads nowhere. Yet.
          </h1>

          <p className="max-w-xl text-sm leading-6 text-gray-600">
            The page you were looking for may have moved, or the address may
            have a typo. Every island holds a story, so try one of these places
            instead.
          </p>
        </div>

        <ul className="grid gap-4 md:grid-cols-3">
          {paths.map((path) => (
            <li key={path.href}>
              <Link
                href={path.href}
                className="group flex h-full flex-col gap-2 rounded-lg border border-gray-200 bg-white p-5 transition-colors hover:border-blue-800 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800"
              >
                <span className="flex items-center justify-between text-lg font-semibold">
                  {path.label}
                  <ArrowUpRight
                    size={18}
                    aria-hidden="true"
                    className="text-blue-800 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  />
                </span>
                <span className="text-sm leading-6 text-gray-600">
                  {path.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/"
          className="inline-flex w-fit items-center gap-3 rounded-md bg-blue-800 px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800"
        >
          Back to home
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </main>

      <Footer />
    </div>
  );
}
