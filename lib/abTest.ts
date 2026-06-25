const AB_KEY_PREFIX = "ab";
const ANON_ID_KEY = "anon_id";

// Hero copy A/B test - shared so the CTA + conversion events can tag the
// variant the user was actually shown without re-declaring the test name.
export const HERO_COPY_TEST = "hero_copy";
export const HERO_COPY_VARIANTS = [
  "control",
  "variant_a",
  "variant_b",
] as const;

// djb2 variant: deterministic, same seed+testName → same bucket every time
function deterministicIndex(
  seed: string,
  testName: string,
  count: number,
): number {
  const str = `${seed}:${testName}`;
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  }
  return h % count;
}

// Returns the stored variant if one exists for this test, otherwise null
export function getStoredVariant(testName: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`${AB_KEY_PREFIX}_${testName}`);
}

// Returns the assigned variant - reads from storage if already assigned,
// otherwise hashes anon_id+testName to pick one and persists it.
export function assignVariant(
  testName: string,
  variants: readonly string[],
): string {
  if (typeof window === "undefined") return variants[0];

  const stored = localStorage.getItem(`${AB_KEY_PREFIX}_${testName}`);
  if (stored !== null && variants.includes(stored)) return stored;

  const seed = localStorage.getItem(ANON_ID_KEY) ?? "";
  const variant = variants[deterministicIndex(seed, testName, variants.length)];
  localStorage.setItem(`${AB_KEY_PREFIX}_${testName}`, variant);
  return variant;
}
