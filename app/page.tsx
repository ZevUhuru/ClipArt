import { Nav } from "@/components/Nav";
import { Generator } from "@/components/Generator";
import { MosaicBackground } from "@/components/MosaicBackground";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#0a0a0a]">
      {/* Animated mosaic background */}
      <MosaicBackground />

      {/* Content layer */}
      <div className="relative z-10 flex min-h-screen flex-col">
        <Nav />

        {/* Centered generator card */}
        <div className="flex flex-1 items-center justify-center px-4 py-6 pb-16">
          <div className="w-full max-w-xl">
            {/* Hero text */}
            <div className="mb-6 text-center">
              <h1 className="font-futura-bold text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                <span className="block text-white">Generate Clip Art</span>
                <span className="gradient-text">In Seconds.</span>
              </h1>
              <p className="mt-4 whitespace-nowrap text-sm text-gray-300 sm:text-base">
                Describe what you want. Download instantly. No license needed.
              </p>
            </div>

            {/* Steps cards */}
            <div className="mb-5 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10 backdrop-blur-sm sm:px-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-pink-400 sm:text-xs">
                  Step 01
                </p>
                <p className="mt-0.5 text-xs font-semibold text-white sm:text-sm">
                  Describe
                </p>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10 backdrop-blur-sm sm:px-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400 sm:text-xs">
                  Step 02
                </p>
                <p className="mt-0.5 text-xs font-semibold text-white sm:text-sm">
                  Generate
                </p>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-3 ring-1 ring-white/10 backdrop-blur-sm sm:px-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-green-400 sm:text-xs">
                  Step 03
                </p>
                <p className="mt-0.5 text-xs font-semibold text-white sm:text-sm">
                  Download
                </p>
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
