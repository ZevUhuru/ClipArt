"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CreatePageLayout } from "@/components/CreatePageLayout";
import { useAppStore } from "@/stores/useAppStore";
import { useGenerationQueue } from "@/stores/useGenerationQueue";
import {
  WORKSHEET_GRADES,
  WORKSHEET_SUBJECTS,
  type WorksheetGrade,
  type WorksheetSubject,
} from "@/lib/worksheets-taxonomy";

const GRADE_LABELS: Record<WorksheetGrade, string> = {
  prek: "PreK",
  kindergarten: "Kindergarten",
  "1st-grade": "1st",
  "2nd-grade": "2nd",
  "3rd-grade": "3rd",
  "4th-grade": "4th",
  "5th-grade": "5th",
};

const SUBJECT_LABELS: Record<WorksheetSubject, string> = {
  math: "Math",
  reading: "Reading",
  writing: "Writing",
  phonics: "Phonics",
  science: "Science",
  spelling: "Spelling",
};

interface TopicOption {
  slug: string;
  name: string;
}

export default function WorksheetCreatePage() {
  const [grade, setGrade] = useState<WorksheetGrade>("1st-grade");
  const [subject, setSubject] = useState<WorksheetSubject>("math");
  const [topic, setTopic] = useState<string>("");
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [loadingTopics, setLoadingTopics] = useState(false);

  const [prompt, setPrompt] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { openAuthModal, user } = useAppStore();
  const addJob = useGenerationQueue((s) => s.addJob);

  useEffect(() => {
    let cancelled = false;
    setLoadingTopics(true);
    fetch(`/api/worksheet-topics?grade=${grade}&subject=${subject}`)
      .then((r) => r.json())
      .then((data: { topics?: TopicOption[] }) => {
        if (cancelled) return;
        const list = data.topics || [];
        setTopics(list);
        setTopic((prev) => {
          if (prev && list.some((t) => t.slug === prev)) return prev;
          return list[0]?.slug || "";
        });
      })
      .catch(() => {
        if (!cancelled) setTopics([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTopics(false);
      });
    return () => {
      cancelled = true;
    };
  }, [grade, subject]);

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    if (!topic) {
      setError("Pick a topic before generating.");
      return;
    }
    if (!user) {
      openAuthModal("signup");
      return;
    }

    setError(null);
    addJob(prompt.trim(), "cartoon", isPublic, {
      contentType: "worksheet",
      aspectRatio: "3:4",
      grade,
      subject,
      topic,
    });
    setPrompt("");
  }, [prompt, isPublic, user, openAuthModal, addJob, grade, subject, topic]);

  const selectedTopicName =
    topics.find((t) => t.slug === topic)?.name || "worksheet";

  return (
    <CreatePageLayout
      prompt={prompt}
      onPromptChange={setPrompt}
      onSubmit={handleGenerate}
      promptPlaceholder={`Describe the ${selectedTopicName.toLowerCase()} worksheet... (e.g. farm animal theme, 6 addition problems)`}
      submitDisabled={!prompt.trim() || !topic}
      error={error}
      options={
        <>
          <div className="flex items-center gap-3">
            <Link
              href="/worksheets"
              className="text-xs font-medium text-pink-500 hover:text-pink-700"
            >
              Browse Worksheets
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setIsPublic((v) => !v)}
            className="flex shrink-0 items-center gap-2 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-gray-100"
            title={
              isPublic
                ? "Your worksheet will be shared with the community"
                : "Your worksheet will be private"
            }
          >
            <span
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isPublic ? "bg-green-400" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                  isPublic ? "translate-x-[18px]" : "translate-x-[3px]"
                }`}
              />
            </span>
            <span className="text-gray-500">{isPublic ? "Public" : "Private"}</span>
          </button>
        </>
      }
    >
      <div className="mt-2 space-y-6">
        {/* Grade */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Grade
          </p>
          <div className="flex flex-wrap gap-2">
            {WORKSHEET_GRADES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGrade(g)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                  grade === g
                    ? "border-pink-300 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:bg-pink-50/40"
                }`}
              >
                {GRADE_LABELS[g]}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Subject
          </p>
          <div className="flex flex-wrap gap-2">
            {WORKSHEET_SUBJECTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSubject(s)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                  subject === s
                    ? "border-pink-300 bg-pink-50 text-pink-700"
                    : "border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:bg-pink-50/40"
                }`}
              >
                {SUBJECT_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Topic
            </p>
            {loadingTopics && (
              <p className="text-xs text-gray-400">Loading topics…</p>
            )}
          </div>
          {topics.length === 0 && !loadingTopics ? (
            <p className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
              No topics yet for {GRADE_LABELS[grade]} {SUBJECT_LABELS[subject]}. Pick
              a different subject or grade — or create a general worksheet and
              we&apos;ll categorize it under &ldquo;Other.&rdquo;
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {topics.map((t) => (
                <button
                  key={t.slug}
                  type="button"
                  onClick={() => setTopic(t.slug)}
                  className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-all ${
                    topic === t.slug
                      ? "border-pink-300 bg-pink-50 text-pink-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-pink-200 hover:bg-pink-50/40"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Tips for a great worksheet
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-600">
            <li>
              Pick a visual theme kids love (farm animals, dinosaurs, space,
              ocean) and mention it in the prompt.
            </li>
            <li>
              Specify how many problems or how much space (e.g. &ldquo;6 addition
              problems, horizontal layout, big writing boxes&rdquo;).
            </li>
            <li>
              Include a kid-friendly title (e.g. &ldquo;Counting on the
              Farm&rdquo;) — it shows on the worksheet.
            </li>
            <li>
              Every render is automatically made cute-cartoon, kid-safe, and
              printable — no need to say so in your prompt.
            </li>
          </ul>
        </div>
      </div>
    </CreatePageLayout>
  );
}
