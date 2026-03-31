"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { newId } from "@/lib/prototype-alpha/ids";

export default function NewCaseStudyPage() {
  const router = useRouter();
  useEffect(() => {
    const id = `case_${newId()}`;
    router.replace(`/author/case-studies/${id}`);
  }, [router]);
  return (
    <p className="text-muted-foreground text-sm">Creating a new draft…</p>
  );
}
