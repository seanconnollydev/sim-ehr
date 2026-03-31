"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { listIds, readWrapped } from "@/lib/prototype-alpha/local-storage";
import type { WdlAssessmentTemplate } from "@/lib/prototype-alpha/types/wdl-template";
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

export function AuthorWdlTemplateList() {
  const [rows, setRows] = useState<
    Array<{ id: string; title: string; status: string; dirty: boolean }>
  >([]);

  useEffect(() => {
    queueMicrotask(() => {
      const ids = listIds("wdl-template-draft");
      const next = ids.map((id) => {
        const w = readWrapped<WdlAssessmentTemplate>("wdl-template-draft", id);
        return {
          id,
          title: w?.document.title ?? id,
          status: w?.document.status ?? "draft",
          dirty: w?.meta.dirty ?? false,
        };
      });
      setRows(next.sort((a, b) => a.title.localeCompare(b.title)));
    });
  }, []);

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        No templates yet. Create an assessment template to link it to a case
        study.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-[120px]">Local</TableHead>
          <TableHead className="text-right">Open</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium">{r.title}</TableCell>
            <TableCell>
              <Badge variant="secondary">{r.status}</Badge>
            </TableCell>
            <TableCell>
              {r.dirty ? (
                <Badge variant="outline">Unsaved sync</Badge>
              ) : (
                <span className="text-muted-foreground text-xs">—</span>
              )}
            </TableCell>
            <TableCell className="text-right">
              <Button asChild size="sm" variant="ghost">
                <Link href={`/author/assessments/${r.id}`}>Edit</Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
