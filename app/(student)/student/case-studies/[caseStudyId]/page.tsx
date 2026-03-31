import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedCaseStudy } from "@/lib/actions/case-study";
import { CaseStudyReadonly } from "@/components/student/case-study-readonly";
import { Button } from "@/components/ui/button";

type Props = { params: Promise<{ caseStudyId: string }> };

export default async function StudentCaseStudyPage({ params }: Props) {
  const { caseStudyId } = await params;
  const doc = await getPublishedCaseStudy(caseStudyId);
  if (!doc) {
    notFound();
  }

  const templates = doc.assessments?.wdlTemplates ?? [];

  return (
    <div className="space-y-8">
      <CaseStudyReadonly doc={doc} />
      <div>
        <h2 className="text-lg font-medium">Assessments</h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Open a linked assessment template. Templates must be published.
        </p>
        <ul className="mt-3 space-y-2">
          {templates.length === 0 && (
            <li className="text-muted-foreground text-sm">
              No assessments linked in this case document.
            </li>
          )}
          {templates.map((w) => (
            <li key={w.templateId}>
              <Button asChild variant="link" className="h-auto p-0">
                <Link
                  href={`/student/case-studies/${caseStudyId}/assessments/${w.templateId}`}
                >
                  {w.label ?? w.templateId}
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
