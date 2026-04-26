import { NextRequest, NextResponse } from "next/server";
import {
  getWorksheetTopics,
  isWorksheetGrade,
  isWorksheetSubject,
} from "@/lib/categories";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const grade = request.nextUrl.searchParams.get("grade");
  const subject = request.nextUrl.searchParams.get("subject");

  if (!grade || !subject || !isWorksheetGrade(grade) || !isWorksheetSubject(subject)) {
    return NextResponse.json({ topics: [] }, { status: 400 });
  }

  const topics = await getWorksheetTopics(grade, subject);

  const prefix = `${grade}--${subject}--`;
  const slim = topics.map((t) => ({
    slug: t.slug.startsWith(prefix) ? t.slug.slice(prefix.length) : t.slug,
    name: t.name,
  }));

  return NextResponse.json({ topics: slim });
}
