"use client";

import { useState } from "react";
import Image from "next/image";
import type { CharacterReferenceSheet } from "@/data/characters";
import { ImageLightbox, MagnifyIcon } from "@/components/ImageLightbox";

interface CharacterReferenceSheetGalleryProps {
  sheets: CharacterReferenceSheet[];
  designNotes: string[];
}

export function CharacterReferenceSheetGallery({
  sheets,
  designNotes,
}: CharacterReferenceSheetGalleryProps) {
  const [activeSheet, setActiveSheet] = useState<CharacterReferenceSheet | null>(null);

  if (sheets.length === 0) return null;

  return (
    <>
      <section id="reference-sheet" className="mx-auto max-w-7xl px-4 py-12">
        <div className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-700">
              Reference library
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
              Character sheets for every Orion pack
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-gray-600">
            Use these boards together: one captures the cinematic noir mood, while the other
            gives a cleaner production view of turnarounds, costumes, tools, transport, and scale.
          </p>
        </div>

        <div className="space-y-8">
          {sheets.map((sheet, index) => (
            <div
              key={sheet.imageUrl}
              className="grid gap-8 rounded-[2rem] border border-white bg-white p-3 shadow-sm ring-1 ring-amber-950/5 lg:grid-cols-[1.15fr_0.85fr]"
            >
              <div className="overflow-hidden rounded-[1.65rem] border border-amber-950/10 bg-[#18120c] p-3 shadow-2xl shadow-amber-950/10">
                <button
                  type="button"
                  onClick={() => setActiveSheet(sheet)}
                  aria-label={`View ${sheet.title} full size`}
                  title={`View ${sheet.title} full size`}
                  className="group relative block aspect-[16/10] w-full overflow-hidden rounded-[1.25rem] bg-[#0f0c09] text-left"
                >
                  <Image
                    src={sheet.imageUrl}
                    alt={sheet.alt}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 100vw, 760px"
                  />
                  <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/12" />
                  <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-black text-gray-950 shadow-lg ring-1 ring-white/80 transition-all group-hover:-translate-y-0.5">
                    <MagnifyIcon className="h-4 w-4" />
                    View full size
                  </span>
                </button>
              </div>

              <div className="flex flex-col justify-center p-3 lg:p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-amber-700">
                  Reference sheet {index + 1}
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                  {sheet.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-gray-600">{sheet.description}</p>

                {index === 0 ? (
                  <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-gray-700">
                    Best for mood, lighting, noir atmosphere, expressions, props, and the overall
                    storybook detective tone.
                  </p>
                ) : (
                  <p className="mt-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-gray-700">
                    Best for production consistency: turnaround views, costume variants, readable
                    props, transport details, and scale.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setActiveSheet(sheet)}
                  className="mt-5 inline-flex w-fit items-center gap-2 rounded-2xl bg-gray-950 px-4 py-2.5 text-xs font-black text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-800"
                >
                  <MagnifyIcon className="h-4 w-4" />
                  Magnify sheet
                </button>

                {index === 0 && (
                  <div className="mt-6 space-y-3">
                    {designNotes.map((note) => (
                      <div
                        key={note}
                        className="rounded-2xl border border-amber-100 bg-white px-4 py-3 shadow-sm"
                      >
                        <p className="text-sm font-semibold leading-6 text-gray-700">{note}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {activeSheet && (
        <ImageLightbox
          src={activeSheet.imageUrl}
          alt={activeSheet.alt}
          onClose={() => setActiveSheet(null)}
        />
      )}
    </>
  );
}

