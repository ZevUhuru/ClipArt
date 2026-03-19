import { Nav } from "@/components/Nav";
import { Generator } from "@/components/Generator";
import { MosaicBackground } from "@/components/MosaicBackground";

export default function Home() {
  return (
    <main className="relative h-screen overflow-hidden bg-[#0a0a0a]">
      {/* Animated mosaic background */}
      <MosaicBackground />

      {/* Content layer */}
      <div className="relative z-10 flex h-full flex-col">
        <Nav />

        {/* Centered generator card */}
        <div className="flex flex-1 items-center justify-center px-4 py-6">
          <div className="w-full max-w-xl">
            {/* Hero text */}
            <div className="mb-6 text-center">
              <h1 className="font-futura-bold text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-white">Generate Clip Art</span>
                <span className="gradient-text">In Seconds.</span>
              </h1>
              <p className="mx-auto mt-4 max-w-md text-sm text-gray-400 sm:text-base">
                Describe what you want. Download instantly. No license needed.
              </p>
            </div>

            {/* Steps */}
            <div className="mb-5 flex items-center justify-center gap-6 sm:gap-8">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                  1
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 sm:text-sm">
                  Describe
                </span>
              </div>
              <div className="h-px w-6 bg-white/20" />
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                  2
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 sm:text-sm">
                  Generate
                </span>
              </div>
              <div className="h-px w-6 bg-white/20" />
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-gradient text-xs font-bold text-white">
                  3
                </span>
                <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 sm:text-sm">
                  Download
                </span>
              </div>
            </div>

            {/* Generator card */}
            <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-[0_0_80px_rgba(255,138,101,0.15)] sm:p-8">
              <Generator />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
