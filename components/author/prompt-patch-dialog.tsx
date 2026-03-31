"use client";

import { useState } from "react";
import type { CaseStudyDocument } from "@/lib/prototype-alpha/types/case-study";
import { applyPromptPatches } from "@/lib/prototype-alpha/patch";
import {
  isChromePromptLikelyAvailable,
  parsePatchEnvelope,
  runPromptForPatches,
} from "@/lib/prototype-alpha/prompt-chrome";
import { nowIso } from "@/lib/prototype-alpha/ids";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";

const SYSTEM = `You are assisting with a synthetic nursing education case study. Output ONLY valid JSON matching this shape (no markdown):
{"patches":[{"op":"replace"|"add","path":"/json/pointer/path","value":...}],"provenance":{"tool":"chromePromptApi","promptSummary":"short summary","generatedAt":"ISO8601"}}
Use JSON Pointer-style paths starting with / relative to the case study root. For new timeline entries use op "add" and path "/timeline/-".`;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  doc: CaseStudyDocument;
  scopeLabel: string;
  pathHint: string;
  onApply: (next: CaseStudyDocument) => void;
};

export function PromptPatchDialog({
  open,
  onOpenChange,
  doc,
  scopeLabel,
  pathHint,
  onApply,
}: Props) {
  const [promptText, setPromptText] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const available = isChromePromptLikelyAvailable();

  function reset() {
    setPromptText("");
    setPreview(null);
    setError(null);
  }

  async function handleGenerate() {
    setError(null);
    setPreview(null);
    if (!available) {
      setError("Chrome Prompt API is not available in this browser.");
      return;
    }
    setBusy(true);
    try {
      const user = `${pathHint}\n\nAuthor request:\n${promptText}`;
      const raw = await runPromptForPatches(SYSTEM, user);
      parsePatchEnvelope(raw);
      setPreview(raw.trim().replace(/^```json\s*/i, "").replace(/```\s*$/i, ""));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  function handleApply() {
    if (!preview) {
      return;
    }
    try {
      const env = parsePatchEnvelope(preview);
      const next = applyPromptPatches(doc, env);
      const gen = next.provenance?.generatedBy ?? [];
      gen.push({
        generatedAt: nowIso(),
        tool: "chromePromptApi",
        scope: scopeLabel,
        promptSummary: promptText.slice(0, 200),
      });
      next.provenance = { ...next.provenance, generatedBy: gen };
      onApply(next);
      onOpenChange(false);
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Apply failed");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          reset();
        }
        onOpenChange(o);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assist: {scopeLabel}</DialogTitle>
          <DialogDescription>
            Generate or improve content using the Chrome Prompt API. Review the
            patch JSON, then apply to your draft.
          </DialogDescription>
        </DialogHeader>
        {!available && (
          <Alert>
            <AlertDescription>
              This feature needs a Chromium-based browser with the experimental
              Prompt / on-device AI API enabled.
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="prompt">Prompt</Label>
          <Textarea
            id="prompt"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={4}
            placeholder="Describe what to generate or how to improve…"
          />
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
        {preview && (
          <pre className="bg-muted max-h-40 overflow-auto rounded-md p-3 text-xs">
            {preview}
          </pre>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={busy || !promptText.trim() || !available}
              onClick={handleGenerate}
            >
              {busy ? "Working…" : "Generate preview"}
            </Button>
            <Button type="button" disabled={!preview} onClick={handleApply}>
              Apply to draft
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
