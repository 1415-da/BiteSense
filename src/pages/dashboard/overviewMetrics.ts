import type { GoalsDto, HealthDto, MenuDishDto } from '../../api/workspace';
import type { SparkTrend } from './SparklineMini';
import type { ScanRecommendationsPayload } from './recommendationModel';

export type MetricVariant = 'accent' | 'warn' | 'muted';

export interface OverviewMetricTile {
  id: string;
  label: string;
  pillLabel: string;
  variant: MetricVariant;
  trend: SparkTrend;
  /** 0–100 for sparkline shape when no ranked dishes */
  sparkValue?: number;
}

const SODIUM_KEYWORDS: Record<string, number> = {
  soy: 280,
  sauce: 220,
  gravy: 180,
  noodle: 320,
  ramen: 900,
  pickle: 200,
  cheese: 180,
  bacon: 190,
  ham: 210,
  salami: 380,
  shrimp: 180,
  fish: 70,
  chicken: 90,
  beef: 85,
  butter: 90,
  cream: 30,
  rice: 5,
  vegetables: 25,
};

const SUGAR_KEYWORDS: Record<string, number> = {
  sugar: 120,
  honey: 80,
  syrup: 90,
  dessert: 45,
  chocolate: 35,
  mango: 25,
  yogurt: 12,
  milk: 10,
  tomato: 8,
  rice: 0,
  bread: 4,
  vegetables: 5,
};

function estimateSodiumSugar(ingredients: string[], dishName: string): { sodiumMg: number; sugarG: number } {
  const blob = `${dishName} ${ingredients.join(' ')}`.toLowerCase();
  let sodiumMg = 120;
  let sugarG = 8;
  for (const [kw, mg] of Object.entries(SODIUM_KEYWORDS)) {
    if (blob.includes(kw)) sodiumMg += mg;
  }
  for (const [kw, g] of Object.entries(SUGAR_KEYWORDS)) {
    if (blob.includes(kw)) sugarG += g;
  }
  return { sodiumMg: Math.min(2200, sodiumMg), sugarG: Math.min(80, sugarG) };
}

function findIngredients(parsedItems: MenuDishDto[], dishName: string): string[] {
  const key = dishName.trim().toLowerCase();
  const row = parsedItems.find((d) => d.name.trim().toLowerCase() === key);
  return row?.ingredients ?? [];
}

function pillForRatio(ratio: number, good: string, mid: string, bad: string): { label: string; variant: MetricVariant } {
  if (ratio <= 0.85) return { label: good, variant: 'accent' };
  if (ratio <= 1.15) return { label: mid, variant: 'warn' };
  return { label: bad, variant: 'warn' };
}

function trendFromDelta(delta: number, invert = false): SparkTrend {
  const d = invert ? -delta : delta;
  if (d > 0.08) return 'up';
  if (d < -0.08) return 'down';
  return 'flat';
}

function emptyTiles(): OverviewMetricTile[] {
  return [
    { id: 'calories', label: 'Calorie fit', pillLabel: 'Scan a menu', variant: 'muted', trend: 'flat', sparkValue: 20 },
    { id: 'protein', label: 'Protein fit', pillLabel: '—', variant: 'muted', trend: 'flat', sparkValue: 30 },
    { id: 'sodium', label: 'Sodium risk', pillLabel: '—', variant: 'muted', trend: 'flat', sparkValue: 40 },
    { id: 'sugar', label: 'Sugar risk', pillLabel: '—', variant: 'muted', trend: 'flat', sparkValue: 50 },
  ];
}

