"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { publishAssessmentTemplate } from "@/lib/actions/assessment-template";
import { useLocalAssessmentTemplate } from "@/lib/prototype-alpha/hooks/use-local-assessment-template";
import { newId } from "@/lib/prototype-alpha/ids";
import type { AssessmentDomain, AssessmentItem } from "@/lib/prototype-alpha/types/assessment-template";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Props = {
  templateId: string;
  initialCaseStudyId?: string;
};

export function AssessmentTemplateEditor({ templateId, initialCaseStudyId }: Props) {
  const { document, meta, setDocument, markSynced, setSyncError, hydrated } =
    useLocalAssessmentTemplate(templateId);
  const [newDomainLabel, setNewDomainLabel] = useState("");

  useEffect(() => {
    if (!hydrated || !document || !initialCaseStudyId) {
      return;
    }
    if (!document.caseStudyId) {
      setDocument((d) => ({ ...d, caseStudyId: initialCaseStudyId }));
    }
  }, [hydrated, document, initialCaseStudyId, setDocument]);

  const clientUpdatedAtForPublish = useMemo(
    () => meta?.syncedBasisAt ?? document?.updatedAt ?? "",
    [meta?.syncedBasisAt, document?.updatedAt],
  );

  async function handlePublish() {
    if (!document) {
      return;
    }
    setSyncError(null);
    const res = await publishAssessmentTemplate({
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
      toast.success("Template published.");
    } else {
      setSyncError(res.message);
      toast.error(res.message);
    }
  }

  if (!hydrated || !document) {
    return <p className="text-muted-foreground text-sm">Loading template…</p>;
  }

  function addDomain() {
    const label = newDomainLabel.trim() || "Domain";
    const id = `dom_${newId().slice(0, 8)}`;
    setNewDomainLabel("");
    setDocument((d) => ({
      ...d,
      domains: [...d.domains, { id, label }],
    }));
  }

  function addItem(responseType: AssessmentItem["responseType"]) {
    if (!document) {
      return;
    }
    const domainId = document.domains[0]?.id ?? "dom_default";
    const id = `itm_${newId().slice(0, 8)}`;
    const base: AssessmentItem = {
      id,
      domainId,
      prompt: "New item",
      responseType,
      definedLimits: { type: "none" },
    };
    if (responseType === "choice" || responseType === "multiChoice") {
      base.choices = [
        { id: "a", label: "Option A" },
        { id: "b", label: "Option B" },
      ];
    }
    if (responseType === "boolean") {
      base.definedLimits = {
        type: "numericRange",
        min: 0,
        max: 1,
        unit: "boolean",
      };
    }
    setDocument((d) => ({ ...d, items: [...d.items, base] }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Assessment template</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Domains group items. Each item has a response type and optional
            limits.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="secondary">{document.status}</Badge>
            {meta?.dirty && <Badge variant="outline">Local changes</Badge>}
          </div>
          {meta?.syncError && (
            <p className="text-destructive mt-1 text-sm">{meta.syncError}</p>
          )}
        </div>
        <Button onClick={handlePublish}>Publish</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={document.title}
              onChange={(e) =>
                setDocument((d) => ({ ...d, title: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              rows={2}
              value={document.description ?? ""}
              onChange={(e) =>
                setDocument((d) => ({ ...d, description: e.target.value }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cs">Linked case study ID (optional)</Label>
            <Input
              id="cs"
              value={document.caseStudyId ?? ""}
              onChange={(e) =>
                setDocument((d) => ({
                  ...d,
                  caseStudyId: e.target.value || undefined,
                }))
              }
            />
            <p className="text-muted-foreground text-xs">
              Use to navigate from authoring; does not require the case to be
              published first.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Domains</CardTitle>
          <CardDescription>Group items for display.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="New domain label"
              value={newDomainLabel}
              onChange={(e) => setNewDomainLabel(e.target.value)}
              className="max-w-xs"
            />
            <Button type="button" variant="secondary" onClick={addDomain}>
              Add domain
            </Button>
          </div>
          <ul className="space-y-2">
            {document.domains.map((dom: AssessmentDomain) => (
              <li
                key={dom.id}
                className="flex max-w-md items-center gap-2"
              >
                <Input
                  value={dom.label}
                  onChange={(e) => {
                    const label = e.target.value;
                    setDocument((d) => ({
                      ...d,
                      domains: d.domains.map((x) =>
                        x.id === dom.id ? { ...x, label } : x,
                      ),
                    }));
                  }}
                />
                <span className="text-muted-foreground text-xs">{dom.id}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => addItem("boolean")}>
          Add boolean item
        </Button>
        <Button type="button" variant="outline" onClick={() => addItem("choice")}>
          Add choice item
        </Button>
        <Button type="button" variant="outline" onClick={() => addItem("text")}>
          Add text item
        </Button>
      </div>

      <Separator />

      <div className="space-y-6">
        {document.items.map((item, index) => (
          <Card key={item.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Item {index + 1}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label>Prompt</Label>
                <Textarea
                  rows={2}
                  value={item.prompt}
                  onChange={(e) => {
                    const prompt = e.target.value;
                    setDocument((d) => ({
                      ...d,
                      items: d.items.map((it) =>
                        it.id === item.id ? { ...it, prompt } : it,
                      ),
                    }));
                  }}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Select
                    value={item.domainId ?? document.domains[0]?.id}
                    onValueChange={(v) =>
                      setDocument((d) => ({
                        ...d,
                        items: d.items.map((it) =>
                          it.id === item.id
                            ? { ...it, domainId: v || undefined }
                            : it,
                        ),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {document.domains.map((dom) => (
                        <SelectItem key={dom.id} value={dom.id}>
                          {dom.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Response type</Label>
                  <Select
                    value={item.responseType}
                    onValueChange={(v) => {
                      const rt = v as AssessmentItem["responseType"];
                      setDocument((d) => ({
                        ...d,
                        items: d.items.map((it) =>
                          it.id === item.id
                            ? {
                                ...it,
                                responseType: rt,
                                choices:
                                  rt === "choice" || rt === "multiChoice"
                                    ? it.choices ?? [
                                        { id: "a", label: "A" },
                                        { id: "b", label: "B" },
                                      ]
                                    : undefined,
                              }
                            : it,
                        ),
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["boolean", "choice", "multiChoice", "text"].map(
                        (t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {(item.responseType === "choice" ||
                item.responseType === "multiChoice") &&
                (item.choices ?? []).map((ch, ci) => (
                  <div key={ch.id} className="flex gap-2">
                    <Input
                      value={ch.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        setDocument((d) => ({
                          ...d,
                          items: d.items.map((it) => {
                            if (it.id !== item.id) {
                              return it;
                            }
                            const choices = [...(it.choices ?? [])];
                            choices[ci] = { ...ch, label };
                            return { ...it, choices };
                          }),
                        }));
                      }}
                    />
                  </div>
                ))}
              <Button
                type="button"
                variant="ghost"
                className="text-destructive"
                onClick={() =>
                  setDocument((d) => ({
                    ...d,
                    items: d.items.filter((it) => it.id !== item.id),
                  }))
                }
              >
                Remove item
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-muted-foreground text-sm">
        <Link href="/author/assessments" className="underline">
          Back to templates
        </Link>
      </p>
    </div>
  );
}
