import type { AssessmentGroup } from "@/lib/prototype-alpha/types/assessment-template";

/** Labels from root → leaf for a group's ancestry. */
export function groupPathLabels(
  groups: AssessmentGroup[],
  groupId: string | undefined,
): string[] {
  if (!groupId) {
    return [];
  }
  const byId = new Map(groups.map((g) => [g.id, g] as const));
  const path: string[] = [];
  let gid: string | null | undefined = groupId;
  while (gid) {
    const g: AssessmentGroup | undefined = byId.get(gid);
    if (!g) {
      break;
    }
    path.push(g.label);
    gid = g.parentGroupId ?? null;
  }
  return path.reverse();
}
