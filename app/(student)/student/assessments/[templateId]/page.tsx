import Link from "next/link";
import { getAssessmentTemplateById } from "@/lib/actions/assessment-template";
import { AssessmentRunner } from "@/components/student/assessment-runner";
import { STANDALONE_PRACTICE_CASE_STUDY_ID } from "@/lib/assessments/constants";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ templateId: string }>;
};

export default async function StudentStandaloneAssessmentPage({ params }: Props) {
  const { templateId } = await params;
  const template = await getAssessmentTemplateById(templateId);
  if (!template) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">
          This assessment is not available.
        </p>
        <Button asChild variant="outline">
          <Link href="/student/assessments">Back to assessments</Link>
        </Button>
      </div>
    );
  }

  return (
    <AssessmentRunner
      caseStudyId={STANDALONE_PRACTICE_CASE_STUDY_ID}
      templateId={templateId}
      template={template}
      backHref="/student/assessments"
      backLabel="Back to assessments"
    />
  );
}
