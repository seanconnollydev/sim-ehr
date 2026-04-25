"use client";

import { useMemo, useState } from "react";
import type { AssessmentChoice } from "@/lib/prototype-alpha/types/assessment-template";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { HugeiconsIcon } from "@hugeicons/react";
import { UnfoldMoreIcon } from "@hugeicons/core-free-icons";

type Props = {
  id: string;
  label: string;
  choices: AssessmentChoice[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  className?: string;
};

function displaySummary(
  selectedIds: string[],
  byId: Map<string, AssessmentChoice>,
): string {
  if (selectedIds.length === 0) {
    return "Select…";
  }
  return selectedIds
    .map((id) => byId.get(id)?.label ?? id)
    .join("; ");
}

/**
 * Popover + checkbox list; closed trigger shows `; ` joined labels.
 */
export function AssessmentFlowsheetMultiselect({
  id,
  label,
  choices,
  value,
  onChange,
  disabled,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const byId = useMemo(
    () => new Map(choices.map((c) => [c.id, c])),
    [choices],
  );
  const summary = useMemo(
    () => displaySummary(value, byId),
    [value, byId],
  );

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            id={id}
            disabled={disabled}
            className={cn(
              "h-auto min-h-7 w-full min-w-0 max-w-full justify-start gap-1.5 border px-2 py-0.5 font-normal shadow-none",
              "text-foreground/90 [&:hover]:text-foreground/90",
              className,
            )}
            aria-label={label}
            aria-expanded={open}
            aria-haspopup="dialog"
          >
            <span className="line-clamp-2 min-w-0 flex-1 text-left text-xs leading-snug break-words">
              {summary}
            </span>
            <HugeiconsIcon
              icon={UnfoldMoreIcon}
              strokeWidth={2}
              className="text-muted-foreground size-3.5 shrink-0"
            />
          </Button>
        }
      />
      <PopoverContent
        align="start"
        className="w-[min(100vw-2rem,28rem)] max-w-[min(100vw-2rem,36rem)] min-w-0 p-0"
      >
        <ScrollArea className="h-[min(18rem,50dvh)]">
          <ul className="flex flex-col gap-0.5 p-2">
            {choices.map((ch) => {
              const checked = value.includes(ch.id);
              return (
                <li key={ch.id}>
                  <Label
                    className="hover:bg-muted/60 flex cursor-pointer items-start gap-2.5 rounded-md px-1.5 py-1.5 text-xs leading-snug"
                    htmlFor={`${id}-${ch.id}`}
                  >
                    <Checkbox
                      id={`${id}-${ch.id}`}
                      className="mt-0.5 shrink-0"
                      checked={checked}
                      onCheckedChange={(c) => {
                        const next = new Set(value);
                        if (c === true) {
                          next.add(ch.id);
                        } else {
                          next.delete(ch.id);
                        }
                        onChange([...next]);
                      }}
                    />
                    <span className="min-w-0 break-words">{ch.label}</span>
                  </Label>
                </li>
              );
            })}
          </ul>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
