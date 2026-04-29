import type { Metadata } from "next";
import Link from "next/link";
import { CategoryNav } from "@/components/CategoryNav";
import { ImageCard } from "@/components/ImageCard";
import { ImageGrid } from "@/components/ImageGrid";
import { MarketingFooter } from "@/components/MarketingFooter";
import { createSupabaseAdmin } from "@/lib/supabase/server";
import { DEFAULT_SOCIAL_IMAGE } from "@/lib/seo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Animal Clip Art — Free A-Z Animal Images | clip.art",
  description:
    "Browse and download free animal clip art from A to Z. Explore animals by letter — lions, elephants, dolphins, pandas and thousands more. Generate custom animal illustrations with AI.",
  openGraph: {
    title: "Animal Clip Art — Free A-Z Animal Images | clip.art",
    description:
      "Browse free animal clip art from A to Z. Generate custom animal illustrations with AI instantly.",
    url: "https://clip.art/animals",
    siteName: "clip.art",
    type: "website",
    images: [DEFAULT_SOCIAL_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Animal Clip Art — Free A-Z Animal Images | clip.art",
    description:
      "Free animal clip art from A to Z. AI-generated animal illustrations for any project.",
    images: [DEFAULT_SOCIAL_IMAGE.url],
  },
  alternates: {
    canonical: "https://clip.art/animals",
  },
};

const ANIMAL_LETTERS: { letter: string; examples: string[] }[] = [
  { letter: "A", examples: ["Alligator", "Alpaca", "Axolotl"] },
  { letter: "B", examples: ["Bear", "Butterfly", "Bison"] },
  { letter: "C", examples: ["Cat", "Cheetah", "Chameleon"] },
  { letter: "D", examples: ["Dolphin", "Deer", "Dragonfly"] },
  { letter: "E", examples: ["Elephant", "Eagle", "Echidna"] },
  { letter: "F", examples: ["Fox", "Flamingo", "Frog"] },
  { letter: "G", examples: ["Giraffe", "Gorilla", "Goldfish"] },
  { letter: "H", examples: ["Horse", "Hummingbird", "Hedgehog"] },
  { letter: "I", examples: ["Iguana", "Impala", "Ibis"] },
  { letter: "J", examples: ["Jaguar", "Jellyfish", "Jackrabbit"] },
  { letter: "K", examples: ["Koala", "Kangaroo", "Kingfisher"] },
  { letter: "L", examples: ["Lion", "Leopard", "Llama"] },
  { letter: "M", examples: ["Monkey", "Moose", "Manatee"] },
  { letter: "N", examples: ["Narwhal", "Nightingale", "Newt"] },
  { letter: "O", examples: ["Owl", "Octopus", "Otter"] },
  { letter: "P", examples: ["Panda", "Penguin", "Peacock"] },
  { letter: "Q", examples: ["Quokka", "Quetzal", "Quail"] },
  { letter: "R", examples: ["Rabbit", "Red Panda", "Raccoon"] },
  { letter: "S", examples: ["Shark", "Sloth", "Seahorse"] },
  { letter: "T", examples: ["Tiger", "Turtle", "Toucan"] },
  { letter: "U", examples: ["Umbrellabird", "Uakari", "Urchin"] },
  { letter: "V", examples: ["Vulture", "Viper", "Vicuña"] },
  { letter: "W", examples: ["Wolf", "Whale", "Wombat"] },
  { letter: "X", examples: ["X-ray Tetra", "Xerus", "Xenops"] },
  { letter: "Y", examples: ["Yak", "Yellow Tang", "Yellowjacket"] },
  { letter: "Z", examples: ["Zebra", "Zebrafish", "Zebu"] },
];

interface FeaturedImage {
  id: string;
  prompt: string;
  title: string | null;
  image_url: string;
  style: string;
  category: string;
  slug: string | null;
  aspect_ratio: string;
  created_at: string;
}

