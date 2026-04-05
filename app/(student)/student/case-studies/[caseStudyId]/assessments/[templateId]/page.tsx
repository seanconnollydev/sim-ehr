import Link from "next/link";
import { getPublishedAssessmentTemplate } from "@/lib/actions/assessment-template";
import { AssessmentRunner } from "@/components/student/assessment-runner";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ caseStudyId: string; templateId: string }>;
};

export default async function StudentAssessmentPage({ params }: Props) {
  const { caseStudyId, templateId } = await params;
  const template = await getPublishedAssessmentTemplate(templateId);
  if (!template) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          This assessment template is not available on the server. Publish it
          from the Author workspace.
        </p>
        <Button asChild variant="outline">
          <Link href={`/student/case-studies/${caseStudyId}`}>Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <AssessmentRunner
      caseStudyId={caseStudyId}
      templateId={templateId}
      template={template}
    />
  );
}
