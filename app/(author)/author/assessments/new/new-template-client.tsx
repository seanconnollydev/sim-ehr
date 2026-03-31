"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { newId } from "@/lib/prototype-alpha/ids";

export function NewTemplateRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseStudyId = searchParams.get("caseStudyId");

  useEffect(() => {
    const id = `wdl_tpl_${newId()}`;
    const q = caseStudyId
      ? `?caseStudyId=${encodeURIComponent(caseStudyId)}`
      : "";
    router.replace(`/author/assessments/${id}${q}`);
  }, [router, caseStudyId]);

  return (
    <p className="text-muted-foreground text-sm">Creating a new template…</p>
  );
}
