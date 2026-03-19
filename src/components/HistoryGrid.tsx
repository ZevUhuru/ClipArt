"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useAppStore } from "@/stores/useAppStore";
import { createBrowserClient } from "@/lib/supabase/client";

interface Generation {
  id: string;
  image_url: string;
  prompt: string;
  style: string;
  created_at: string;
}

export function HistoryGrid() {
  const { user } = useAppStore();
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchGenerations() {
      const supabase = createBrowserClient();
      if (!supabase) { setLoading(false); return; }
      const { data } = await supabase
        .from("generations")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      setGenerations(data || []);
      setLoading(false);
    }

    fetchGenerations();
  }, [user]);

  if (!user) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
        <p className="text-gray-400">Sign in to see your generation history.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card animate-pulse overflow-hidden">
            <div className="aspect-square bg-gray-100" />
            <div className="p-3">
              <div className="h-3 w-3/4 rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (generations.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
        <p className="text-lg font-medium text-gray-400">No generations yet</p>
        <p className="mt-1 text-sm text-gray-300">
          Your creations will appear here after you generate them.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
      {generations.map((gen) => (
        <div key={gen.id} className="card group overflow-hidden">
          <div className="relative aspect-square bg-gray-50">
            <Image
              src={gen.image_url}
              alt={gen.prompt}
              fill
              className="object-contain p-3"
              unoptimized
            />
          </div>
          <div className="p-3">
            <p className="mb-2 truncate text-xs text-gray-500">{gen.prompt}</p>
            <button
              onClick={() => {
                const a = document.createElement("a");
                a.href = gen.image_url;
                a.download = `clip-art-${gen.id}.png`;
                a.click();
              }}
              className="text-xs font-medium text-pink-600 hover:text-pink-700"
            >
              Download
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
