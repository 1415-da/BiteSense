export interface RecommendationCardData {
  id: string;
  dishName: string;
  restaurant: string;
  mealType: string;
  calories: number;
  score: number;
  rank: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinFill: number;
  carbsFill: number;
  fatFill: number;
  whyMatch: string[];
  smartMods: string[];
}

export interface ScanRecommendationsPayload {
  restaurantLabel: string;
  location: string;
  lastScanAt: string;
  confidence: number | null;
  rows: RecommendationCardData[];
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

const WHY_POOL: Array<(p: number) => string> = [
  (p: number) => `High protein (${p}g) — hits your daily target.`,
  () => 'Lower sodium than most menu items.',
  () => 'Grilled, not fried — aligned with your goals.',
  () => 'Fiber-forward sides help steady blood sugar.',
  () => 'Balanced macros for your weight goal.',
];

const MOD_POOL = [
  'Ask for dressing on the side (-180mg sodium)',
  'Swap potatoes for greens (-140 kcal)',
  'Request half portion of sauce (-90 kcal)',
  'Add extra vegetables (+fiber, minimal calories)',
];

export function buildRecommendationsFromScan(
  dishNames: string[],
  meta: { restaurantLabel: string; location: string; lastScanAt: string; confidence: number | null },
): ScanRecommendationsPayload {
  const mealTypes = ['Lunch', 'Dinner', 'Brunch', 'All day'];
  const rows: RecommendationCardData[] = dishNames.map((dishName, idx) => {
    const seed = hashString(dishName + String(idx));
    const score = 98 - (idx * 4 + (seed % 5));
    const proteinG = 35 + (seed % 35);
    const carbsG = 40 + (seed % 55);
    const fatG = 12 + (seed % 22);
    const calories = proteinG * 4 + carbsG * 4 + fatG * 9 + (seed % 80);

    const whyMatch = [pick(WHY_POOL, seed)(proteinG), pick(WHY_POOL, seed + 1)(proteinG), pick(WHY_POOL, seed + 2)(proteinG)];

    const smartMods = [pick(MOD_POOL, seed), pick(MOD_POOL, seed + 3)];

    return {
      id: `${meta.lastScanAt}-${idx}-${hashString(dishName)}`,
      dishName,
      restaurant: meta.restaurantLabel,
      mealType: pick(mealTypes, seed + idx),
      calories,
      score,
      rank: idx + 1,
      proteinG,
      carbsG,
      fatG,
      proteinFill: Math.min(100, 55 + (seed % 40)),
      carbsFill: Math.min(100, 40 + ((seed >> 2) % 45)),
      fatFill: Math.min(100, 35 + ((seed >> 4) % 40)),
      whyMatch,
      smartMods,
    };
  });

  rows.sort((a, b) => b.score - a.score);
  rows.forEach((r, i) => {
    r.rank = i + 1;
  });

  return {
    restaurantLabel: meta.restaurantLabel,
    location: meta.location,
    lastScanAt: meta.lastScanAt,
    confidence: meta.confidence,
    rows,
  };
}
