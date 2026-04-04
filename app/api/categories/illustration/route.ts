import { NextResponse } from "next/server";
import { getIllustrationCategories } from "@/lib/categories";

export async function GET() {
  try {
    const categories = await getIllustrationCategories();
    const result = categories.map((c) => ({ slug: c.slug, name: c.name }));
    return NextResponse.json({ categories: result });
  } catch {
    return NextResponse.json({ categories: [] });
  }
}
