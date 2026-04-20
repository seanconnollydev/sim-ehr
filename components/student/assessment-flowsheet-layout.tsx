"use client";

import { useMemo, useState, type ReactNode } from "react";
import type {
  AssessmentItem,
  AssessmentTemplate,
} from "@/lib/prototype-alpha/types/assessment-template";
import type { AssessmentItemResponse } from "@/lib/prototype-alpha/types/assessment-submission";
import { groupPathLabels } from "@/lib/assessments/group-path";
import {
  FLOWSHEET_EXCEPTION_CHOICE_ID,
  findSectionRollupGate,
  getWdlDefinitionForItem,
  isFlowsheetExceptionSelected,
  isFlowsheetWdlGateItem,
  isFlowsheetWdlXComboboxItem,
  prepareFlowsheetTemplate,
  segmentFlowsheetRowItems,
  segmentWdlDefinitionText,
} from "@/lib/assessments/flowsheet";
import { AssessmentChoiceCombobox } from "@/components/student/assessment-choice-combobox";
import { Button } from "@/components/ui/button";
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
import {
  ArrowRight01Icon,
  Cancel01Icon,
  SearchIcon,
} from "@hugeicons/core-free-icons";

type Props = {
  template: AssessmentTemplate;
  responses: Record<string, AssessmentItemResponse>;
  setResponse: (itemId: string, value: AssessmentItemResponse["value"]) => void;
};

