export const ASSESSMENT_TEMPLATE_SCHEMA_VERSION = "assessmentTemplate@0.1" as const;

export type AssessmentTemplateStatus = "draft" | "published";

export type DefinedLimits =
  | { type: "numericRange"; unit?: string; min?: number; max?: number; [key: string]: unknown }
  | { type: "scenarioDefined"; description?: string; [key: string]: unknown }
  | { type: "informational"; description?: string; [key: string]: unknown }
  | { type: "none"; [key: string]: unknown }
  | Record<string, unknown>;

export type AssessmentChoice = {
  id: string;
  label: string;
  [key: string]: unknown;
};

export type AssessmentResponseType =
  | "boolean"
  | "choice"
  | "multiChoice"
  | "text"
  | string;

export type AssessmentDomain = {
  id: string;
  label: string;
  [key: string]: unknown;
};

export type AssessmentItem = {
  id: string;
  domainId?: string;
  prompt: string;
  responseType: AssessmentResponseType;
  definedLimits?: DefinedLimits;
  choices?: AssessmentChoice[];
  [key: string]: unknown;
};

export type AssessmentTemplate = {
  schemaVersion: typeof ASSESSMENT_TEMPLATE_SCHEMA_VERSION;
  id: string;
  title: string;
  description?: string;
  /** Optional link to a case study for authoring/navigation */
  caseStudyId?: string;
  createdAt: string;
  updatedAt: string;
  status: AssessmentTemplateStatus;
  domains: AssessmentDomain[];
  items: AssessmentItem[];
  provenance?: {
    authoredBy?: { actorType: string; actorId?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
  x_extensions?: Record<string, unknown>;
  [key: string]: unknown;
};

export function emptyAssessmentTemplate(id: string): AssessmentTemplate {
  const t = new Date().toISOString();
  const domDefault = { id: "dom_default", label: "General" };
  return {
    schemaVersion: ASSESSMENT_TEMPLATE_SCHEMA_VERSION,
    id,
    title: "Untitled assessment",
    createdAt: t,
    updatedAt: t,
    status: "draft",
    domains: [domDefault],
    items: [],
    x_extensions: {},
  };
}
