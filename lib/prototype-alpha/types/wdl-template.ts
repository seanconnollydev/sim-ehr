export const WDL_TEMPLATE_SCHEMA_VERSION = "wdlTemplate@0.1" as const;

export type WdlTemplateStatus = "draft" | "published";

export type DefinedLimits =
  | { type: "numericRange"; unit?: string; min?: number; max?: number; [key: string]: unknown }
  | { type: "scenarioDefined"; description?: string; [key: string]: unknown }
  | { type: "informational"; description?: string; [key: string]: unknown }
  | { type: "none"; [key: string]: unknown }
  | Record<string, unknown>;

export type WdlChoice = {
  id: string;
  label: string;
  [key: string]: unknown;
};

export type WdlResponseType =
  | "boolean"
  | "choice"
  | "multiChoice"
  | "text"
  | string;

export type WdlDomain = {
  id: string;
  label: string;
  [key: string]: unknown;
};

export type WdlItem = {
  id: string;
  domainId?: string;
  prompt: string;
  responseType: WdlResponseType;
  definedLimits?: DefinedLimits;
  choices?: WdlChoice[];
  [key: string]: unknown;
};

export type WdlAssessmentTemplate = {
  schemaVersion: typeof WDL_TEMPLATE_SCHEMA_VERSION;
  id: string;
  title: string;
  description?: string;
  /** Optional link to a case study for authoring/navigation */
  caseStudyId?: string;
  createdAt: string;
  updatedAt: string;
  status: WdlTemplateStatus;
  domains: WdlDomain[];
  items: WdlItem[];
  provenance?: {
    authoredBy?: { actorType: string; actorId?: string; [key: string]: unknown };
    [key: string]: unknown;
  };
  x_extensions?: Record<string, unknown>;
  [key: string]: unknown;
};

export function emptyWdlTemplate(id: string): WdlAssessmentTemplate {
  const t = new Date().toISOString();
  const domDefault = { id: "dom_default", label: "General" };
  return {
    schemaVersion: WDL_TEMPLATE_SCHEMA_VERSION,
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
