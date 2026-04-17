"use client";

import { useMemo, useState } from "react";
import type { AssessmentTemplate } from "@/lib/prototype-alpha/types/assessment-template";
import type { AssessmentItemResponse } from "@/lib/prototype-alpha/types/assessment-submission";
import { groupPathLabels } from "@/lib/assessments/group-path";
import {
  FLOWSHEET_EXCEPTION_CHOICE_ID,
  findGateItemForGroup,
  flowsheetDetailItemsForGroup,
  flowsheetOrderedItemsForGroup,
  isFlowsheetExceptionSelected,
  prepareFlowsheetTemplate,
} from "@/lib/assessments/flowsheet";
import { AssessmentChoiceCombobox } from "@/components/student/assessment-choice-combobox";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";

type Props = {
  template: AssessmentTemplate;
  responses: Record<string, AssessmentItemResponse>;
  setResponse: (itemId: string, value: AssessmentItemResponse["value"]) => void;
};

function firstLeafGroupIdForRoot(
  groups: AssessmentTemplate["groups"],
  items: AssessmentTemplate["items"],
  rootLabel: string,
): string | undefined {
  for (const item of items) {
    const path = groupPathLabels(groups, item.groupId);
    if (path[0] === rootLabel) {
      return item.groupId;
    }
  }
  return undefined;
}

