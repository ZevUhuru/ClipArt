import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { LearnPostMeta, LearnPost } from "./learnTypes";

export type { LearnPostAuthor, LearnPostMeta, LearnPost } from "./learnTypes";

const CONTENT_DIR = path.join(process.cwd(), "content", "learn");

function parseDurationSeconds(dur: string): number {
  if (!dur) return 0;
  const parts = dur.split(":").map(Number);
  if (parts.length === 2) return (parts[0] || 0) * 60 + (parts[1] || 0);
  if (parts.length === 3) return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  return 0;
}

export { formatDuration } from "./learnUtils";

function getFiles(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx"));
}

export function getAllPosts(): LearnPostMeta[] {
  return getFiles()
    .map((filename) => {
      const filePath = path.join(CONTENT_DIR, filename);
      const raw = fs.readFileSync(filePath, "utf-8");
      const { data } = matter(raw);
      const duration = data.duration ?? "";
      return {
        slug: filename.replace(/\.mdx$/, ""),
        title: data.title ?? "",
        description: data.description ?? "",
        date: data.date ?? "",
        duration,
        durationSeconds: parseDurationSeconds(duration),
        topic: data.topic ?? [],
        categoryLabel: data.categoryLabel ?? "",
        muxPlaybackId: data.muxPlaybackId ?? "",
        youtubeId: data.youtubeId ?? "",
        thumbnailUrl: data.thumbnailUrl ?? "",
        author: data.author ?? { name: "", role: "", avatar: "" },
        relatedSlugs: data.relatedSlugs ?? [],
        relatedCategories: data.relatedCategories ?? [],
      } satisfies LearnPostMeta;
    })
    .sort((a, b) => (a.date > b.date ? -1 : 1));
}

export function getPostBySlug(slug: string): LearnPost | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);
  const duration = data.duration ?? "";
  return {
    meta: {
      slug,
      title: data.title ?? "",
      description: data.description ?? "",
      date: data.date ?? "",
      duration,
      durationSeconds: parseDurationSeconds(duration),
      topic: data.topic ?? [],
      categoryLabel: data.categoryLabel ?? "",
      muxPlaybackId: data.muxPlaybackId ?? "",
      youtubeId: data.youtubeId ?? "",
      thumbnailUrl: data.thumbnailUrl ?? "",
      author: data.author ?? { name: "", role: "", avatar: "" },
      relatedSlugs: data.relatedSlugs ?? [],
      relatedCategories: data.relatedCategories ?? [],
    },
    content,
    transcript: data.transcript ?? "",
  };
}

export function getPostsByTopic(topic: string): LearnPostMeta[] {
  return getAllPosts().filter((p) =>
    p.topic.some((t) => t.toLowerCase() === topic.toLowerCase())
  );
}

export function getAllTopics(): string[] {
  const topics = new Set<string>();
  for (const post of getAllPosts()) {
    for (const t of post.topic) topics.add(t);
  }
  return Array.from(topics).sort();
}

export function getAllSlugs(): string[] {
  return getFiles().map((f) => f.replace(/\.mdx$/, ""));
}
