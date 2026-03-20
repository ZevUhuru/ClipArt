"use client";

import Image from "next/image";
import { motion } from "framer-motion";

interface GenerationResultProps {
  imageUrl: string;
  prompt?: string;
}

export function GenerationResult({ imageUrl, prompt }: GenerationResultProps) {
  async function handleDownload() {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clip-art-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
