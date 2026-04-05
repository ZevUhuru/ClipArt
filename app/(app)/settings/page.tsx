"use client";

import { useState } from "react";
import { ConnectedAccounts } from "./ConnectedAccounts";

const TABS = [
  {
    id: "accounts",
    label: "Accounts",
    icon: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m9.86-2.092a4.5 4.5 0 00-1.242-7.244l-4.5-4.5a4.5 4.5 0 00-6.364 6.364L4.25 8.488" />
      </svg>
    ),
  },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("accounts");

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      <div className="mt-8 gap-8 md:flex">
        {/* Desktop: vertical tab nav */}
        <nav className="hidden w-52 shrink-0 md:block">
          <ul className="space-y-1">
            {TABS.map((tab) => (
              <li key={tab.id}>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all ${
                    activeTab === tab.id
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Mobile: horizontal pill tabs */}
        <div className="mb-6 inline-flex rounded-lg bg-gray-200/60 p-1 md:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-4 py-1.5 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content panel */}
        <div className="min-w-0 flex-1">
          {activeTab === "accounts" && <ConnectedAccounts />}
        </div>
      </div>
    </div>
  );
}
