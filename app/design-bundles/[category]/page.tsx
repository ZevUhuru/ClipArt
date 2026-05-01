import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ category: string }>;
}

export default async function LegacyDesignBundleCategoryPage({ params }: Props) {
  const { category } = await params;
  redirect(`/packs/${category}`);
}

