import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getRegion, getRegionSlugs } from "@/public/lib/regions";

export async function generateStaticParams() {
  return (await getRegionSlugs()).map((slug) => ({ slug }));
}

const eyebrow =
  "text-[10px] font-semibold uppercase tracking-widest text-blue-800";
const link =
  "inline-flex w-fit items-center gap-1.5 text-xs font-semibold text-blue-800 hover:underline";

function Photo({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative aspect-5/2 overflow-hidden rounded-lg bg-gray-300">
      {src.trim() ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
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

function Row({
  id,
  label,
  title,
  children,
}: {
  id: string;
  label: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="grid scroll-mt-6 gap-4 border-t border-gray-200 py-8 md:grid-cols-[16rem_1fr] md:gap-10"
    >
      <div>
        <p className={eyebrow}>{label}</p>
        <h2
          id={`${id}-heading`}
          className="mt-2 text-2xl font-semibold tracking-tight"
        >
          {title}
        </h2>
      </div>
      <div className="flex min-w-0 flex-col gap-4">{children}</div>
    </section>
  );
}

function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((item) => (
        <li
          key={item}
          className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 text-sm leading-6 text-gray-600">
      {items.map((item) => (
        <li key={item} className="border-l-2 border-blue-800 pl-3">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function RegionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const region = await getRegion(slug);
  if (!region) notFound();

  const intro = region.overview.split(/(?<=[.!?])\s/)[0] ?? "";
  const allFestivals = [
    ...region.festivals.map((f) => ({ ...f, tentative: false })),
    ...region.tentativeFestivals.map((f) => ({ ...f, tentative: true })),
  ];

  const sections = [
    { id: "festivals", label: "Festivals", show: allFestivals.length > 0 },
    { id: "arts", label: "Arts", show: region.crafts.length > 0 },
    { id: "cuisine", label: "Cuisine", show: region.food.length > 0 },
    { id: "community", label: "Community", show: region.provinces.length > 0 },
    { id: "languages", label: "Languages", show: region.languages.length > 0 },
    {
      id: "landmarks",
      label: "Landmarks",
      show: region.heritageSites.length > 0,
    },
  ].filter((s) => s.show);

  return (
    <div className="bg-gray-50 text-gray-900">
      <Header />

      <main className="flex flex-col gap-8 px-5 py-10 sm:px-10">
        <Link href="/" className="w-fit text-xs text-blue-800 hover:underline">
          ← Back to atlas
        </Link>

        {/* Intro */}
        <div className="flex flex-col gap-4">
          <p className={eyebrow}>
            Region profile / {region.islandGroup} / {region.regionalCenter}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            {region.name}, in cultural context.
          </h1>
          {intro && (
            <p className="max-w-2xl text-sm leading-6 text-gray-600">{intro}</p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Photo src={region.image} alt={region.name} />
          {region.image.trim() && region.imageCredit && (
            <p className="text-[10px] text-gray-500">
              Photo: {region.imageCredit}
            </p>
          )}
        </div>

        {/* Start with context */}
        <section className="grid gap-4 md:grid-cols-[16rem_1fr] md:gap-10">
          <div>
            <p className={eyebrow}>A place, not a single story</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
              Start with context.
            </h2>
          </div>
          <div className="flex flex-col gap-4 text-sm leading-7 text-gray-600">
            <p>{region.overview}</p>
            <p>
              This introduction is a way in, not a complete portrait. Follow the
              distinctions between communities, and seek out their own voices.
            </p>
          </div>
        </section>

        {/* Jump links */}
        <nav aria-label="On this page" className="flex flex-wrap gap-2">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-blue-800 hover:bg-blue-50"
            >
              {s.label}
            </a>
          ))}
        </nav>

        <div>
          {region.provinces.length > 0 && (
            <Row
              id="community"
              label="Community heritage"
              title="Many histories share this place."
            >
              <Chips items={region.provinces} />
            </Row>
          )}

          {region.languages.length > 0 && (
            <Row
              id="languages"
              label="Languages and peoples"
              title="Listen to the region."
            >
              <Chips items={region.languages} />
            </Row>
          )}

          {allFestivals.length > 0 && (
            <Row id="festivals" label="Festivals" title="Gratitude, gathered.">
              <ul className="flex flex-col gap-6">
                {allFestivals.map((f) => (
                  <li key={f.name} className="flex flex-col gap-1">
                    <p
                      className={`text-[10px] font-semibold uppercase tracking-widest ${
                        f.tentative ? "text-amber-700" : "text-red-700"
                      }`}
                    >
                      {f.when || "Dates to be confirmed"}
                      {f.tentative ? " · Tentative" : ""}
                    </p>
                    <h3 className="text-lg font-semibold">{f.name}</h3>
                    {f.tagline && (
                      <p className="text-sm font-medium">{f.tagline}</p>
                    )}
                    <p className="text-sm leading-6 text-gray-600">
                      {f.description}
                    </p>
                  </li>
                ))}
              </ul>
              <Link href="/festivals" className={link}>
                See the festival calendar{" "}
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </Row>
          )}

          {region.crafts.length > 0 && (
            <Row
              id="arts"
              label="Crafts and arts"
              title="Knowledge held in the making."
            >
              <Bullets items={region.crafts} />
              <Link href={`/heritage/${region.slug}/crafts`} className={link}>
                Read the story <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </Row>
          )}

          {region.food.length > 0 && (
            <Row
              id="cuisine"
              label="Local cuisine"
              title="A table of many influences."
            >
              <Bullets items={region.food} />
              <Link href={`/heritage/${region.slug}/food`} className={link}>
                Read the story <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </Row>
          )}

          {region.heritageSites.length > 0 && (
            <Row
              id="landmarks"
              label="Heritage places"
              title="Read the layers of the place."
            >
              <Bullets items={region.heritageSites} />
              <Link href={`/heritage/${region.slug}/heritage`} className={link}>
                Read the story <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </Row>
          )}
        </div>

        {/* Call to action */}
        <section className="rounded-lg bg-[#eef2ff] p-6 sm:p-8">
          <p className={eyebrow}>Keep exploring</p>
          <h2 className="mt-3 text-2xl font-medium tracking-tight">
            Let local voices lead the next step.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600">
            Continue with community accounts, museums, and local cultural
            offices. Read living heritage for stories carried by the people who
            practise them.
          </p>
          <Link
            href="/heritage"
            className="mt-5 inline-flex items-center gap-3 rounded-md bg-blue-800 px-4 py-3 text-xs font-semibold text-white hover:bg-blue-900"
          >
            Explore living heritage
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </main>

      <Footer />
    </div>
  );
}
