import type { ModuleId, RiderProfile, RidingTimeline } from "@/types";

export const RIDER_PROFILES: {
  id: RiderProfile;
  label: string;
  moduleId: ModuleId;
  base: string;
}[] = [
  {
    id: "just_moved",
    label: "Just moved here",
    moduleId: "fundamentals",
    base: "New here? Start with the fundamentals every Dutch cyclist knows.",
  },
  {
    id: "commuter",
    label: "Commute daily",
    moduleId: "priority",
    base: "Commuting? Right-of-way is where most near-misses happen - start there.",
  },
  {
    id: "occasional",
    label: "Occasional rides",
    moduleId: "signs",
    base: "Riding for fun? Learn to read the signs that keep you out of trouble.",
  },
];

export const RIDING_TIMELINES: {
  id: RidingTimeline;
  label: string;
  clause: string;
}[] = [
  {
    id: "this_week",
    label: "This week",
    clause: " You ride this week - let's move fast.",
  },
  { id: "this_month", label: "This month", clause: "" },
  {
    id: "exploring",
    label: "Just exploring",
    clause: " No rush - go at your pace.",
  },
];

export const DEFAULT_PROFILE: RiderProfile = "just_moved";
export const DEFAULT_TIMELINE: RidingTimeline = "this_month";

export function moduleForProfile(profile: RiderProfile): ModuleId {
  return (
    RIDER_PROFILES.find((p) => p.id === profile)?.moduleId ?? "fundamentals"
  );
}

export function planLine(
  profile: RiderProfile,
  timeline: RidingTimeline,
): string {
  const base =
    RIDER_PROFILES.find((p) => p.id === profile)?.base ?? RIDER_PROFILES[0].base;
  const clause = RIDING_TIMELINES.find((t) => t.id === timeline)?.clause ?? "";
  return base + clause;
}
