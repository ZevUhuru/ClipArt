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
    <footer className="bg-[#1c1c27] text-gray-400">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-10">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-white.svg" className="h-7" alt="clip.art" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
              Free AI-powered clip art and coloring page generator. Describe what you want, download it in seconds. No attribution required.
            </p>
          </div>

          {/* Create */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-300">Create</h4>
            <ul className="space-y-2.5">
              <li><Link href="/create" className="text-sm transition-colors hover:text-white">AI Clip Art Generator</Link></li>
              <li><Link href="/create/coloring-pages" className="text-sm transition-colors hover:text-white">Coloring Page Generator</Link></li>
              <li><Link href="/animations" className="text-sm transition-colors hover:text-white">Animated Clip Art</Link></li>
              <li><Link href="/stickers" className="text-sm transition-colors hover:text-white">AI Sticker Generator</Link></li>
            </ul>
          </div>

          {/* Learn */}
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

          {/* Clip Art */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-300">Clip Art</h4>
            <ul className="space-y-2.5">
              {categories.slice(0, 8).map((cat: DbCategory) => (
                <li key={cat.slug}>
                  <Link href={`/${cat.slug}`} className="text-sm transition-colors hover:text-white">
                    {cat.name} Clip Art
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Coloring Pages */}
          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-300">Coloring Pages</h4>
            <ul className="space-y-2.5">
              <li><Link href="/coloring-pages" className="text-sm transition-colors hover:text-white">All Coloring Pages</Link></li>
              {activeThemes.slice(0, 7).map((theme: DbCategory) => (
                <li key={theme.slug}>
                  <Link href={`/coloring-pages/${theme.slug}`} className="text-sm transition-colors hover:text-white">
                    {theme.name} Coloring Pages
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
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
            <Link href="/create" className="text-xs text-gray-500 transition-colors hover:text-white">Generator</Link>
            <Link href="/animations" className="text-xs text-gray-500 transition-colors hover:text-white">Animations</Link>
            <Link href="/learn" className="text-xs text-gray-500 transition-colors hover:text-white">Learn</Link>
            <Link href="/coloring-pages" className="text-xs text-gray-500 transition-colors hover:text-white">Coloring Pages</Link>
            <Link href="/stickers" className="text-xs text-gray-500 transition-colors hover:text-white">Stickers</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
