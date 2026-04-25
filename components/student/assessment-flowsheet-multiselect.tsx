"use client";

import { useMemo } from "react";
import type { AssessmentChoice } from "@/lib/prototype-alpha/types/assessment-template";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

type Props = {
  id: string;
  label: string;
  choices: AssessmentChoice[];
  value: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  className?: string;
};

/**
 * Multiselect for flowsheet `multiChoice` items: shadcn Combobox (multiple) with chips.
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
  const anchorRef = useComboboxAnchor();
  const byId = useMemo(
    () => new Map(choices.map((c) => [c.id, c] as const)),
    [choices],
  );
  const selectedChoices = useMemo((): AssessmentChoice[] => {
    const out: AssessmentChoice[] = [];
    for (const id_ of value) {
      const ch = byId.get(id_);
      if (ch) {
        out.push(ch);
      }
    }
    return out;
  }, [value, byId]);
  return (
    <div className={cn("w-full min-w-0", className)}>
      <Combobox<AssessmentChoice, true>
        items={choices}
        multiple
        value={selectedChoices}
        onValueChange={(next) => onChange((next ?? []).map((c) => c.id))}
        itemToStringValue={(c) => c.label}
        isItemEqualToValue={(a, b) => a.id === b.id}
        disabled={disabled}
        modal={false}
      >
        <ComboboxChips
          ref={anchorRef}
          className={cn(
            "min-h-7 w-full min-w-0 max-w-full rounded-md border border-input/80 bg-input/30 px-2 py-0.5 text-xs",
            "has-data-[slot=combobox-chip]:px-1.5",
            "[&_[data-slot=combobox-chip]]:h-auto [&_[data-slot=combobox-chip]]:min-h-5.5",
            "[&_[data-slot=combobox-chip]]:max-w-full [&_[data-slot=combobox-chip]]:whitespace-normal",
          )}
        >
          <ComboboxValue>
            {selectedChoices.map((ch) => (
              <ComboboxChip key={ch.id}>{ch.label}</ComboboxChip>
            ))}
          </ComboboxValue>
          <ComboboxChipsInput
            id={id}
            placeholder="Add…"
            aria-label={label}
            className="min-w-[4.5rem] text-xs"
            disabled={disabled}
          />
        </ComboboxChips>
        <ComboboxContent
          anchor={anchorRef}
          className="!w-[min(100vw-2rem,28rem)] !max-w-[min(100vw-2rem,36rem)] !min-w-[var(--anchor-width,100%)]"
        >
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList className="max-h-[min(18rem,50dvh)]">
            {(item: AssessmentChoice) => (
              <ComboboxItem
                key={item.id}
                value={item}
                className="items-start py-2 text-xs leading-snug whitespace-normal"
              >
                {item.label}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}
