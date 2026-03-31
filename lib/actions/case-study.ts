"use server";

import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CASE_STUDY_SCHEMA_VERSION } from "@/lib/prototype-alpha/types/case-study";
import type { CaseStudyDocument } from "@/lib/prototype-alpha/types/case-study";

const publishSchema = z.object({
  document: z.custom<CaseStudyDocument>(),
  clientUpdatedAt: z.string(),
});

export type PublishCaseStudyResult =
  | { ok: true; updatedAt: string }
  | { ok: false; code: "stale" | "config" | "db"; message: string };

export async function publishCaseStudy(
  input: z.infer<typeof publishSchema>,
): Promise<PublishCaseStudyResult> {
  const parsed = publishSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: "config", message: "Invalid payload" };
  }
  const { document, clientUpdatedAt } = parsed.data;
  if (document.schemaVersion !== CASE_STUDY_SCHEMA_VERSION) {
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
    .from("case_studies")
    .select("updated_at, document")
    .eq("id", document.id)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, code: "db", message: fetchError.message };
  }

  if (row) {
    const serverDoc = row.document as CaseStudyDocument;
    const serverUpdated = serverDoc.updatedAt;
    if (serverUpdated && new Date(clientUpdatedAt) < new Date(serverUpdated)) {
      return {
        ok: false,
        code: "stale",
        message:
          "Server has a newer version. Reload the published copy or keep editing locally.",
      };
    }
  }

  const toSave: CaseStudyDocument = {
    ...document,
    status: "published",
    updatedAt: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase.from("case_studies").upsert(
    {
      id: toSave.id,
      title: toSave.title,
      updated_at: toSave.updatedAt,
      status: toSave.status,
      tags: toSave.tags ?? [],
      document: toSave as unknown as Record<string, unknown>,
    },
    { onConflict: "id" },
  );

  if (upsertError) {
    return { ok: false, code: "db", message: upsertError.message };
  }

  return { ok: true, updatedAt: toSave.updatedAt };
}

export async function getPublishedCaseStudy(
  id: string,
): Promise<CaseStudyDocument | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return null;
  }
  const { data, error } = await supabase
    .from("case_studies")
    .select("document")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) {
    return null;
  }
  return data.document as CaseStudyDocument;
}

export async function listPublishedCaseStudies(): Promise<
  Array<{
    id: string;
    title: string;
    updatedAt: string;
    status: string;
    tags: string[];
  }>
> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return [];
  }
  const { data, error } = await supabase
    .from("case_studies")
    .select("id, title, updated_at, status, tags")
    .eq("status", "published")
    .order("updated_at", { ascending: false });
  if (error || !data) {
    return [];
  }
  return data.map((r) => ({
    id: r.id,
    title: r.title,
    updatedAt: r.updated_at,
    status: r.status,
    tags: r.tags ?? [],
  }));
}
