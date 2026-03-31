"use client";

import Link from "next/link";
import { useMemo } from "react";
import { toast } from "sonner";
import { submitWdlAssessment } from "@/lib/actions/wdl-submission";
import { useLocalWdlSubmission } from "@/lib/prototype-alpha/hooks/use-local-wdl-submission";
import { nowIso } from "@/lib/prototype-alpha/ids";
import type { WdlAssessmentTemplate } from "@/lib/prototype-alpha/types/wdl-template";
import type { WdlItemResponse } from "@/lib/prototype-alpha/types/wdl-submission";
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

type Props = {
  caseStudyId: string;
  templateId: string;
  template: WdlAssessmentTemplate;
};

export function WdlAssessmentRunner({
  caseStudyId,
  templateId,
  template,
}: Props) {
  const { document, meta, setDocument, markSynced, setSyncError, hydrated } =
    useLocalWdlSubmission(caseStudyId, templateId);

  const clientUpdatedAtForSubmit = useMemo(
    () => meta?.syncedBasisAt ?? document?.updatedAt ?? "",
    [meta?.syncedBasisAt, document?.updatedAt],
  );

  async function handleSubmit() {
    if (!document) {
      return;
    }
    if (document.status === "submitted") {
      toast.message("Already submitted.");
      return;
    }
    setSyncError(null);
    const res = await submitWdlAssessment({
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

  function setResponse(itemId: string, value: WdlItemResponse["value"]) {
    setDocument((d) => ({
      ...d,
      responses: {
        ...d.responses,
        [itemId]: { ...d.responses[itemId], value },
      },
      updatedAt: nowIso(),
    }));
  }

  if (!hydrated || !document) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  const domainsById = Object.fromEntries(
    template.domains.map((d) => [d.id, d.label]),
  );

  return (
    <div className="space-y-6">
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
          <Button onClick={handleSubmit}>Submit</Button>
        ) : (
          <Badge>Submitted</Badge>
        )}
      </div>

      <div className="space-y-6">
        {template.items.map((item) => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{item.prompt}</CardTitle>
              {item.domainId && (
                <CardDescription>
                  {domainsById[item.domainId] ?? item.domainId}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {item.responseType === "boolean" && (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`${item.id}-bool`}
                    checked={Boolean(document.responses[item.id]?.value === true)}
                    onCheckedChange={(c) =>
                      setResponse(item.id, c === true)
                    }
                  />
                  <Label htmlFor={`${item.id}-bool`}>Yes / within limits</Label>
                </div>
              )}
              {(item.responseType === "choice" ||
                item.responseType === "multiChoice") && (
                <div className="space-y-3">
                  {item.responseType === "choice" ? (
                    <RadioGroup
                      value={String(document.responses[item.id]?.value ?? "")}
                      onValueChange={(v) => setResponse(item.id, v)}
                    >
                      {(item.choices ?? []).map((ch) => (
                        <div key={ch.id} className="flex items-center gap-2">
                          <RadioGroupItem value={ch.id} id={`${item.id}-${ch.id}`} />
                          <Label htmlFor={`${item.id}-${ch.id}`} className="font-normal">
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
                  onChange={(e) => setResponse(item.id, e.target.value)}
                />
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        <Link href={`/student/case-studies/${caseStudyId}`} className="underline">
          Back to case
        </Link>
      </p>
    </div>
  );
}
