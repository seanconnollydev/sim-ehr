"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  WDL_SUBMISSION_SCHEMA_VERSION,
  type WdlAssessmentSubmission,
} from "@/lib/prototype-alpha/types/wdl-submission";

const submitSchema = z.object({
  document: z.custom<WdlAssessmentSubmission>(),
  clientUpdatedAt: z.string(),
});

export type SubmitWdlResult =
  | { ok: true; updatedAt: string; submittedAt: string }
  | { ok: false; code: "stale" | "config" | "db"; message: string };

export async function submitWdlAssessment(
  input: z.infer<typeof submitSchema>,
): Promise<SubmitWdlResult> {
  const parsed = submitSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "config", message: "Invalid payload" };
  }
  const { document, clientUpdatedAt } = parsed.data;
  if (document.schemaVersion !== WDL_SUBMISSION_SCHEMA_VERSION) {
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
    .from("wdl_submissions")
    .select("document")
    .eq("id", document.id)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, code: "db", message: fetchError.message };
  }

  if (row) {
    const serverDoc = row.document as WdlAssessmentSubmission;
    const serverUpdated = serverDoc.updatedAt;
    if (serverUpdated && new Date(clientUpdatedAt) < new Date(serverUpdated)) {
      return {
        ok: false,
        code: "stale",
        message: "Server has a newer submission record.",
      };
    }
  }

  const submittedAt = new Date().toISOString();
  const toSave: WdlAssessmentSubmission = {
    ...document,
    status: "submitted",
    submittedAt,
    updatedAt: submittedAt,
  };

  const { error: upsertError } = await supabase.from("wdl_submissions").upsert(
    {
      id: toSave.id,
      case_study_id: toSave.caseStudyId,
      template_id: toSave.templateId,
      student_actor_id: toSave.student?.actorId ?? null,
      updated_at: toSave.updatedAt,
      submitted_at: toSave.submittedAt,
      document: toSave as unknown as Record<string, unknown>,
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    return { ok: false, code: "db", message: upsertError.message };
  }

  return {
    ok: true,
    updatedAt: toSave.updatedAt,
    submittedAt: toSave.submittedAt!,
  };
}
