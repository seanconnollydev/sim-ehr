"use client";

import { useMemo } from "react";
import { isBuiltinTemplateId } from "@/lib/assessments/builtin";
import { AUTHOR_PREVIEW_CASE_STUDY_ID } from "@/lib/assessments/constants";
import { AssessmentRunner } from "@/components/student/assessment-runner";
import { useLocalAssessmentTemplate } from "@/lib/prototype-alpha/hooks/use-local-assessment-template";
import {
  normalizeAssessmentTemplate,
  type AssessmentTemplate,
} from "@/lib/prototype-alpha/types/assessment-template";

type Props = {
  templateId: string;
  serverTemplate: AssessmentTemplate | null;
};

export function AuthorAssessmentPreview({ templateId, serverTemplate }: Props) {
  const { document, hydrated } = useLocalAssessmentTemplate(templateId);

  const template = useMemo(() => {
    if (!hydrated) {
      return null;
    }
    if (isBuiltinTemplateId(templateId)) {
      return serverTemplate;
    }
    if (document && document.items.length > 0) {
      return normalizeAssessmentTemplate(document);
    }
    return serverTemplate;
  }, [hydrated, document, serverTemplate, templateId]);

  if (!hydrated) {
    return <p className="text-muted-foreground text-sm">Loading…</p>;
  }

  if (!template) {
    return (
      <div className="space-y-2">
        <p className="text-muted-foreground text-sm">
          No template to preview. Publish the template or add items in the
          editor.
        </p>
      </div>
    );
  }

  const backHref = isBuiltinTemplateId(templateId)
    ? "/author/assessments"
    : `/author/assessments/${templateId}`;
  const backLabel = isBuiltinTemplateId(templateId)
    ? "Back to assessment templates"
    : "Back to template";

  return (
    <AssessmentRunner
      caseStudyId={AUTHOR_PREVIEW_CASE_STUDY_ID}
      templateId={templateId}
      template={template}
      previewBanner="Preview — not a student submission."
      backHref={backHref}
      backLabel={backLabel}
    />
  );
}
