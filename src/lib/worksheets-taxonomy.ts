/**
 * Pure, client-safe worksheet taxonomy constants + type guards.
 *
 * Kept in its own module so client components (e.g. the /create/worksheets
 * page) can import grade/subject enums without dragging server-only
 * Supabase/`next/headers` code into the client bundle.
 *
 * DB-backed helpers (getWorksheetGrades, getWorksheetTopics, etc.) still
 * live in src/lib/categories.ts and are server-only.
 */

export const WORKSHEET_GRADES = [
  "prek",
  "kindergarten",
  "1st-grade",
  "2nd-grade",
  "3rd-grade",
  "4th-grade",
  "5th-grade",
] as const;

export const WORKSHEET_SUBJECTS = [
  "math",
  "reading",
  "writing",
  "phonics",
  "science",
  "spelling",
] as const;

export type WorksheetGrade = (typeof WORKSHEET_GRADES)[number];
export type WorksheetSubject = (typeof WORKSHEET_SUBJECTS)[number];

export function isWorksheetGrade(value: string): value is WorksheetGrade {
  return (WORKSHEET_GRADES as readonly string[]).includes(value);
}

export function isWorksheetSubject(value: string): value is WorksheetSubject {
  return (WORKSHEET_SUBJECTS as readonly string[]).includes(value);
}

export function subjectSlug(grade: string, subject: string): string {
  return `${grade}--${subject}`;
}

export function topicSlug(grade: string, subject: string, topic: string): string {
  return `${grade}--${subject}--${topic}`;
}
