import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "About Us | Kultura PH",
  description:
    "Meet Kultura PH, a digital atlas for discovering Philippine places, cultural traditions, and stories with curiosity and care.",
};

const principles = [
  {
    number: "01",
    title: "Begin with geography",
    description:
      "Places help us find connections, not draw rigid boundaries around people. Start with a city, landscape, or region, then follow the histories, movements, and relationships that reach beyond it.",
  },
  {
    number: "02",
    title: "People are not exhibits",
    description:
      "Culture is lived, adapted, and changed. Name communities carefully, distinguish their practices, and avoid presenting a performance, garment, or object as the whole identity of a people.",
  },
  {
    number: "03",
    title: "Follow the references",
    description:
      "An atlas is a starting point. Continue with community-led accounts, museums, local cultural offices, and cultural institutions. References provide context; they do not imply endorsement of this atlas.",
  },
];

const eyebrowClassName =
  "text-[10px] font-semibold uppercase leading-5 tracking-[0.18em] text-blue-800";

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900">
      <Header />

      <main className="mx-auto w-full flex-1 px-5 pb-12 pt-10 sm:px-8 lg:px-10 lg:pt-10">
        {/* Introduction */}
        <section aria-labelledby="about-heading">
          <p className={eyebrowClassName}>
            A digital atlas of Philippine culture
          </p>

          <h1
            id="about-heading"
            className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl"
          >
            Meet Kultura PH.
          </h1>

          <p className="mt-4 max-w-3xl text-sm leading-7 text-gray-500">
            A place to begin discovering the stories of the Philippines—with
            curiosity, context, and care.
          </p>

          <div className="mt-9 grid items-start gap-7 md:grid-cols-[1.55fr_1fr] lg:gap-9">
            <Image
              width={1000}
              height={500}
              src="/content/images/about/ifugao.jpg"
              alt="Ifugao natives"
            />

            <div className="py-2 md:py-5">
              <p className={eyebrowClassName}>Our starting point</p>

              <h2 className="mt-3 text-2xl font-medium leading-tight tracking-tight sm:text-3xl">
                Many voices. Many ways of belonging.
              </h2>

              <div className="mt-5 space-y-4 text-sm leading-7 text-gray-500">
                <p>
                  The Philippines cannot be understood through a single story.
                  Its places hold overlapping histories, distinct communities,
                  and traditions that continue to change.
                </p>

                <p>
                  Kultura PH connects places with cultural context. Explore a
                  location, encounter a festival, or follow a thread of living
                  heritage. Every path is an invitation to learn more—not a
                  claim to tell the whole story.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Principles */}
        <section
          aria-labelledby="principles-heading"
          className="mt-10 border-t border-gray-200/80 pt-6 sm:mt-12"
        >
          <div className="grid gap-4 pb-6 md:grid-cols-2 md:gap-10">
            <div>
              <p className={eyebrowClassName}>How we approach the atlas</p>

              <h2
                id="principles-heading"
                className="mt-2 text-2xl font-medium tracking-tight"
              >
                Curiosity, with responsibility.
              </h2>
            </div>

            <p className="text-sm leading-7 text-gray-500">
              A useful atlas makes room for complexity. These principles guide
              how places and cultural practices are introduced here.
            </p>
          </div>

          <ol>
            {principles.map((principle) => (
              <li
                key={principle.number}
                className="grid gap-3 border-t border-gray-200/80 py-6 sm:grid-cols-[32px_1fr] sm:gap-x-5 md:grid-cols-[40px_0.85fr_1.3fr]"
              >
                <span className="pt-1 text-[10px] font-medium tracking-wider text-blue-800">
                  {principle.number}
                </span>

                <h3 className="text-lg font-medium tracking-tight">
                  {principle.title}
                </h3>

                <p className="text-sm leading-7 text-gray-500 sm:col-start-2 md:col-start-auto">
                  {principle.description}
                </p>
              </li>
            ))}
          </ol>
        </section>

        {/* Context */}
        <section
          aria-labelledby="context-heading"
          className="mt-3 grid items-start gap-7 border-t border-gray-200/80 pt-9 md:grid-cols-[0.8fr_1.3fr] lg:gap-9"
        >
          <Image
            width={1000}
            height={500}
            src="/content/images/about/festival-1.jpg"
            alt="festival"
          />

          <div>
            <p className={eyebrowClassName}>Go beyond the overview</p>

            <h2
              id="context-heading"
              className="mt-3 text-2xl font-medium tracking-tight"
            >
              A little context changes how we look.
            </h2>

            <div className="mt-4 space-y-4 text-sm leading-7 text-gray-500">
              <p>
                No single profile can represent a whole people. A place name is
                not a cultural boundary, and a tradition should not be separated
                from the community that gives it meaning.
              </p>

              <p>
                When you visit, listen first. Ask about local protocols, seek
                consent before taking photographs, and support makers on their
                own terms. When you read, compare sources and pay attention to
                whose voices are present.
              </p>
            </div>
          </div>
        </section>

        {/* Call to action */}
        <section
          aria-labelledby="explore-heading"
          className="mt-10 rounded-lg bg-[#eef2ff] p-6 sm:mt-12 sm:p-8"
        >
          <p className={eyebrowClassName}>Your next chapter</p>

          <h2
            id="explore-heading"
            className="mt-3 text-2xl font-medium tracking-tight sm:text-3xl"
          >
            Start somewhere. Stay curious.
          </h2>

          <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-500">
            Begin with a place, follow a celebration, or discover a living
            tradition. Let one story lead you toward another.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-3 rounded-md bg-blue-800 px-4 py-3 text-xs font-semibold text-white transition-colors hover:bg-blue-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800"
            >
              Explore the atlas
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>

            <Link
              href="/heritage"
              className="inline-flex items-center justify-center gap-3 rounded-md border border-gray-200 bg-white px-4 py-3 text-xs font-semibold text-blue-800 transition-colors hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-800"
            >
              Read living heritage
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
