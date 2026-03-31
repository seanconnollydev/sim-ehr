import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome to Sim EHR
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
          Choose a workspace. Authors build case studies and assessments;
          students open published cases and complete assessments.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Author workspace</CardTitle>
            <CardDescription>
              Create case studies, use guided forms and optional AI-assisted
              drafting, and configure WDL assessments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/author">Open Author</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Student workspace</CardTitle>
            <CardDescription>
              Browse published simulations, review the case presentation, and
              complete assessments with local autosave.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="secondary">
              <Link href="/student">Open Student</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
