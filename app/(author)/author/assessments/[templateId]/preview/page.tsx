import { AuthorAssessmentPreview } from "@/components/author/author-assessment-preview";
import { getAssessmentTemplateById } from "@/lib/actions/assessment-template";

type Props = {
  params: Promise<{ templateId: string }>;
};

export default async function AuthorAssessmentPreviewPage({ params }: Props) {
  const { templateId } = await params;
  const serverTemplate = await getAssessmentTemplateById(templateId);
  return (
    <AuthorAssessmentPreview
      templateId={templateId}
      serverTemplate={serverTemplate}
    />
  );
}