export function buildOverviewMetrics(
  recs: ScanRecommendationsPayload | null,
  goals: GoalsDto,
  health: HealthDto,
  parsedItems: MenuDishDto[],
): OverviewMetricTile[] {
  if (!recs || recs.rows.length === 0) {
    return emptyTiles();
  }

  const ranked = [...recs.rows].sort((a, b) => a.rank - b.rank);
  const top = ranked.slice(0, Math.min(3, ranked.length));
  const avgProteinFill = Math.round(top.reduce((s, r) => s + r.proteinFill, 0) / top.length);
  const avgCalories = Math.round(top.reduce((s, r) => s + r.calories, 0) / top.length);

  const dailyCalTarget = goals.protein_g * 4 + goals.carbs_g * 4 + goals.fat_g * 9;
  const mealCalTarget = Math.max(400, Math.round(dailyCalTarget / 3));
  const calRatio = avgCalories / mealCalTarget;
  const calPill = pillForRatio(calRatio, 'On target', 'Moderate', 'High');

  const proteinPill =
    avgProteinFill >= 70
      ? { label: 'Strong', variant: 'accent' as const }
      : avgProteinFill >= 45
        ? { label: 'Fair', variant: 'warn' as const }
        : { label: 'Low', variant: 'warn' as const };

  let sodiumSum = 0;
  let sugarSum = 0;
  top.forEach((r) => {
    const ing = findIngredients(parsedItems, r.dishName);
    const est = estimateSodiumSugar(ing, r.dishName);
    sodiumSum += est.sodiumMg;
    sugarSum += est.sugarG;
  });
  const sodiumAvg = sodiumSum / top.length;
  const sugarAvg = sugarSum / top.length;
  const sodiumMealBudget = Math.max(400, health.max_sodium_mg / 3);
  const sugarMealBudget = Math.max(8, health.max_sugar_g / 3);
  const sodiumPill = pillForRatio(sodiumAvg / sodiumMealBudget, 'Low', 'Moderate', 'High');
  const sugarPill = pillForRatio(sugarAvg / sugarMealBudget, 'Low', 'Moderate', 'High');

  const proteinTrend = trendFromDelta(
    ((top[0]?.proteinFill ?? 0) - (top[top.length - 1]?.proteinFill ?? 0)) / 100
  );
  const sodiumTrend = trendFromDelta(sodiumAvg / sodiumMealBudget, true);
  const sugarTrend = trendFromDelta(sugarAvg / sugarMealBudget, true);

  return [
    {
      id: 'calories',
      label: 'Calorie fit',
      pillLabel: calPill.label,
      variant: calPill.variant,
      trend: trendFromDelta(mealCalTarget - avgCalories, true),
      sparkValue: Math.min(100, Math.round((avgCalories / mealCalTarget) * 100)),
    },
    {
      id: 'protein',
      label: 'Protein fit',
      pillLabel: proteinPill.label,
      variant: proteinPill.variant,
      trend: proteinTrend,
      sparkValue: avgProteinFill,
    },
    {
      id: 'sodium',
      label: 'Sodium risk',
      pillLabel: sodiumPill.label,
      variant: sodiumPill.variant,
      trend: sodiumTrend,
      sparkValue: Math.min(100, Math.round((sodiumAvg / sodiumMealBudget) * 100)),
    },
    {
      id: 'sugar',
      label: 'Sugar risk',
      pillLabel: sugarPill.label,
      variant: sugarPill.variant,
      trend: sugarTrend,
      sparkValue: Math.min(100, Math.round((sugarAvg / sugarMealBudget) * 100)),
    },
  ];
}

export interface OverviewSummary {
  avgScore: number | null;
  topDish: string | null;
  topScore: number | null;
  filteredCount: number;
}

export function buildOverviewSummary(recs: ScanRecommendationsPayload | null): OverviewSummary {
  if (!recs || recs.rows.length === 0) {
    return { avgScore: null, topDish: null, topScore: null, filteredCount: recs?.rankFilteredCount ?? 0 };
  }
  const ranked = [...recs.rows].sort((a, b) => a.rank - b.rank);
  const top = ranked[0];
  const top3 = ranked.slice(0, Math.min(3, ranked.length));
  const avgScore = Math.round(top3.reduce((s, r) => s + r.score, 0) / top3.length);
  return {
    avgScore,
    topDish: top?.dishName ?? null,
    topScore: top?.score ?? null,
    filteredCount: recs.rankFilteredCount ?? 0,
  };
}

/** Prefer ranked top picks; fall back to parsed dish names. */
export function overviewTopPicks(
  recs: ScanRecommendationsPayload | null,
  parsedItems: MenuDishDto[],
): string[] {
  if (recs && recs.rows.length > 0) {
    return recs.rows
      .slice()
      .sort((a, b) => a.rank - b.rank)
      .slice(0, 3)
      .map((r) => r.dishName);
  }
  if (parsedItems.length > 0) {
    return parsedItems.slice(0, 3).map((d) => d.name);
  }
  return ['—'];
}
