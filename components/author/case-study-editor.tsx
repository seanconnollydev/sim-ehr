"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { publishCaseStudy } from "@/lib/actions/case-study";
import { deepMerge } from "@/lib/prototype-alpha/merge";
import { useLocalCaseStudy } from "@/lib/prototype-alpha/hooks/use-local-case-study";
import { newId } from "@/lib/prototype-alpha/ids";
import { BUILTIN_ASSESSMENT_CATALOG } from "@/lib/assessments/constants";
import {
  type CaseStudyDocument,
  type CaseStudyTimelineEntry,
  linkedAssessmentTemplates,
} from "@/lib/prototype-alpha/types/case-study";
import { PromptPatchDialog } from "@/components/author/prompt-patch-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = { caseStudyId: string };

export function CaseStudyEditor({ caseStudyId }: Props) {
  const { document, meta, setDocument, markSynced, setSyncError, hydrated } =
    useLocalCaseStudy(caseStudyId);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptContext, setPromptContext] = useState<{
    scope: string;
    hint: string;
  }>({ scope: "Summary", hint: "Focus on summary fields." });

  const title = document?.title ?? "";

  const clientUpdatedAtForPublish = useMemo(
    () => meta?.syncedBasisAt ?? document?.updatedAt ?? "",
    [meta?.syncedBasisAt, document?.updatedAt],
  );

  async function handlePublish() {
    if (!document) {
      return;
    }
    setSyncError(null);
    const res = await publishCaseStudy({
      document,
      clientUpdatedAt: clientUpdatedAtForPublish || document.updatedAt,
    });
    if (res.ok) {
      markSynced(res.updatedAt, res.updatedAt);
      setDocument((d) => ({
        ...d,
        status: "published",
        updatedAt: res.updatedAt,
      }));
      toast.success("Published to Supabase.");
    } else {
      setSyncError(res.message);
      toast.error(res.message);
    }
  }

  if (!hydrated || !document) {
    return <p className="text-muted-foreground text-sm">Loading draft…</p>;
  }

  function updatePatient(partial: Record<string, unknown>) {
    setDocument((d) => ({
      ...d,
      patient: deepMerge(
        (d.patient ?? {}) as Record<string, unknown>,
        partial,
      ) as CaseStudyDocument["patient"],
    }));
  }

  function updateSummary(partial: Record<string, unknown>) {
    setDocument((d) => ({
      ...d,
      summary: deepMerge(
        (d.summary ?? {}) as Record<string, unknown>,
        partial,
      ) as CaseStudyDocument["summary"],
    }));
  }

  function addTimelineEntry() {
    const entry: CaseStudyTimelineEntry = {
      id: `evt_${newId()}`,
      type: "note",
      occurredAt: new Date().toISOString(),
      title: "New entry",
      data: { note: "" },
    };
    setDocument((d) => ({
      ...d,
      timeline: [...d.timeline, entry],
    }));
  }

  function updateTimelineEntry(
    id: string,
    patch: Partial<CaseStudyTimelineEntry>,
  ) {
    setDocument((d) => ({
      ...d,
      timeline: d.timeline.map((e) => {
        if (e.id !== id) {
          return e;
        }
        const { data: dataPatch, ...rest } = patch;
        return {
          ...e,
          ...rest,
          ...(dataPatch !== undefined
            ? { data: { ...e.data, ...dataPatch } }
            : {}),
        } as CaseStudyTimelineEntry;
      }),
    }));
  }

  function removeTimelineEntry(id: string) {
    setDocument((d) => ({
      ...d,
      timeline: d.timeline.filter((e) => e.id !== id),
    }));
  }

  function openPrompt(scope: string, hint: string) {
    setPromptContext({ scope, hint });
    setPromptOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">Case study</h1>
            <Badge variant="secondary">{document.status}</Badge>
            {meta?.dirty && <Badge variant="outline">Local changes</Badge>}
          </div>
          {meta?.syncError && (
            <p className="text-destructive text-sm">{meta.syncError}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handlePublish}>Publish</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Title & tags</CardTitle>
          <CardDescription>Shown in lists and when published.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) =>
                setDocument((d) => ({ ...d, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={(document.tags ?? []).join(", ")}
              onChange={(e) =>
                setDocument((d) => ({
                  ...d,
                  tags: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="patient">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="patient">Patient</TabsTrigger>
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="attachments">Attachments</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
        </TabsList>

        <TabsContent value="patient" className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                openPrompt(
                  "Patient demographics",
                  "Paths under /patient (e.g. displayName, dateOfBirth, contact.phone).",
                )
              }
            >
              Generate / improve
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Display name"
              value={String(document.patient.displayName ?? "")}
              onChange={(v) => updatePatient({ displayName: v })}
            />
            <Field
              label="Date of birth"
              value={String(document.patient.dateOfBirth ?? "")}
              onChange={(v) => updatePatient({ dateOfBirth: v })}
            />
            <Field
              label="MRN"
              value={String(document.patient.identifiers?.mrn ?? "")}
              onChange={(v) =>
                updatePatient({
                  identifiers: {
                    ...(document.patient.identifiers ?? {}),
                    mrn: v,
                  },
                })
              }
            />
            <Field
              label="Language"
              value={String(document.patient.language ?? "")}
              onChange={(v) => updatePatient({ language: v })}
            />
          </div>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                openPrompt(
                  "Clinical summary",
                  "Paths under /summary: chiefComplaint, hpi, pmh (array), allergies (array), etc.",
                )
              }
            >
              Generate / improve
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Chief complaint</Label>
            <Input
              value={String(document.summary?.chiefComplaint ?? "")}
              onChange={(e) =>
                updateSummary({ chiefComplaint: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label>HPI</Label>
            <Textarea
              rows={4}
              value={String(document.summary?.hpi ?? "")}
              onChange={(e) => updateSummary({ hpi: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>PMH (comma-separated)</Label>
            <Input
              value={(document.summary?.pmh ?? []).join(", ")}
              onChange={(e) =>
                updateSummary({
                  pmh: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="space-y-4">
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="secondary" onClick={addTimelineEntry}>
              Add entry
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                openPrompt(
                  "Timeline",
                  "Use op add path /timeline/- with full entry objects {id,type,occurredAt,title,data}.",
                )
              }
            >
              Generate / improve
            </Button>
          </div>
          <div className="space-y-4">
            {document.timeline.length === 0 && (
              <p className="text-muted-foreground text-sm">No events yet.</p>
            )}
            {document.timeline.map((entry) => (
              <Card key={entry.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{entry.title ?? entry.type}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={entry.type}
                        onValueChange={(v) =>
                          updateTimelineEntry(entry.id, {
                            type: v as CaseStudyTimelineEntry["type"],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            "encounter",
                            "note",
                            "lab",
                            "medication",
                            "vitals",
                            "imaging",
                            "procedure",
                            "assessment",
                            "other",
                          ].map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Field
                      label="Occurred at"
                      value={entry.occurredAt}
                      onChange={(v) =>
                        updateTimelineEntry(entry.id, { occurredAt: v })
                      }
                    />
                  </div>
                  <Field
                    label="Title"
                    value={entry.title ?? ""}
                    onChange={(v) => updateTimelineEntry(entry.id, { title: v })}
                  />
                  <div className="space-y-2">
                    <Label>Note / data (JSON object edited as key fields)</Label>
                    <Textarea
                      rows={3}
                      value={JSON.stringify(entry.data, null, 2)}
                      onChange={(e) => {
                        try {
                          const data = JSON.parse(e.target.value) as Record<
                            string,
                            unknown
                          >;
                          updateTimelineEntry(entry.id, { data });
                        } catch {
                          /* ignore parse errors while typing */
                        }
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => removeTimelineEntry(entry.id)}
                  >
                    Remove
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attachments" className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Add link-style attachments (no file upload in Alpha).
          </p>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              setDocument((d) => ({
                ...d,
                attachments: [
                  ...(d.attachments ?? []),
                  {
                    id: `att_${newId()}`,
                    type: "link",
                    title: "New link",
                    url: "https://example.test",
                  },
                ],
              }))
            }
          >
            Add link
          </Button>
          {(document.attachments ?? []).map((att, i) => (
            <div key={att.id} className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Title"
                value={att.title ?? ""}
                onChange={(e) => {
                  const next = [...(document.attachments ?? [])];
                  next[i] = { ...att, title: e.target.value };
                  setDocument((d) => ({ ...d, attachments: next }));
                }}
              />
              <Input
                placeholder="URL"
                value={att.url ?? ""}
                onChange={(e) => {
                  const next = [...(document.attachments ?? [])];
                  next[i] = { ...att, url: e.target.value };
                  setDocument((d) => ({ ...d, attachments: next }));
                }}
              />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          <p className="text-muted-foreground text-sm">
            Link a <strong>built-in</strong> assessment (bundled in this app) or
            an <strong>author-created</strong> template. Manage author templates
            in{" "}
            <Link href="/author/assessments" className="underline">
              Assessments
            </Link>
            .
          </p>
          <Separator />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const catalog = BUILTIN_ASSESSMENT_CATALOG[0];
                if (!catalog) {
                  return;
                }
                const existing = linkedAssessmentTemplates(document.assessments);
                if (existing.some((e) => e.templateId === catalog.templateId)) {
                  toast.message("That built-in assessment is already linked.");
                  return;
                }
                setDocument((d) => ({
                  ...d,
                  assessments: {
                    ...d.assessments,
                    assessmentTemplates: [
                      ...existing,
                      {
                        templateId: catalog.templateId,
                        label: catalog.title,
                        source: "builtin" as const,
                        x_defaultForStudents: false,
                      },
                    ],
                  },
                }));
              }}
            >
              Add built-in (H2T)
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const templateId = `assessment_tpl_${newId()}`;
                setDocument((d) => ({
                  ...d,
                  assessments: {
                    ...d.assessments,
                    assessmentTemplates: [
                      ...linkedAssessmentTemplates(d.assessments),
                      {
                        templateId,
                        label: "New assessment template",
                        source: "author" as const,
                        x_defaultForStudents: false,
                      },
                    ],
                  },
                }));
              }}
            >
              New author template link
            </Button>
          </div>
          <ul className="list-inside list-disc space-y-1 text-sm">
            {linkedAssessmentTemplates(document.assessments).map((w) => (
              <li key={w.templateId}>
                <Badge variant="outline" className="mr-2 align-middle">
                  {w.source === "builtin" ? "Built-in" : "Author"}
                </Badge>
                <Link
                  href={
                    w.source === "builtin"
                      ? `/author/assessments/${w.templateId}/preview`
                      : `/author/assessments/${w.templateId}`
                  }
                  className="underline"
                >
                  {w.label ?? w.templateId}
                </Link>{" "}
                <span className="text-muted-foreground">({w.templateId})</span>
              </li>
            ))}
          </ul>
        </TabsContent>
      </Tabs>

      <PromptPatchDialog
        open={promptOpen}
        onOpenChange={setPromptOpen}
        doc={document}
        scopeLabel={promptContext.scope}
        pathHint={promptContext.hint}
        onApply={(next) => setDocument(() => next)}
      />
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
