"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  ASSESSMENT_TEMPLATE_SCHEMA_VERSION,
  type AssessmentTemplate,
} from "@/lib/prototype-alpha/types/assessment-template";

const publishSchema = z.object({
  document: z.custom<AssessmentTemplate>(),
  clientUpdatedAt: z.string(),
});

export type PublishAssessmentTemplateResult =
  | { ok: true; updatedAt: string }
  | { ok: false; code: "stale" | "config" | "db"; message: string };

export async function publishAssessmentTemplate(
  input: z.infer<typeof publishSchema>,
): Promise<PublishAssessmentTemplateResult> {
  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "config", message: "Invalid payload" };
  }
  const { document, clientUpdatedAt } = parsed.data;
  if (document.schemaVersion !== ASSESSMENT_TEMPLATE_SCHEMA_VERSION) {
    return { ok: false, code: "config", message: "Unsupported schema version" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      ok: false,
      code: "config",
      message:
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  const { data: row, error: fetchError } = await supabase
    .from("assessment_templates")
    .select("document")
    .eq("id", document.id)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, code: "db", message: fetchError.message };
  }

  if (row) {
    const serverDoc = row.document as AssessmentTemplate;
    const serverUpdated = serverDoc.updatedAt;
    if (serverUpdated && new Date(clientUpdatedAt) < new Date(serverUpdated)) {
      return {
        ok: false,
        code: "stale",
        message: "Server has a newer version of this template.",
      };
    }
  }

  const toSave: AssessmentTemplate = {
    ...document,
    status: "published",
    updatedAt: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase.from("assessment_templates").upsert(
    {
      id: toSave.id,
      case_study_id: toSave.caseStudyId ?? null,
      title: toSave.title,
      updated_at: toSave.updatedAt,
      status: toSave.status,
      document: toSave as unknown as Record<string, unknown>,
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    return { ok: false, code: "db", message: upsertError.message };
  }

  return { ok: true, updatedAt: toSave.updatedAt };
}

export async function getPublishedAssessmentTemplate(
  id: string,
): Promise<AssessmentTemplate | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase
    .from("assessment_templates")
    .select("document")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return data.document as AssessmentTemplate;
}

export async function listPublishedAssessmentTemplates(): Promise<
  Array<{
    id: string;
    title: string;
    caseStudyId: string | null;
    updatedAt: string;
    status: string;
  }>
> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }
  const { data, error } = await supabase
    .from("assessment_templates")
    .select("id, title, case_study_id, updated_at, status")
    .eq("status", "published")
    .order("updated_at", { ascending: false });
  if (error || !data) {
    return [];
  }
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    caseStudyId: r.case_study_id,
    updatedAt: r.updated_at,
    status: r.status,
  }));
}
