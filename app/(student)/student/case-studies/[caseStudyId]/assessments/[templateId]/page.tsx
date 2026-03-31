import Link from "next/link";
import { getPublishedWdlTemplate } from "@/lib/actions/wdl-template";
import { WdlAssessmentRunner } from "@/components/student/wdl-assessment-runner";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ caseStudyId: string; templateId: string }>;
};

export default async function StudentAssessmentPage({ params }: Props) {
  const { caseStudyId, templateId } = await params;
  const template = await getPublishedWdlTemplate(templateId);
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
    <WdlAssessmentRunner
      caseStudyId={caseStudyId}
      templateId={templateId}
      template={template}
    />
  );
}
