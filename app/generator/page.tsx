"use client";

import { Nav } from "@/components/Nav";
import { Generator } from "@/components/Generator";
import { HistoryGrid } from "@/components/HistoryGrid";

export default function GeneratorPage() {
  return (
    <main className="min-h-screen">
      <Nav />

      <section className="mx-auto max-w-2xl px-4 pb-8 pt-12">
        <h1 className="mb-8 text-center text-3xl font-bold text-gray-900">
          Create clip art
        </h1>
        <Generator />
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="mb-8 text-center text-2xl font-semibold text-gray-900">
          Your generations
        </h2>
        <HistoryGrid />
      </section>
    </main>
  );
}
