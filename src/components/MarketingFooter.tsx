import Link from "next/link";
import { getAllCategories, getColoringThemes, type DbCategory } from "@/lib/categories";
import { getAllPosts } from "@/lib/learn";

export async function MarketingFooter() {
  const [categories, coloringThemes, learnPosts] = await Promise.all([
    getAllCategories(),
    getColoringThemes(),
    Promise.resolve(getAllPosts()),
  ]);

  const activeThemes = coloringThemes.filter((t) => t.slug !== "coloring-free");

  return (
    <footer className="relative overflow-hidden bg-[#11111a] text-gray-400">
      <div aria-hidden className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-pink-500/10 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -right-20 top-24 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-10">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <Link href="/" aria-label="clip.art home" className="inline-flex">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-white.svg" className="h-7" alt="clip.art" />
              </Link>
              <h2 className="mt-6 max-w-xl text-2xl font-black tracking-tight text-white sm:text-3xl">
                Free transparent clip art for classrooms, shops, crafts, and everyday design.
              </h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-500">
                Browse reusable clip art, generate exactly what you need, and download assets for personal or commercial projects with no attribution required.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
              <Link href="/search" className="rounded-full bg-white px-5 py-3 text-center text-sm font-bold text-gray-950 transition-colors hover:bg-gray-100">
                Browse Clip Art
              </Link>
              <Link href="/create" className="rounded-full border border-white/15 px-5 py-3 text-center text-sm font-bold text-white transition-colors hover:border-white/30 hover:bg-white/10">
                Generate Clip Art
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-300">Clip Art</h4>
            <ul className="space-y-2.5">
              <li><Link href="/search" className="text-sm transition-colors hover:text-white">Explore All Clip Art</Link></li>
              {categories.slice(0, 8).map((cat: DbCategory) => (
                <li key={cat.slug}>
                  <Link href={`/${cat.slug}`} className="text-sm transition-colors hover:text-white">
                    {cat.name} Clip Art
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-300">Create</h4>
            <ul className="space-y-2.5">
              <li><Link href="/create" className="text-sm transition-colors hover:text-white">AI Clip Art Generator</Link></li>
              <li><Link href="/design-bundles" className="text-sm transition-colors hover:text-white">Design Bundles</Link></li>
              <li><Link href="/stickers" className="text-sm transition-colors hover:text-white">AI Sticker Generator</Link></li>
              <li><Link href="/animations" className="text-sm transition-colors hover:text-white">Animated Clip Art</Link></li>
              <li><Link href="/packs" className="text-sm transition-colors hover:text-white">Packs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-300">More Formats</h4>
            <ul className="space-y-2.5">
              <li><Link href="/coloring-pages" className="text-sm transition-colors hover:text-white">Coloring Pages</Link></li>
              <li><Link href="/worksheets" className="text-sm transition-colors hover:text-white">Worksheets</Link></li>
              <li><Link href="/illustrations" className="text-sm transition-colors hover:text-white">Illustrations</Link></li>
              {activeThemes.slice(0, 3).map((theme: DbCategory) => (
                <li key={theme.slug}>
                  <Link href={`/coloring-pages/${theme.slug}`} className="text-sm transition-colors hover:text-white">
                    {theme.name} Coloring Pages
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-300">Learn</h4>
            <ul className="space-y-2.5">
              <li><Link href="/learn" className="text-sm transition-colors hover:text-white">All Tutorials</Link></li>
              {learnPosts.slice(0, 5).map((post) => (
                <li key={post.slug}>
                  <Link href={`/learn/${post.slug}`} className="text-sm transition-colors hover:text-white">
                    {post.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-300">
              <Link href="/animals" className="transition-colors hover:text-white">Animals A-Z</Link>
            </h4>
            <div className="grid grid-cols-6 gap-1.5">
              {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map((letter) => (
                <Link
                  key={letter}
                  href={`/animals-that-start-with-${letter.toLowerCase()}`}
                  aria-label={`Animals that start with ${letter}`}
                  title={`Animals that start with ${letter}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm font-semibold text-gray-400 transition-colors hover:bg-pink-500/20 hover:text-white"
                >
                  {letter}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center gap-4 border-t border-white/10 pt-8 sm:flex-row sm:justify-between">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} clip.art. All images are free for personal and commercial use.
            </p>
            <p className="text-[11px] text-gray-600">
              A division of{" "}
              <a href="https://esy.com" target="_blank" rel="noopener noreferrer" className="text-gray-500 transition-colors hover:text-white">ESY LLC</a>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
            <Link href="/search" className="text-xs text-gray-500 transition-colors hover:text-white">Explore</Link>
            <Link href="/create" className="text-xs text-gray-500 transition-colors hover:text-white">Generator</Link>
            <Link href="/learn" className="text-xs text-gray-500 transition-colors hover:text-white">Learn</Link>
            <Link href="/coloring-pages" className="text-xs text-gray-500 transition-colors hover:text-white">Coloring Pages</Link>
            <Link href="/animations" className="text-xs text-gray-500 transition-colors hover:text-white">Animations</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