function FlowsheetItemTableRow({
  item,
  responses,
  setResponse,
  onOpenWdlPanel,
}: {
  item: AssessmentItem;
  responses: Record<string, AssessmentItemResponse>;
  setResponse: (itemId: string, value: AssessmentItemResponse["value"]) => void;
  onOpenWdlPanel: (itemId: string) => void;
}) {
  const selId = `flowsheet-${item.id}`;
  const wdlDef = getWdlDefinitionForItem(item);
  const showWdlInfo = isFlowsheetWdlGateItem(item) && Boolean(wdlDef);
  const wdlXCombobox = isFlowsheetWdlXComboboxItem(item);
  return (
    <TableRow
      className={cn(
        "hover:bg-muted/30",
        isFlowsheetWdlGateItem(item) && "bg-muted/20",
      )}
    >
      <TableCell className="align-top py-1 pr-2 pl-3">
        <Label
          htmlFor={selId}
          className="text-foreground text-xs leading-snug font-normal"
        >
          {item.prompt}
          {wdlXCombobox && (
            <span className="text-muted-foreground ml-1.5 text-[10px]">
              (WDL / X)
            </span>
          )}
        </Label>
      </TableCell>
      <TableCell className="align-top py-1 pr-3 pl-2">
        <FlowsheetValueWithWdl
          reserveIconSpace={item.responseType === "choice"}
          showWdl={showWdlInfo}
          ariaLabel={`View Within Defined Limits definition for ${item.prompt}`}
          onOpenWdl={() => onOpenWdlPanel(item.id)}
        >
          {item.responseType === "choice" && (
            <AssessmentChoiceCombobox
              id={selId}
              label={item.prompt}
              choices={
                wdlXCombobox
                  ? (item.choices ?? []).map((ch) => ({
                      ...ch,
                      label:
                        ch.id === FLOWSHEET_EXCEPTION_CHOICE_ID ? "X" : "WDL",
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
                const selected = Array.isArray(responses[item.id]?.value)
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
                checked={Boolean(responses[item.id]?.value === true)}
                onCheckedChange={(c) => setResponse(item.id, c === true)}
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
              onChange={(e) => setResponse(item.id, e.target.value)}
              aria-label={item.prompt}
            />
          )}
        </FlowsheetValueWithWdl>
      </TableCell>
    </TableRow>
  );
}

function FlowsheetValueWithWdl({
  reserveIconSpace,
  showWdl,
  ariaLabel,
  onOpenWdl,
  children,
}: {
  reserveIconSpace: boolean;
  showWdl: boolean;
  ariaLabel: string;
  onOpenWdl: () => void;
  children: ReactNode;
}) {
  if (!reserveIconSpace) {
    return <>{children}</>;
  }
  return (
    <div className="flex min-w-0 items-start gap-1">
      <div className="min-w-0 flex-1">{children}</div>
      {showWdl ? (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-7 shrink-0"
          aria-label={ariaLabel}
          onClick={(e) => {
            e.stopPropagation();
            onOpenWdl();
          }}
        >
          <HugeiconsIcon icon={SearchIcon} strokeWidth={2} className="size-4" />
        </Button>
      ) : (
        <div className="size-7 shrink-0" aria-hidden />
      )}
    </div>
  );
}

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
  const [wdlPanelItemId, setWdlPanelItemId] = useState<string | null>(null);

  const wdlPanelItem = wdlPanelItemId
    ? items.find((i) => i.id === wdlPanelItemId)
    : undefined;
  const wdlPanelDefinition =
    wdlPanelItem && getWdlDefinitionForItem(wdlPanelItem);
  const wdlPanelPathLine = wdlPanelItem
    ? groupPathLabels(groups, wdlPanelItem.groupId).join(" → ")
    : "";

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

      <div className="flex min-h-0 min-w-0 flex-1">
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
              const groupLabel =
                groups.find((g) => g.id === block.groupId)?.label ?? "";
              const sectionGate = findSectionRollupGate(
                block.groupId,
                groupLabel,
                block.items,
              );
              const bodyItems = sectionGate
                ? block.items.filter((i) => i.id !== sectionGate.id)
                : block.items;
              const sectionExpanded =
                !sectionGate ||
                isFlowsheetExceptionSelected(responses, sectionGate.id);
              const rowSegments = segmentFlowsheetRowItems(bodyItems);

              const pathLine =
                block.path.length > 0 ? block.path.join(" → ") : "—";

              const rowProps = {
                responses,
                setResponse,
                onOpenWdlPanel: setWdlPanelItemId,
              };

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
                  {sectionGate ? (
                    <FlowsheetItemTableRow item={sectionGate} {...rowProps} />
                  ) : null}
                  {sectionExpanded
                    ? rowSegments.flatMap((seg) => {
                        if (seg.gate) {
                          const out = [
                            <FlowsheetItemTableRow
                              key={seg.gate.id}
                              item={seg.gate}
                              {...rowProps}
                            />,
                          ];
                          if (
                            isFlowsheetExceptionSelected(
                              responses,
                              seg.gate.id,
                            )
                          ) {
                            for (const d of seg.details) {
                              out.push(
                                <FlowsheetItemTableRow
                                  key={d.id}
                                  item={d}
                                  {...rowProps}
                                />,
                              );
                            }
                          }
                          return out;
                        }
                        return seg.details.map((d) => (
                          <FlowsheetItemTableRow
                            key={d.id}
                            item={d}
                            {...rowProps}
                          />
                        ));
                      })
                    : null}
                </TableBody>
              );
            })}
        </Table>
        </div>

        <aside
          className={cn(
            "border-border bg-muted/10 flex min-h-0 flex-col border-l transition-[width] duration-200 ease-out",
            wdlPanelItemId
              ? "w-[min(22rem,40vw)] shrink-0"
              : "w-0 shrink-0 overflow-hidden border-l-0",
          )}
          aria-hidden={!wdlPanelItemId}
        >
          {wdlPanelItem && wdlPanelDefinition ? (
            <div className="flex min-h-0 min-w-[min(22rem,40vw)] flex-1 flex-col">
              <div className="border-b px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-muted-foreground line-clamp-2 text-[10px] leading-tight">
                      {wdlPanelPathLine || "—"}
                    </p>
                    <p className="text-foreground mt-0.5 text-xs font-semibold leading-snug">
                      {wdlPanelItem.prompt}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0"
                    aria-label="Close definition panel"
                    onClick={() => setWdlPanelItemId(null)}
                  >
                    <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
                  </Button>
                </div>
                {isFlowsheetWdlXComboboxItem(wdlPanelItem) ? (
                  <p className="text-muted-foreground mt-2 text-[10px] leading-snug">
                    WDL = Within defined limits. X = Exceptions to WDL.
                  </p>
                ) : null}
              </div>
              <ScrollArea className="min-h-0 flex-1">
                <div className="p-3">
                  <p className="text-muted-foreground mb-2 text-[10px] font-medium tracking-wide uppercase">
                    Row information
                  </p>
                  <ul className="text-foreground list-disc space-y-1.5 pl-4 text-xs leading-relaxed">
                    {segmentWdlDefinitionText(wdlPanelDefinition).map(
                      (segment, i) => (
                        <li key={i}>{segment}</li>
                      ),
                    )}
                  </ul>
                </div>
              </ScrollArea>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
