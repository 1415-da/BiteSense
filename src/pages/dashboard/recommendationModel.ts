export interface RecommendationCardData {
  id: string;
  dishName: string;
  restaurant: string;
  mealType: string;
  calories: number;
  score: number;
  /** Hybrid-only score when ML blend is active */
  scoreHeuristic?: number;
  /** Surrogate model score when blend is active */
  scoreMl?: number;
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
  /** From API rank metrics when available */
  rankInputCount?: number;
  rankFilteredCount?: number;
  rankOutputCount?: number;
}

/** Backend POST /api/v1/recommendations/rank response (subset used by UI). */
export interface RecommendRankApiRow {
  id: string;
  dish_name: string;
  restaurant_label: string;
  meal_type: string;
  score: number;
  rank: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  protein_fill: number;
  carbs_fill: number;
  fat_fill: number;
  why_match: string[];
  smart_mods: string[];
  score_heuristic?: number | null;
  score_ml?: number | null;
}

export interface RecommendRankApiResponse {
  run_id: number;
  model_version: string;
  restaurant_label: string;
  location: string;
  last_scan_at: string;
  confidence: number | null;
  metrics: Record<string, unknown>;
  rows: RecommendRankApiRow[];
}

export function mapRecommendRankApiToPayload(res: RecommendRankApiResponse): ScanRecommendationsPayload {
  const m = res.metrics ?? {};
  const num = (k: string): number | undefined => {
    const v = m[k];
    return typeof v === 'number' && Number.isFinite(v) ? v : undefined;
  };
  const rows: RecommendationCardData[] = res.rows.map((r) => ({
    id: r.id,
    dishName: r.dish_name,
    restaurant: r.restaurant_label,
    mealType: r.meal_type,
    calories: r.calories,
    score: Math.round(r.score),
    scoreHeuristic:
      r.score_heuristic != null && Number.isFinite(r.score_heuristic) ? Math.round(r.score_heuristic) : undefined,
    scoreMl: r.score_ml != null && Number.isFinite(r.score_ml) ? Math.round(r.score_ml) : undefined,
    rank: r.rank,
    proteinG: r.protein_g,
    carbsG: r.carbs_g,
    fatG: r.fat_g,
    proteinFill: Math.min(100, Math.round(r.protein_fill)),
    carbsFill: Math.min(100, Math.round(r.carbs_fill)),
    fatFill: Math.min(100, Math.round(r.fat_fill)),
    whyMatch: r.why_match,
    smartMods: r.smart_mods,
  }));
  return {
    restaurantLabel: res.restaurant_label,
    location: res.location,
    lastScanAt: new Date(res.last_scan_at).toLocaleString(),
    confidence: res.confidence,
    rows,
    rankInputCount: num('input_dishes'),
    rankFilteredCount: num('filtered_out'),
    rankOutputCount: num('output_dishes'),
  };
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
  dishes: Array<string | { name: string }>,
  meta: { restaurantLabel: string; location: string; lastScanAt: string; confidence: number | null },
): ScanRecommendationsPayload {
  const dishNames = dishes.map((d) => (typeof d === 'string' ? d : d.name)).filter(Boolean);
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
    rankInputCount: dishNames.length,
    rankFilteredCount: 0,
    rankOutputCount: dishNames.length,
  };
}
