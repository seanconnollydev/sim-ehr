import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CaseStudyNotFound() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Case study not found</h1>
      <p className="text-muted-foreground text-sm">
        This case may not be published yet, or Supabase is not configured.
      </p>
      <Button asChild variant="outline">
        <Link href="/student/case-studies">Browse case studies</Link>
      </Button>
    </div>
  );
}
