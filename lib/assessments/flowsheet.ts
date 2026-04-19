import type {
  AssessmentChoice,
  AssessmentItem,
  AssessmentTemplate,
} from "@/lib/prototype-alpha/types/assessment-template";
import type { AssessmentItemResponse } from "@/lib/prototype-alpha/types/assessment-submission";

/** Synthetic choice id appended to WDL gate rows for Epic-style “X” (exception) documentation. */
export const FLOWSHEET_EXCEPTION_CHOICE_ID = "ch_flowsheet_exception";

export const FLOWSHEET_EXCEPTION_CHOICE_LABEL = "X";

export function isFlowsheetWdlGateItem(item: AssessmentItem): boolean {
  if (item.responseType !== "choice") {
    return false;
  }
  const p = item.prompt.trim();
  return p.endsWith(" WDL");
}

export function gateHasExceptionChoice(item: AssessmentItem): boolean {
  return (item.choices ?? []).some((c) => c.id === FLOWSHEET_EXCEPTION_CHOICE_ID);
}

/** Ensures the synthetic exception choice exists on gate items; idempotent. */
export function ensureFlowsheetGateChoices(item: AssessmentItem): AssessmentItem {
  if (!isFlowsheetWdlGateItem(item)) {
    return item;
  }
  const choices = [...(item.choices ?? [])];
  if (choices.some((c) => c.id === FLOWSHEET_EXCEPTION_CHOICE_ID)) {
    return item;
  }
  const ex: AssessmentChoice = {
    id: FLOWSHEET_EXCEPTION_CHOICE_ID,
    label: FLOWSHEET_EXCEPTION_CHOICE_LABEL,
  };
  return { ...item, choices: [...choices, ex] };
}

/** Clone template and augment WDL gate rows for flowsheet UX. */
export function prepareFlowsheetTemplate(template: AssessmentTemplate): AssessmentTemplate {
  return {
    ...template,
    items: template.items.map((it) => ensureFlowsheetGateChoices(it)),
  };
}

export function isFlowsheetExceptionSelected(
  responses: Record<string, AssessmentItemResponse>,
  gateItemId: string,
): boolean {
  const v = responses[gateItemId]?.value;
  return v === FLOWSHEET_EXCEPTION_CHOICE_ID;
}

/** WDL path: any selection other than the exception choice (including empty / undefined). */
export function isFlowsheetWdlPath(
  responses: Record<string, AssessmentItemResponse>,
  gateItemId: string,
): boolean {
  return !isFlowsheetExceptionSelected(responses, gateItemId);
}

export function findGateItemForGroup(
  groupId: string,
  items: AssessmentItem[],
): AssessmentItem | undefined {
  return items.find((it) => it.groupId === groupId && isFlowsheetWdlGateItem(it));
}

/** Non-gate items in the same group (detail rows). */
export function flowsheetDetailItemsForGroup(
  groupId: string,
  items: AssessmentItem[],
  gateItemId: string,
): AssessmentItem[] {
  return items.filter((it) => it.groupId === groupId && it.id !== gateItemId);
}

/** Gate row first, then other items in template order. */
export function flowsheetOrderedItemsForGroup(
  groupId: string,
  items: AssessmentItem[],
  gate: AssessmentItem | undefined,
): AssessmentItem[] {
  const inGroup = items.filter((it) => it.groupId === groupId);
  if (!gate) {
    return inGroup;
  }
  const rest = inGroup.filter((it) => it.id !== gate.id);
  return [gate, ...rest];
}

const WDL_EQUALS_PREFIX = /^\s*WDL\s*=\s*/i;

/**
 * Narrative shown in the WDL info panel: gate rows use non-exception choice label(s);
 * other choice rows use text after `WDL =` on a matching choice.
 */
export function getWdlDefinitionForItem(item: AssessmentItem): string | null {
  if (isFlowsheetWdlGateItem(item)) {
    const parts = (item.choices ?? [])
      .filter((c) => c.id !== FLOWSHEET_EXCEPTION_CHOICE_ID)
      .map((c) => c.label.trim())
      .filter(Boolean);
    if (parts.length === 0) {
      return null;
    }
    return parts.join("\n\n");
  }
  if (item.responseType === "choice" || item.responseType === "multiChoice") {
    for (const c of item.choices ?? []) {
      const label = c.label;
      const match = label.match(WDL_EQUALS_PREFIX);
      if (match && match.index !== undefined) {
        return label.slice(match.index + match[0].length).trim();
      }
    }
  }
  return null;
}

/** Split definition copy into bullet segments (paragraph breaks, then semicolons). */
export function segmentWdlDefinitionText(text: string): string[] {
  const t = text.trim();
  const paragraphs = t.split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);
  const chunks = paragraphs.length > 1 ? paragraphs : [t];
  const out: string[] = [];
  for (const chunk of chunks) {
    const bySemi = chunk
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);
    if (bySemi.length > 1) {
      out.push(...bySemi);
    } else {
      out.push(chunk);
    }
  }
  return out.length > 0 ? out : [t];
}
