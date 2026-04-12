"use client";

import { useState } from "react";

interface AdminCreditsProps {
  userId: string;
  initialCredits: number;
}

const QUICK_AMOUNTS = [250, 500, 1000];

export default function AdminCredits({ userId, initialCredits }: AdminCreditsProps) {
  const [credits, setCredits] = useState(initialCredits);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  async function adjust(delta: number) {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/users/credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, amount: delta }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setCredits(data.credits);
      setMessage({ text: `${delta > 0 ? "+" : ""}${delta} credits applied`, ok: true });
      setAmount("");
    } catch (err: unknown) {
      setMessage({ text: err instanceof Error ? err.message : "Error", ok: false });
    } finally {
      setLoading(false);
    }
  }

  function handleCustom(sign: 1 | -1) {
    const n = parseInt(amount, 10);
    if (!n || n <= 0) return;
    adjust(sign * n);
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-sm font-medium text-gray-500">My Credits</h2>
          <p className="mt-1 text-3xl font-bold text-gray-900">{credits.toLocaleString()}</p>
        </div>
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-600">
          Admin
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((n) => (
          <button
            key={n}
            onClick={() => adjust(n)}
            disabled={loading}
            className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-50"
          >
            +{n}
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          min="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Custom amount"
          className="w-36 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:border-indigo-300 focus:outline-none focus:ring-1 focus:ring-indigo-200"
        />
        <button
          onClick={() => handleCustom(1)}
          disabled={loading || !amount}
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-40"
        >
          Add
        </button>
        <button
          onClick={() => handleCustom(-1)}
          disabled={loading || !amount}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
        >
          Remove
        </button>
      </div>

      {message && (
        <p className={`mt-3 text-xs font-medium ${message.ok ? "text-green-600" : "text-red-500"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
