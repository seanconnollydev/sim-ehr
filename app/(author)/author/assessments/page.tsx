import Link from "next/link";
import { AuthorAssessmentTemplateList } from "@/components/author/author-assessment-template-list";
import { Button } from "@/components/ui/button";

export default function AuthorAssessmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Assessment templates</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Assessment templates are saved locally until you publish.
          </p>
        </div>
        <Button asChild>
          <Link href="/author/assessments/new">New template</Link>
        </Button>
      </div>
      <AuthorAssessmentTemplateList />
    </div>
  );
}