async function getFeaturedAnimalImages(): Promise<FeaturedImage[]> {
  try {
    const admin = createSupabaseAdmin();
    const { data } = await admin
      .from("generations")
      .select(
        "id, prompt, title, image_url, style, category, slug, aspect_ratio, created_at",
      )
      .eq("content_type", "clipart")
      .eq("is_public", true)
      .or(
        "category.like.animals-that-start-with-%,category.eq.cat,prompt.ilike.%animal%",
      )
      .order("created_at", { ascending: false })
      .limit(12);
    return (data || []) as FeaturedImage[];
  } catch {
    return [];
  }
}

export default async function AnimalsHubPage() {
  const featured = await getFeaturedAnimalImages();

  return (
    <div className="min-h-screen bg-white">
      <CategoryNav />

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-4 pb-10 pt-12 text-center sm:pt-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
          Animal{" "}
          <span className="gradient-text">Clip Art</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-500 sm:text-lg">
          Browse free animal clip art from A to Z. Explore thousands of animals
          organized by letter, or generate your own custom animal illustrations
          with AI in seconds.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/create" className="btn-primary text-base">
            Generate Animal Clip Art
          </Link>
        </div>
      </section>

      {/* A–Z Letter Grid */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
          Animals that start with every letter
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {ANIMAL_LETTERS.map(({ letter, examples }) => (
            <Link
              key={letter}
              href={`/animals-that-start-with-${letter.toLowerCase()}`}
              className="group rounded-2xl border border-gray-100 bg-gray-50 p-4 text-center shadow-sm transition-all hover:border-pink-200 hover:bg-pink-50 hover:shadow-md"
            >
              <p className="text-2xl font-extrabold text-gray-800 group-hover:text-pink-700 sm:text-3xl">
                {letter}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {examples.join(", ")}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Gallery */}
      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
            Recently created animal clip art
          </h2>
          <ImageGrid>
            {featured.map((img) => (
              <ImageCard
                key={img.id}
                image={{
                  slug: img.slug || img.id,
                  title: img.title || img.prompt,
                  url: img.image_url,
                  category: img.category,
                }}
                href={`/${img.category}/${img.slug || img.id}`}
              />
            ))}
          </ImageGrid>
        </section>
      )}

      {/* Cross-links */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="mb-6 text-center text-xl font-bold text-gray-900 sm:text-2xl">
          More animal content
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/coloring-pages/animals"
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 hover:shadow-md"
          >
            Animal Coloring Pages
          </Link>
          <Link
            href="/illustrations/animals-scenes"
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 hover:shadow-md"
          >
            Animal Illustrations
          </Link>
          <Link
            href="/design-bundles/animals"
            className="rounded-full border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-pink-300 hover:bg-pink-50 hover:text-pink-700 hover:shadow-md"
          >
            Animal Design Packs
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <div className="rounded-3xl bg-brand-gradient p-[2px]">
          <div className="rounded-[22px] bg-white p-8 text-center sm:p-10">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Create custom animal clip art
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-gray-500 sm:text-base">
              Describe any animal and our AI will generate unique clip art in
              seconds. Lions, pandas, narwhals, axolotls — if you can name it,
              we can create it.
            </p>
            <div className="mt-8">
              <Link href="/create" className="btn-primary px-8 text-base">
                Start Creating — It&apos;s Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEO Content */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <p className="text-sm leading-relaxed text-gray-600 sm:text-base">
          clip.art&apos;s animal clip art collection spans the entire alphabet
          — from alligators and alpacas to zebras and zebrafish. Whether
          you&apos;re a teacher building an animal alphabet activity, a designer
          creating wildlife-themed graphics, or a parent looking for cute animal
          images for a birthday party, our library and AI generator have you
          covered. Every animal illustration is free to download and use for
          personal and commercial projects.
        </p>
        <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
          Explore animals by letter to discover creatures from every habitat —
          ocean animals like dolphins and seahorses, wild animals like tigers
          and wolves, farm animals like horses and chickens, and exotic species
          like quokkas and axolotls. Each letter page features curated clip art,
          detailed descriptions, and AI generation prompts to help you create
          exactly the animal illustration you need.
        </p>
      </section>

      <MarketingFooter />
    </div>
  );
}
