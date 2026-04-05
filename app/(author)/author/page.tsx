import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthorHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Author workspace</h1>
        <p className="text-muted-foreground mt-1">
          Draft case studies and assessment templates. Sync when you publish.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/author/case-studies/new">New case study</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/author/case-studies">All case studies</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/author/assessments">Assessment templates</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Getting started</CardTitle>
          <CardDescription>
            Create a case study draft (saved in this browser), edit sections, then
            publish to share. Link an assessment template from the assessments area.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground text-sm">
          <p>
            Publishing and submissions require Supabase environment variables
            configured for this deployment.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
