import { AssessmentTemplateEditor } from "@/components/author/assessment-template-editor";

type Props = {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ caseStudyId?: string }>;
};

export default async function AuthorAssessmentTemplatePage({ params, searchParams }: Props) {
  const { templateId } = await params;
  const sp = await searchParams;
  return (
    <AssessmentTemplateEditor
      templateId={templateId}
      initialCaseStudyId={sp.caseStudyId}
    />
  );
}
