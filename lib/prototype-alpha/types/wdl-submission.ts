export const WDL_SUBMISSION_SCHEMA_VERSION = "wdlSubmission@0.1" as const;

export type WdlSubmissionStatus = "in_progress" | "submitted";

export type WdlResponseValue =
  | boolean
  | string
  | string[]
  | number
  | null
  | undefined;

export type WdlItemResponse = {
  value?: WdlResponseValue;
  [key: string]: unknown;
};

export type WdlAssessmentSubmission = {
  schemaVersion: typeof WDL_SUBMISSION_SCHEMA_VERSION;
  id: string;
  caseStudyId: string;
  templateId: string;
  student?: {
    actorType: string;
    actorId?: string;
    displayName?: string;
    [key: string]: unknown;
  };
  startedAt: string;
  updatedAt: string;
  submittedAt: string | null;
  status: WdlSubmissionStatus;
  responses: Record<string, WdlItemResponse>;
  x_extensions?: Record<string, unknown>;
  [key: string]: unknown;
};

export function emptyWdlSubmission(
  id: string,
  caseStudyId: string,
  templateId: string,
  studentActorId: string,
): WdlAssessmentSubmission {
  const t = new Date().toISOString();
  return {
    schemaVersion: WDL_SUBMISSION_SCHEMA_VERSION,
    id,
    caseStudyId,
    templateId,
    student: {
      actorType: "student",
      actorId: studentActorId,
      displayName: "Student",
    },
    startedAt: t,
    updatedAt: t,
    submittedAt: null,
    status: "in_progress",
    responses: {},
    x_extensions: {},
  };
}
