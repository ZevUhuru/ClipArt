"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/stores/useAppStore";

const PACKS = [
  {
    name: "Starter",
    credits: 100,
    price: "$4.99",
    priceId: "starter",
    popular: false,
  },
  {
    name: "Pro",
    credits: 200,
    price: "$9.99",
    priceId: "pro",
    popular: true,
  },
] as const;

export function BuyCreditsModal() {
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
              className="absolute right-4 top-4 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-gray-900">
              Buy credits
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              One credit = one generation. No subscription, no expiry.
            </p>

            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <div className="mt-6 grid grid-cols-2 gap-4">
              {PACKS.map((pack) => (
                <button
                  key={pack.priceId}
                  onClick={() => handlePurchase(pack.priceId)}
                  disabled={loading !== null}
                  className={`relative flex flex-col items-center rounded-2xl border-2 p-6 transition-all hover:shadow-md ${
                    pack.popular
                      ? "border-pink-400 bg-pink-50/50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  {pack.popular && (
                    <span className="absolute -top-3 rounded-full bg-brand-gradient px-3 py-0.5 text-xs font-semibold text-white">
                      Best value
                    </span>
                  )}
                  <span className="text-3xl font-bold text-gray-900">
                    {pack.price}
                  </span>
                  <span className="mt-1 text-sm font-medium text-gray-600">
                    {pack.credits} credits
                  </span>
                  <span className="mt-3 text-xs text-gray-400">
                    ${(parseFloat(pack.price.replace("$", "")) / pack.credits * 100).toFixed(1)}¢ each
                  </span>
                  {loading === pack.priceId && (
                    <span className="mt-2 text-xs text-pink-600">
                      Redirecting...
                    </span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
