import type { CaseStudyDocument } from "@/lib/prototype-alpha/types/case-study";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = { doc: CaseStudyDocument };

export function CaseStudyReadonly({ doc }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{doc.title}</h1>
        {doc.description && (
          <p className="text-muted-foreground mt-1">{doc.description}</p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Patient</CardTitle>
          <CardDescription>Synthetic demographics</CardDescription>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <p>
            <strong>Name:</strong> {doc.patient.displayName ?? "—"}
          </p>
          <p>
            <strong>DOB:</strong> {doc.patient.dateOfBirth ?? "—"}
          </p>
          <p>
            <strong>MRN:</strong> {doc.patient.identifiers?.mrn ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>Chief complaint:</strong>{" "}
            {doc.summary?.chiefComplaint ?? "—"}
          </p>
          <p>
            <strong>HPI:</strong> {doc.summary?.hpi ?? "—"}
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-medium">Timeline</h2>
        <Separator className="my-3" />
        <ul className="space-y-2">
          {doc.timeline.map((e) => (
            <li key={e.id} className="rounded-md border p-3 text-sm">
              <div className="font-medium text-zinc-900 dark:text-zinc-100">
                {e.title ?? e.type}
              </div>
              <div className="text-muted-foreground text-xs">
                {e.occurredAt} · {e.type}
              </div>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-2 text-xs">
                {JSON.stringify(e.data, null, 2)}
              </pre>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
