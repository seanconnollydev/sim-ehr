"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { submitAssessment } from "@/lib/actions/assessment-submission";
import { isLocalOnlyAssessmentCaseStudy } from "@/lib/assessments/constants";
import { groupPathLabels } from "@/lib/assessments/group-path";
import { useLocalAssessmentSubmission } from "@/lib/prototype-alpha/hooks/use-local-assessment-submission";
import { nowIso } from "@/lib/prototype-alpha/ids";
import {
  normalizeAssessmentTemplate,
  type AssessmentTemplate,
} from "@/lib/prototype-alpha/types/assessment-template";
import type { AssessmentItemResponse } from "@/lib/prototype-alpha/types/assessment-submission";
import { AssessmentFlowsheetLayout } from "@/components/student/assessment-flowsheet-layout";
import { AssessmentWorksheetLayout } from "@/components/student/assessment-worksheet-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function hasMeaningfulResponses(
  responses: Record<string, AssessmentItemResponse>,
): boolean {
  for (const r of Object.values(responses)) {
    const v = r?.value;
    if (v === true || v === false) {
      return true;
    }
    if (typeof v === "number" && !Number.isNaN(v)) {
      return true;
    }
    if (typeof v === "string" && v.trim() !== "") {
      return true;
    }
    if (Array.isArray(v) && v.length > 0) {
      return true;
    }
  }
  return false;
}

type Props = {
  caseStudyId: string;
  templateId: string;
  template: AssessmentTemplate;
  /** Shown above the title (e.g. author preview). */
  previewBanner?: string;
  backHref?: string;
  backLabel?: string;
};

