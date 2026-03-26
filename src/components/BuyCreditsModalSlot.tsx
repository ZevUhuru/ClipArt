"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";

const SLOT_PACKS = [
  {
    name: "Quick Hit",
    credits: 30,
    price: "$1.99",
    priceId: "mini",
    badge: null,
    highlight: false,
  },
  {
    name: "Sweet Spot",
    credits: 100,
    price: "$4.99",
    priceId: "value",
    badge: "Best Value",
    highlight: true,
  },
  {
    name: "Binge",
    credits: 200,
    price: "$9.99",
    priceId: "power",
    badge: "Most Credits",
    highlight: false,
  },
] as const;

const REEL_DUMMY_PRICES = ["$0.99", "$2.49", "$5.49", "$3.99", "$7.99", "$6.49", "$1.49", "$8.99"];
const REEL_DUMMY_CREDITS = ["10", "30", "50", "100", "150", "40", "80", "250"];

function SlotReel({
  pack,
  index,
  onPurchase,
  loading,
  disabled,
}: {
  pack: (typeof SLOT_PACKS)[number];
  index: number;
  onPurchase: (id: string) => void;
  loading: string | null;
  disabled: boolean;
}) {
  const spinDuration = 0.8 + index * 0.4;
  const priceItemH = 44;
  const creditItemH = 24;
  const dummyCount = REEL_DUMMY_PRICES.length;

  return (
    <button
      onClick={() => onPurchase(pack.priceId)}
      disabled={disabled}
      className={`relative flex flex-1 flex-col items-center overflow-hidden rounded-2xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg ${
        pack.highlight
          ? "border-pink-400 bg-gradient-to-b from-pink-50 to-white shadow-md"
          : "border-gray-200 bg-white hover:border-gray-300"
      }`}
    >
      {pack.badge && (
        <span className="absolute -top-px left-0 right-0 rounded-t-xl bg-brand-gradient py-1 text-[10px] font-bold uppercase tracking-wider text-white">
          {pack.badge}
        </span>
      )}

      <div className={`flex w-full flex-col items-center ${pack.highlight ? "px-4 pb-5 pt-8" : "px-3 pb-4 pt-5"}`}>
        {/* Spinning price */}
        <div className="relative h-[44px] w-full overflow-hidden" style={{ WebkitMaskImage: "linear-gradient(transparent, black 20%, black 80%, transparent)" }}>
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: -(dummyCount * priceItemH) }}
            transition={{
              duration: spinDuration,
              ease: [0.2, 0.8, 0.3, 1],
            }}
            className="flex flex-col items-center"
          >
            {REEL_DUMMY_PRICES.map((p, i) => (
              <div key={i} className="flex h-[44px] items-center justify-center">
                <span className={`font-bold text-gray-300 ${pack.highlight ? "text-3xl" : "text-2xl"}`}>{p}</span>
              </div>
            ))}
            <div className="flex h-[44px] items-center justify-center">
              <span className={`font-bold text-gray-900 ${pack.highlight ? "text-3xl" : "text-2xl"}`}>{pack.price}</span>
            </div>
          </motion.div>
        </div>

        {/* Spinning credits */}
        <div className="relative mt-1 h-[24px] w-full overflow-hidden" style={{ WebkitMaskImage: "linear-gradient(transparent, black 20%, black 80%, transparent)" }}>
          <motion.div
            initial={{ y: 0 }}
            animate={{ y: -(dummyCount * creditItemH) }}
            transition={{
              duration: spinDuration + 0.2,
              ease: [0.2, 0.8, 0.3, 1],
            }}
            className="flex flex-col items-center"
          >
            {REEL_DUMMY_CREDITS.map((c, i) => (
              <div key={i} className="flex h-[24px] items-center justify-center">
                <span className="text-sm text-gray-300">{c} credits</span>
              </div>
            ))}
            <div className="flex h-[24px] items-center justify-center">
              <span className={`font-semibold ${pack.highlight ? "text-sm text-gray-700" : "text-sm text-gray-600"}`}>
                {pack.credits} credits
              </span>
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: spinDuration + 0.3, duration: 0.3 }}
          className="mt-2"
        >
          <span className="text-[11px] text-gray-400">
            No subscription
          </span>
        </motion.div>

        {loading === pack.priceId && (
          <span className="mt-2 flex items-center gap-1 text-xs text-pink-600">
            <svg className="h-3 w-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </span>
        )}
      </div>
    </button>
  );
}

export function BuyCreditsModalSlot() {
  const { isBuyCreditsOpen, closeBuyCreditsModal } = useAppStore();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePurchase(packId: string) {
    setLoading(packId);
    setError(null);
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || "Something went wrong");
        setLoading(null);
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(null);
    }
  }

  return (
    <AnimatePresence>
      {isBuyCreditsOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="modal-overlay"
          onClick={closeBuyCreditsModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="modal-content max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeBuyCreditsModal}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-center text-2xl font-bold text-gray-900">
              Get Credits
            </h2>
            <p className="mt-1 text-center text-sm text-gray-500">
              One credit = one generation. No subscription, no expiry.
            </p>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 flex items-end gap-3">
              {SLOT_PACKS.map((pack, i) => (
                <SlotReel
                  key={pack.priceId}
                  pack={pack}
                  index={i}
                  onPurchase={handlePurchase}
                  loading={loading}
                  disabled={loading !== null}
                />
              ))}
            </div>

            <p className="mt-4 text-center text-[11px] text-gray-400">
              Secure payment via Stripe. Credits never expire.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
