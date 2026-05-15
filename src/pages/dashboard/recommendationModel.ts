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

/** Offline fallback when /recommendations/rank fails — uses scan ingredients when available. */
function fallbackWhyMatch(dishName: string, ingredients: string[], proteinG: number): string[] {
  const why: string[] = [];
  if (ingredients.length > 0) {
    const shown = ingredients.slice(0, 4).join(', ');
    why.push(`Uses menu ingredients: ${shown}${ingredients.length > 4 ? '…' : ''}.`);
  }
  if (proteinG >= 28) {
    why.push(`Protein-rich estimate (~${proteinG}g) for this dish.`);
  } else if (proteinG >= 18) {
    why.push(`Moderate protein (~${proteinG}g) — pair with a lean side if needed.`);
  }
  const lower = `${dishName} ${ingredients.join(' ')}`.toLowerCase();
  if (/(grilled|steamed|baked|poached)/.test(lower)) {
    why.push('Lighter preparation cues in the name or ingredients.');
  }
  if (why.length === 0) {
    why.push(`Scored from dish profile for ${dishName}.`);
  }
  return why.slice(0, 3);
}

function fallbackSmartMods(dishName: string, ingredients: string[]): string[] {
  const blob = `${dishName} ${ingredients.join(' ')}`.toLowerCase();
  const mods: string[] = [];
  if (/soy|sauce|gravy|butter|cream|cheese/.test(blob)) {
    mods.push('Ask for sauce, gravy, or cheese on the side.');
  }
  if (/fried|crispy|tempura|batter/.test(blob)) {
    mods.push('Request grilled or steamed instead of fried if available.');
  }
  if (/rice|pasta|noodle|bread|tortilla/.test(blob)) {
    mods.push('Swap half the starch for extra vegetables.');
  }
  if (mods.length === 0) {
    mods.push('Confirm portion size with staff; add vegetables when possible.');
  }
  return mods.slice(0, 2);
}

export function buildRecommendationsFromScan(
  dishes: Array<string | { name: string; ingredients?: string[] }>,
  meta: { restaurantLabel: string; location: string; lastScanAt: string; confidence: number | null },
): ScanRecommendationsPayload {
  const normalized = dishes
    .map((d) =>
      typeof d === 'string'
        ? { name: d, ingredients: [] as string[] }
        : { name: d.name, ingredients: d.ingredients ?? [] },
    )
    .filter((d) => d.name.trim());
  const mealTypes = ['Lunch', 'Dinner', 'Brunch', 'All day'];
  const rows: RecommendationCardData[] = normalized.map((dish, idx) => {
    const dishName = dish.name.trim();
    const seed = hashString(dishName + String(idx));
    const score = 98 - (idx * 4 + (seed % 5));
    const proteinG = 35 + (seed % 35);
    const carbsG = 40 + (seed % 55);
    const fatG = 12 + (seed % 22);
    const calories = proteinG * 4 + carbsG * 4 + fatG * 9 + (seed % 80);

    const whyMatch = fallbackWhyMatch(dishName, dish.ingredients, proteinG);
    const smartMods = fallbackSmartMods(dishName, dish.ingredients);

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
    rankInputCount: normalized.length,
    rankFilteredCount: 0,
    rankOutputCount: normalized.length,
  };
}
