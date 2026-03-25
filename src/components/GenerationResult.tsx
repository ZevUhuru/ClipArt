"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { downloadClip } from "@/utils/downloadClip";

interface GenerationResultProps {
  imageUrl: string;
  prompt?: string;
  aspectRatio?: string;
}

export function GenerationResult({ imageUrl, prompt, aspectRatio }: GenerationResultProps) {
  function handleDownload() {
    downloadClip(imageUrl);
  }

  const isPortrait = aspectRatio === "3:4";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`card overflow-hidden ${isPortrait ? "mx-auto max-w-sm" : ""}`}
    >
      <div className={`relative w-full bg-gray-50 ${isPortrait ? "aspect-[3/4]" : "aspect-square"}`}>
        <Image
          src={imageUrl}
          alt={prompt ? `${prompt} - AI generated clip art` : "AI generated clip art"}
          fill
          className="object-contain p-4"
          unoptimized
        />
      </div>
      <div className="p-4">
        <button onClick={handleDownload} className="btn-primary w-full">
          Download PNG
        </button>
      </div>
    </motion.div>
  );
}
