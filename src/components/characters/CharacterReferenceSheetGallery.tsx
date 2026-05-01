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
      <section id="reference-sheet" className="mx-auto max-w-[1500px] px-4 py-12">
        <div className="mb-7 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.28em] text-[#d8a852]">
              Reference library
            </p>
            <h2 className="mt-2 font-serif text-4xl font-black tracking-tight text-[#f4ead2] sm:text-5xl">
              Character sheets for every Orion pack
            </h2>
          </div>
          <p className="max-w-xl border-l border-[#7f562b]/70 pl-4 text-sm leading-6 text-[#bda27a]">
            Use these boards together: one captures the cinematic noir mood, while the other
            gives a cleaner production view of turnarounds, costumes, tools, transport, and scale.
          </p>
        </div>

        <div className="space-y-8">
          {sheets.map((sheet, index) => (
            <div
              key={sheet.imageUrl}
              className="relative grid gap-3 border border-[#9a6a35]/55 bg-[#120d08] p-3 shadow-2xl shadow-black/30 ring-1 ring-[#f0c070]/10 lg:grid-cols-[1.15fr_0.85fr]"
            >
              <div className="pointer-events-none absolute -left-px -top-px h-7 w-7 border-l border-t border-[#d6a65b]" />
              <div className="pointer-events-none absolute -right-px -top-px h-7 w-7 border-r border-t border-[#d6a65b]" />
              <div className="pointer-events-none absolute -bottom-px -left-px h-7 w-7 border-b border-l border-[#d6a65b]" />
              <div className="pointer-events-none absolute -bottom-px -right-px h-7 w-7 border-b border-r border-[#d6a65b]" />

              <div className="overflow-hidden border border-[#7f562b]/60 bg-[#18120c] p-3 shadow-2xl shadow-black/35">
                <button
                  type="button"
                  onClick={() => setActiveSheet(sheet)}
                  aria-label={`View ${sheet.title} full size`}
                  title={`View ${sheet.title} full size`}
                  className="group relative block aspect-[16/10] w-full overflow-hidden border border-[#7f562b]/50 bg-[#0f0c09] text-left"
                >
                  <Image
                    src={sheet.imageUrl}
                    alt={sheet.alt}
                    fill
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 100vw, 760px"
                  />
                  <span className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/12" />
                  <span className="absolute right-3 top-3 inline-flex items-center gap-2 border border-[#d8a852]/60 bg-[#120d08]/88 px-3 py-2 text-xs font-black uppercase tracking-[0.14em] text-[#f4ead2] shadow-lg backdrop-blur-sm transition-all group-hover:-translate-y-0.5">
                    <MagnifyIcon className="h-4 w-4" />
                    View full size
                  </span>
                </button>
              </div>

              <div className="flex flex-col justify-center border border-[#7f562b]/50 bg-[#19110a] p-5 lg:p-6">
                <p className="text-[11px] font-black uppercase tracking-[0.26em] text-[#d8a852]">
                  Reference sheet {index + 1}
                </p>
                <h3 className="mt-2 font-serif text-3xl font-black tracking-tight text-[#f4ead2] sm:text-4xl">
                  {sheet.title}
                </h3>
                <p className="mt-4 text-base leading-7 text-[#bda27a]">{sheet.description}</p>

                {index === 0 ? (
                  <p className="mt-4 border border-[#7f562b]/60 bg-[#21170d] px-4 py-3 text-sm font-semibold leading-6 text-[#dac6a2]">
                    Best for mood, lighting, noir atmosphere, expressions, props, and the overall
                    storybook detective tone.
                  </p>
                ) : (
                  <p className="mt-4 border border-[#7f562b]/60 bg-[#21170d] px-4 py-3 text-sm font-semibold leading-6 text-[#dac6a2]">
                    Best for production consistency: turnaround views, costume variants, readable
                    props, transport details, and scale.
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => setActiveSheet(sheet)}
                  className="mt-5 inline-flex w-fit items-center gap-2 border border-[#d8a852]/70 bg-[#d8a852] px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-[#120d08] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#f1c46d]"
                >
                  <MagnifyIcon className="h-4 w-4" />
                  Magnify sheet
                </button>

                {index === 0 && (
                  <div className="mt-6 space-y-3">
                    {designNotes.map((note) => (
                      <div
                        key={note}
                        className="border border-[#7f562b]/50 bg-[#120d08] px-4 py-3 shadow-sm"
                      >
                        <p className="text-sm font-semibold leading-6 text-[#bda27a]">{note}</p>
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

