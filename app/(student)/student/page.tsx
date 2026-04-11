import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function StudentHubPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Student workspace</h1>
        <p className="text-muted-foreground mt-1">
          Open published case studies and complete assessments. Progress is
          saved in this browser until you submit.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/student/case-studies">Browse case studies</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/student/assessments">Practice assessments</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Resume work</CardTitle>
          <CardDescription>
            Use the case study list to open assessments you have already
            started; submissions are keyed per case and template.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </div>
  );
}
