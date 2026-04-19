/** Case study id for practice runs outside a published case (localStorage keying). */
export const STANDALONE_PRACTICE_CASE_STUDY_ID = "standalone_practice";

/** Case study id for author preview (localStorage keying). */
export const AUTHOR_PREVIEW_CASE_STUDY_ID = "author_preview";

const LOCAL_ONLY_ASSESSMENT_CASE_STUDY_IDS: ReadonlySet<string> = new Set([
  STANDALONE_PRACTICE_CASE_STUDY_ID,
  AUTHOR_PREVIEW_CASE_STUDY_ID,
]);

/**
 * Assessments keyed under these case studies are not real submissions: no server
 * submit and local documents stay in progress so students/authors are not stuck
 * in a terminal "submitted" state.
 */
export function isLocalOnlyAssessmentCaseStudy(caseStudyId: string): boolean {
  return LOCAL_ONLY_ASSESSMENT_CASE_STUDY_IDS.has(caseStudyId);
}

export const H2T_ASSESSMENT_TEMPLATE_ID = "h2t_head_to_toe_v1" as const;

/** Built-in assessments authors can attach to case studies. */
export const BUILTIN_ASSESSMENT_CATALOG: ReadonlyArray<{
  templateId: string;
  title: string;
}> = [
  {
    templateId: H2T_ASSESSMENT_TEMPLATE_ID,
    title: "Head-to-Toe Assessment (H2T)",
  },
];
