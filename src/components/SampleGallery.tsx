import Image from "next/image";
import { sampleImages } from "@/data/sampleGallery";

export function SampleGallery() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {sampleImages.map((img) => (
        <div
          key={img.url}
          className="card group overflow-hidden"
        >
          <div className="relative aspect-square bg-gray-50">
            <Image
              src={img.url}
              alt={img.title}
              fill
              className="object-contain p-3 transition-transform group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
          </div>
          <div className="px-3 py-2">
            <p className="truncate text-xs font-medium text-gray-600">
              {img.title}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
