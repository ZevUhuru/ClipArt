"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ShortsRedirect() {
  const router = useRouter();
  useEffect(() => { router.replace("/storyboard"); }, [router]);
  return null;
}
