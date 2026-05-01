import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export default async function LegacyDesignBundleDetailPage({ params }: Props) {
  const { category, slug } = await params;
  redirect(`/packs/${category}/${slug}`);
}