export function AssessmentRunner({
  caseStudyId,
  templateId,
  template: templateRaw,
  previewBanner,
  backHref = `/student/case-studies/${caseStudyId}`,
  backLabel = "Back to case",
}: Props) {
  const template = useMemo(
    () => normalizeAssessmentTemplate(templateRaw),
    [templateRaw],
  );

  const { document, meta, setDocument, markSynced, setSyncError, hydrated } =
    useLocalAssessmentSubmission(caseStudyId, templateId);

  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [flowsheetRemountKey, setFlowsheetRemountKey] = useState(0);

  const clientUpdatedAtForSubmit = useMemo(
    () => meta?.syncedBasisAt ?? document?.updatedAt ?? "",
    [meta?.syncedBasisAt, document?.updatedAt],
  );

  const layout = template.x_presentation?.layout ?? "cards";

  const localOnlyAssessment = useMemo(
    () => isLocalOnlyAssessmentCaseStudy(caseStudyId),
    [caseStudyId],
  );

  async function handleSubmit() {
    if (!document) {
      return;
    }
    if (localOnlyAssessment) {
      setSyncError(null);
      toast.success(
        "Saved on this device. You can keep editing, reset, or leave anytime.",
      );
      return;
    }
    if (document.status === "submitted") {
      toast.message("Already submitted.");
      return;
    }
    setSyncError(null);
    const res = await submitAssessment({
      document,
      clientUpdatedAt: clientUpdatedAtForSubmit || document.updatedAt,
    });
    if (res.ok) {
      markSynced(res.updatedAt, res.updatedAt);
      setDocument((d) => ({
        ...d,
        status: "submitted",
        submittedAt: res.submittedAt,
        updatedAt: res.updatedAt,
      }));
      toast.success("Submitted.");
    } else {
      setSyncError(res.message);
      toast.error(res.message);
    }
  }

  function setResponse(itemId: string, value: AssessmentItemResponse["value"]) {
    setDocument((d) => ({
      ...d,
      responses: {
        ...d.responses,
        [itemId]: { ...d.responses[itemId], value },
      },
      updatedAt: nowIso(),
    }));
  }

  function handleResetConfirm() {
    setSyncError(null);
    setDocument((d) => ({ ...d, responses: {} }));
    setFlowsheetRemountKey((k) => k + 1);
    toast.success("Assessment reset.");
    setResetDialogOpen(false);
  }

  if (!hydrated || !document) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  const groups = template.groups ?? [];

  return (
    <div className="space-y-6">
      {previewBanner && (
        <p className="bg-muted text-muted-foreground rounded-md border px-3 py-2 text-sm">
          {previewBanner}
        </p>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{template.title}</h1>
          {template.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {template.description}
            </p>
          )}
          <div className="mt-2 flex gap-2">
            <Badge variant="secondary">{document.status}</Badge>
            {meta?.dirty && document.status !== "submitted" && (
              <Badge variant="outline">Autosaved locally</Badge>
            )}
          </div>
          {meta?.syncError && (
            <p className="text-destructive mt-1 text-sm">{meta.syncError}</p>
          )}
        </div>
        {document.status !== "submitted" ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!hasMeaningfulResponses(document.responses)}
              onClick={() => setResetDialogOpen(true)}
            >
              Reset
            </Button>
            <Button type="button" onClick={handleSubmit}>
              {localOnlyAssessment ? "Done" : "Submit"}
            </Button>
          </div>
        ) : (
          <Badge>Submitted</Badge>
        )}
      </div>

      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Start over?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears all answers for this assessment. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              variant="destructive"
              onClick={handleResetConfirm}
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {layout === "flowsheet" ? (
        <AssessmentFlowsheetLayout
          key={flowsheetRemountKey}
          template={template}
          responses={document.responses}
          setResponse={setResponse}
        />
      ) : layout === "worksheet" ? (
        <AssessmentWorksheetLayout
          template={template}
          responses={document.responses}
          setResponse={setResponse}
        />
      ) : (
        <div className="space-y-6">
          {template.items.map((item) => {
            const path = groupPathLabels(groups, item.groupId ?? item.domainId);
            const groupLine = path.length > 0 ? path.join(" → ") : null;
            return (
              <Card key={item.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{item.prompt}</CardTitle>
                  {groupLine && (
                    <CardDescription>{groupLine}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {item.responseType === "boolean" && (
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={`${item.id}-bool`}
                        checked={Boolean(
                          document.responses[item.id]?.value === true,
                        )}
                        onCheckedChange={(c) =>
                          setResponse(item.id, c === true)
                        }
                      />
                      <Label htmlFor={`${item.id}-bool`}>
                        Yes / within limits
                      </Label>
                    </div>
                  )}
                  {(item.responseType === "choice" ||
                    item.responseType === "multiChoice") && (
                    <div className="space-y-3">
                      {item.responseType === "choice" ? (
                        <RadioGroup
                          value={String(
                            document.responses[item.id]?.value ?? "",
                          )}
                          onValueChange={(v) => setResponse(item.id, v)}
                        >
                          {(item.choices ?? []).map((ch) => (
                            <div key={ch.id} className="flex items-center gap-2">
                              <RadioGroupItem
                                value={ch.id}
                                id={`${item.id}-${ch.id}`}
                              />
                              <Label
                                htmlFor={`${item.id}-${ch.id}`}
                                className="font-normal"
                              >
                                {ch.label}
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      ) : (
                        <div className="space-y-2">
                          {(item.choices ?? []).map((ch) => {
                            const selected = Array.isArray(
                              document.responses[item.id]?.value,
                            )
                              ? (document.responses[item.id]?.value as string[])
                              : [];
                            const checked = selected.includes(ch.id);
                            return (
                              <div key={ch.id} className="flex items-center gap-2">
                                <Checkbox
                                  id={`${item.id}-${ch.id}`}
                                  checked={checked}
                                  onCheckedChange={(c) => {
                                    const next = new Set(selected);
                                    if (c === true) {
                                      next.add(ch.id);
                                    } else {
                                      next.delete(ch.id);
                                    }
                                    setResponse(item.id, [...next]);
                                  }}
                                />
                                <Label
                                  htmlFor={`${item.id}-${ch.id}`}
                                  className="font-normal"
                                >
                                  {ch.label}
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                  {item.responseType === "text" && (
                    <Textarea
                      rows={4}
                      value={String(document.responses[item.id]?.value ?? "")}
                      onChange={(e) =>
                        setResponse(item.id, e.target.value)
                      }
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {template.x_licenseNotice && (
        <p className="text-muted-foreground border-t pt-4 text-xs leading-relaxed">
          {template.x_licenseNotice}
        </p>
      )}

      <p className="text-muted-foreground text-sm">
        <Link href={backHref} className="underline">
          {backLabel}
        </Link>
      </p>
    </div>
  );
}
