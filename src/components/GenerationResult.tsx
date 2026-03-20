"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { downloadClip } from "@/utils/downloadClip";

interface GenerationResultProps {
  imageUrl: string;
  prompt?: string;
}

export function GenerationResult({ imageUrl, prompt }: GenerationResultProps) {
  function handleDownload() {
    downloadClip(imageUrl);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="card overflow-hidden"
    >
      <div className="relative aspect-square w-full bg-gray-50">
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
