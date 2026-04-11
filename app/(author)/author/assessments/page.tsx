import Link from "next/link";
import { AuthorAssessmentTemplateList } from "@/components/author/author-assessment-template-list";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BUILTIN_ASSESSMENT_CATALOG } from "@/lib/assessments/constants";

export default function AuthorAssessmentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Assessment templates</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Author-created templates are saved locally until you publish.
            Built-in assessments are bundled with the app.
          </p>
        </div>
        <Button asChild>
          <Link href="/author/assessments/new">New template</Link>
        </Button>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Built-in assessments</h2>
        <div className="grid gap-3 sm:grid-cols-1 md:max-w-md">
          {BUILTIN_ASSESSMENT_CATALOG.map((a) => (
            <Card key={a.templateId}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{a.title}</CardTitle>
                <CardDescription>Repository-defined; not editable.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="secondary">
                  <Link href={`/author/assessments/${a.templateId}/preview`}>
                    Preview
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <h2 className="text-sm font-medium">Your templates</h2>
        <AuthorAssessmentTemplateList />
      </div>
    </div>
  );
}
