import Link from "next/link";
import { listPublishedCaseStudies } from "@/lib/actions/case-study";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

export default async function StudentCaseStudiesPage() {
  const rows = await listPublishedCaseStudies();

  if (rows.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Published case studies</h1>
        <p className="text-muted-foreground text-sm">
          No published cases found. Configure Supabase and publish a case from
          the Author workspace.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Published case studies</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Open a case to review the timeline or start an assessment.
        </p>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className="text-right">Open</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium">{r.title}</TableCell>
              <TableCell>
                <Badge variant="outline">{r.updatedAt.slice(0, 10)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button asChild size="sm" variant="ghost">
                  <Link href={`/student/case-studies/${r.id}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
