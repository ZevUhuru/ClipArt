import { NextResponse } from "next/server";
import { getColoringThemes } from "@/lib/categories";

export async function GET() {
  try {
    const themes = await getColoringThemes();
    const result = themes.map((t) => ({ slug: t.slug, name: t.name }));
    return NextResponse.json({ categories: result });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}
