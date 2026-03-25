import Link from "next/link";
import { LearnNav } from "@/components/learn/LearnNav";
import { getAllCategories, getColoringThemes, type DbCategory } from "@/lib/categories";
import { getAllPosts } from "@/lib/learn";

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [categories, coloringThemes, posts] = await Promise.all([
    getAllCategories(),
    getColoringThemes(),
    Promise.resolve(getAllPosts()),
  ]);

  const activeThemes = coloringThemes.filter((t) => t.slug !== "coloring-free");

  return (
    <div className="min-h-screen bg-white">
      <LearnNav />
      <main>{children}</main>

      {/* ── FOOTER (mirrors homepage mega footer) ── */}
      <footer className="bg-[#0a0a0a] text-gray-400">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-10">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Link href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo-white.svg" className="h-7" alt="clip.art" />
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-gray-500">
                Free AI-powered clip art and coloring page generator. Describe
                what you want, download it in seconds. No attribution required.
              </p>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-300">
                Create
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/create"
                    className="text-sm transition-colors hover:text-white"
                  >
                    AI Clip Art Generator
                  </Link>
                </li>
                <li>
                  <Link
                    href="/create/coloring-pages"
                    className="text-sm transition-colors hover:text-white"
                  >
                    Coloring Page Generator
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-300">
                Learn
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link
                    href="/learn"
                    className="text-sm transition-colors hover:text-white"
                  >
                    All Tutorials
                  </Link>
                </li>
                {posts.slice(0, 5).map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/learn/${post.slug}`}
                      className="text-sm transition-colors hover:text-white"
                    >
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-300">
                Browse
              </h4>
              <ul className="space-y-2.5">
                {categories.slice(0, 4).map((cat: DbCategory) => (
                  <li key={cat.slug}>
                    <Link
                      href={`/${cat.slug}`}
                      className="text-sm transition-colors hover:text-white"
                    >
                      {cat.name} Clip Art
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    href="/coloring-pages"
                    className="text-sm transition-colors hover:text-white"
                  >
                    All Coloring Pages
                  </Link>
                </li>
                {activeThemes.slice(0, 3).map((theme: DbCategory) => (
                  <li key={theme.slug}>
                    <Link
                      href={`/coloring-pages/${theme.slug}`}
                      className="text-sm transition-colors hover:text-white"
                    >
                      {theme.name} Coloring Pages
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
            <p className="text-xs text-gray-500">
              &copy; {new Date().getFullYear()} clip.art. All images are free
              for personal and commercial use.
            </p>
            <div className="flex items-center gap-5">
              <Link
                href="/create"
                className="text-xs text-gray-500 transition-colors hover:text-white"
              >
                Generator
              </Link>
              <Link
                href="/learn"
                className="text-xs text-gray-500 transition-colors hover:text-white"
              >
                Learn
              </Link>
              <Link
                href="/coloring-pages"
                className="text-xs text-gray-500 transition-colors hover:text-white"
              >
                Coloring Pages
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
