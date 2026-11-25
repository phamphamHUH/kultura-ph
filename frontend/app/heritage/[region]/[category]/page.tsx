import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { getStory, getStories, CATEGORY_LABELS } from "@/public/lib/stories";

export async function generateStaticParams() {
  return (await getStories()).map((s) => ({
    region: s.regionSlug,
    category: s.category,
  }));
}

// Renders **bold** segments from the markdown
function Inline({ text }: { text: string }) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith("**") ? (
        <strong key={i}>{part.slice(2, -2)}</strong>
      ) : (
        part
      ),
    );
}

export default async function StoryPage({
  params,
}: {
  params: Promise<{ region: string; category: string }>;
}) {
  const { region, category } = await params;
  const story = await getStory(region, category);
  if (!story) notFound();

  return (
    <div className="bg-gray-50">
      <Header />
      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-5 py-10">
        <Link href="/heritage" className="text-xs text-blue-800">
          ← All stories
        </Link>
        <p className="text-[10px] font-semibold uppercase tracking-widest text-blue-800">
          {CATEGORY_LABELS[story.category]} ·{" "}
          <Link href={`/regions/${story.regionSlug}`}>{story.regionName}</Link>
        </p>
        <h1 className="text-4xl font-bold">{story.title}</h1>
        <p className="text-lg font-semibold">{story.summary}</p>
        {story.image?.trim() && (
          <div className="my-2 flex flex-col gap-2">
            <div className="relative aspect-16/9 w-full overflow-hidden rounded-lg bg-gray-200">
              <Image
                src={story.image}
                alt={story.title}
                fill
                priority
                sizes="(min-width: 1024px) 800px, 100vw"
                className="object-cover"
              />
            </div>
            {story.credit && (
              <p className="text-[10px] text-gray-500">Photo: {story.credit}</p>
            )}
          </div>
        )}
        {story.paragraphs.map((p, i) => (
          <p key={i} className="text-sm leading-7 text-gray-600">
            <Inline text={p} />
          </p>
        ))}
      </main>
      <Footer />
    </div>
  );
}