export function AssessmentFlowsheetLayout({
  template: templateRaw,
  responses,
  setResponse,
}: Props) {
  const template = useMemo(
    () => prepareFlowsheetTemplate(templateRaw),
    [templateRaw],
  );
  const groups = useMemo(() => template.groups ?? [], [template.groups]);
  const items = template.items;
  const [railQuery, setRailQuery] = useState("");

  const rootGroups = useMemo(
    () => groups.filter((g) => g.parentGroupId === null),
    [groups],
  );

  const filteredRoots = useMemo(() => {
    const q = railQuery.trim().toLowerCase();
    if (!q) {
      return rootGroups;
    }
    return rootGroups.filter((r) => {
      if (r.label.toLowerCase().includes(q)) {
        return true;
      }
      return groups.some(
        (g) =>
          g.parentGroupId === r.id && g.label.toLowerCase().includes(q),
      );
    });
  }, [groups, railQuery, rootGroups]);

  const blocks: { groupId: string; path: string[]; items: typeof items }[] =
    [];
  for (const item of items) {
    const gid = item.groupId ?? "";
    const path = groupPathLabels(groups, item.groupId);
    const last = blocks[blocks.length - 1];
    if (last && last.groupId === gid) {
      last.items.push(item);
    } else {
      blocks.push({ groupId: gid, path, items: [item] });
    }
  }

  function scrollToGroup(groupId: string) {
    const el = document.getElementById(`flowsheet-section-${groupId}`);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleRailClick(rootId: string) {
    const root = groups.find((g) => g.id === rootId);
    if (!root) {
      return;
    }
    const gid = firstLeafGroupIdForRoot(groups, items, root.label);
    if (gid) {
      scrollToGroup(gid);
    }
  }

  return (
    <div className="flex min-h-[min(70vh,720px)] gap-0 overflow-hidden rounded-md border">
      <aside className="bg-muted/40 flex w-52 shrink-0 flex-col border-r">
        <div className="border-b p-2">
          <Input
            placeholder="Search categories…"
            value={railQuery}
            onChange={(e) => setRailQuery(e.target.value)}
            className="h-8 text-xs"
            aria-label="Filter body system categories"
          />
        </div>
        <ScrollArea className="min-h-0 flex-1">
          <nav className="flex flex-col gap-0.5 p-2" aria-label="Assessment categories">
            {filteredRoots.map((r) => {
              const childGroups = groups.filter((g) => g.parentGroupId === r.id);
              if (childGroups.length === 0) {
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRailClick(r.id)}
                    className="hover:bg-muted text-foreground rounded-md px-2 py-1.5 text-left text-xs leading-tight transition-colors"
                  >
                    {r.label}
                  </button>
                );
              }
              return (
                <Collapsible key={r.id} defaultOpen>
                  <div className="flex items-center gap-0.5">
                    <CollapsibleTrigger
                      className="hover:bg-muted text-muted-foreground hover:text-foreground flex size-7 shrink-0 items-center justify-center rounded-md"
                      aria-label={`Expand ${r.label}`}
                    >
                      <HugeiconsIcon
                        icon={ArrowRight01Icon}
                        className="size-3.5"
                        strokeWidth={2}
                      />
                    </CollapsibleTrigger>
                    <button
                      type="button"
                      onClick={() => handleRailClick(r.id)}
                      className="hover:bg-muted text-foreground min-w-0 flex-1 rounded-md px-1.5 py-1.5 text-left text-xs leading-tight transition-colors"
                    >
                      {r.label}
                    </button>
                  </div>
                  <CollapsibleContent>
                    <div className="border-border/60 ml-3 flex flex-col gap-0.5 border-l pl-2">
                      {childGroups.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => scrollToGroup(c.id)}
                          className="hover:bg-muted text-foreground rounded-md px-2 py-1 text-left text-[11px] leading-tight transition-colors"
                        >
                          {c.label}
                        </button>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </nav>
        </ScrollArea>
      </aside>

      <div className="bg-background min-w-0 flex-1 overflow-auto">
        <Table className="table-fixed">
          <TableHeader className="bg-background sticky top-0 z-20 shadow-[0_1px_0_0_hsl(var(--border))]">
            <TableRow className="hover:bg-transparent">
              <TableHead className="text-muted-foreground w-[52%] py-1.5 text-xs font-semibold">
                Row
              </TableHead>
              <TableHead className="text-muted-foreground py-1.5 text-xs font-semibold">
                Value
              </TableHead>
            </TableRow>
          </TableHeader>
          {blocks.map((block) => {
              const gate = findGateItemForGroup(block.groupId, block.items);
              const ordered = flowsheetOrderedItemsForGroup(
                block.groupId,
                block.items,
                gate,
              );
              const detailList = gate
                ? flowsheetDetailItemsForGroup(
                    block.groupId,
                    block.items,
                    gate.id,
                  )
                : block.items;
              const expanded =
                gate && isFlowsheetExceptionSelected(responses, gate.id);

              const pathLine =
                block.path.length > 0 ? block.path.join(" → ") : "—";

              return (
                <TableBody
                  key={block.groupId || "ungrouped"}
                  className="border-b"
                  id={`flowsheet-section-${block.groupId}`}
                >
                  <TableRow className="bg-muted/80 hover:bg-muted/80 border-b-0">
                    <TableCell
                      colSpan={2}
                      className="text-foreground py-1.5 text-xs font-semibold tracking-wide uppercase"
                    >
                      {pathLine}
                    </TableCell>
                  </TableRow>
                  {ordered.map((item) => {
                    const isGate = gate && item.id === gate.id;
                    const isDetail =
                      gate &&
                      !isGate &&
                      detailList.some((d) => d.id === item.id);
                    if (isDetail && !expanded) {
                      return null;
                    }

                    const selId = `flowsheet-${item.id}`;
                    return (
                      <TableRow
                        key={item.id}
                        className={cn(
                          "hover:bg-muted/30",
                          isGate && "bg-muted/20",
                        )}
                      >
                        <TableCell className="align-top py-1 pr-2 pl-3">
                          <Label
                            htmlFor={selId}
                            className="text-foreground text-xs leading-snug font-normal"
                          >
                            {item.prompt}
                            {isGate && (
                              <span className="text-muted-foreground ml-1.5 text-[10px]">
                                (WDL / X)
                              </span>
                            )}
                          </Label>
                        </TableCell>
                        <TableCell className="align-top py-1 pr-3 pl-2">
                          {item.responseType === "choice" && (
                            <AssessmentChoiceCombobox
                              id={selId}
                              label={item.prompt}
                              choices={
                                isGate
                                  ? (item.choices ?? []).map((ch) => ({
                                      ...ch,
                                      label:
                                        ch.id === FLOWSHEET_EXCEPTION_CHOICE_ID
                                          ? "X"
                                          : "WDL",
                                    }))
                                  : (item.choices ?? [])
                              }
                              value={String(responses[item.id]?.value ?? "")}
                              onChange={(v) => setResponse(item.id, v)}
                              className="w-full min-w-0"
                            />
                          )}
                          {item.responseType === "multiChoice" && (
                            <div className="flex max-w-full flex-col gap-1.5">
                              {(item.choices ?? []).map((ch) => {
                                const selected = Array.isArray(
                                  responses[item.id]?.value,
                                )
                                  ? (responses[item.id]?.value as string[])
                                  : [];
                                const checked = selected.includes(ch.id);
                                return (
                                  <label
                                    key={ch.id}
                                    className="flex items-start gap-2 text-xs leading-snug"
                                  >
                                    <Checkbox
                                      checked={checked}
                                      onCheckedChange={(c) => {
                                        const next = new Set(selected);
                                        if (c === true) {
                                          next.add(ch.id);
                                        } else {
                                          next.delete(ch.id);
                                        }
                                        setResponse(item.id, [...next]);
                                      }}
                                    />
                                    <span>{ch.label}</span>
                                  </label>
                                );
                              })}
                            </div>
                          )}
                          {item.responseType === "boolean" && (
                            <label className="flex items-center gap-2 text-xs">
                              <Checkbox
                                id={selId}
                                checked={Boolean(
                                  responses[item.id]?.value === true,
                                )}
                                onCheckedChange={(c) =>
                                  setResponse(item.id, c === true)
                                }
                              />
                              Yes / within limits
                            </label>
                          )}
                          {item.responseType === "text" && (
                            <Textarea
                              id={selId}
                              rows={2}
                              className="min-h-[52px] resize-y px-2 py-1 text-xs"
                              value={String(responses[item.id]?.value ?? "")}
                              onChange={(e) =>
                                setResponse(item.id, e.target.value)
                              }
                              aria-label={item.prompt}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              );
            })}
        </Table>
      </div>
    </div>
  );
}
