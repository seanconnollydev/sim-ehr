import Link from "next/link";
import { AuthorCaseStudyList } from "@/components/author/author-case-study-list";
import { Button } from "@/components/ui/button";

export default function AuthorCaseStudiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Case studies</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Drafts are stored locally in your browser until you publish.
          </p>
        </div>
        <Button asChild>
          <Link href="/author/case-studies/new">New case study</Link>
        </Button>
      </div>
      <AuthorCaseStudyList />
    </div>
  );
}
