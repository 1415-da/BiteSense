import { apiRequest, readApiError } from '../auth/api';
import type { RecommendRankApiResponse } from '../pages/dashboard/recommendationModel';

/** Structured dish row from extraction or saved scan (legacy scans may still be plain strings in older DB rows). */
export interface MenuDishDto {
  name: string;
  description?: string | null;
  ingredients: string[];
  details?: string | null;
}

export interface MenuExtractDto {
  confidence: number;
  items: MenuDishDto[];
  raw_text?: string | null;
}

/** Normalize legacy string rows or partial objects from the API into `MenuDishDto`. */
export function normalizeMenuDish(raw: unknown): MenuDishDto | null {
  if (typeof raw === 'string') {
    const name = raw.trim();
    return name ? { name, ingredients: [], description: null, details: null } : null;
  }
  if (raw && typeof raw === 'object' && 'name' in raw) {
    const o = raw as Record<string, unknown>;
    const name = String(o.name ?? '').trim();
    if (!name) return null;
    return {
      name,
      description: o.description != null ? String(o.description) : null,
      ingredients: Array.isArray(o.ingredients)
        ? o.ingredients.map((x) => String(x).trim()).filter(Boolean)
        : [],
      details: o.details != null ? String(o.details) : null,
    };
  }
  return null;
}

export interface MenuScanDto {
  id: number;
  input_mode: 'url' | 'image' | 'pdf';
  menu_url: string | null;
  upload_filename: string | null;
  restaurant_name: string | null;
  cuisine_type: string | null;
  location: string | null;
  confidence: number | null;
  dishes: MenuDishDto[];
  scanned_at: string;
}

export interface MenuScanSummaryDto {
  id: number;
  restaurant_label: string;
  location_label: string;
  scanned_at: string;
  item_count: number;
  confidence: number | null;
}

export interface GoalsDto {
  primary_goal: string;
  target_weight_kg: string;
  workouts_per_week: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface HealthDto {
  allergens: string[];
  diets: string[];
  max_sodium_mg: number;
  max_sugar_g: number;
}

export interface SavedMealDto {
  id: number;
  dish_name: string;
  restaurant: string;
  note: string;
  created_at: string;
}

export async function fetchLatestScan(): Promise<MenuScanDto | null> {
  const res = await apiRequest('/api/v1/scans/latest', { method: 'GET' });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MenuScanDto | null;
}

export async function fetchScanHistory(): Promise<MenuScanSummaryDto[]> {
  const res = await apiRequest('/api/v1/scans', { method: 'GET' });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MenuScanSummaryDto[];
}

export async function patchMenuScanDishes(scanId: number, dishes: MenuDishDto[]): Promise<MenuScanDto> {
  const res = await apiRequest(`/api/v1/scans/${scanId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ dishes }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MenuScanDto;
}

export async function createMenuScan(body: {
  input_mode: 'url' | 'image' | 'pdf';
  menu_url?: string | null;
  upload_filename?: string | null;
  restaurant_name?: string | null;
  cuisine_type?: string | null;
  location?: string | null;
  confidence?: number | null;
  dishes: MenuDishDto[];
}): Promise<MenuScanDto> {
  const res = await apiRequest('/api/v1/scans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MenuScanDto;
}

export async function fetchGoals(): Promise<GoalsDto> {
  const res = await apiRequest('/api/v1/me/goals', { method: 'GET' });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as GoalsDto;
}

export async function putGoals(body: GoalsDto): Promise<GoalsDto> {
  const res = await apiRequest('/api/v1/me/goals', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as GoalsDto;
}

export async function fetchHealth(): Promise<HealthDto> {
  const res = await apiRequest('/api/v1/me/health', { method: 'GET' });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as HealthDto;
}

export async function putHealth(body: HealthDto): Promise<HealthDto> {
  const res = await apiRequest('/api/v1/me/health', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as HealthDto;
}

export async function fetchSavedMeals(): Promise<SavedMealDto[]> {
  const res = await apiRequest('/api/v1/saved-meals', { method: 'GET' });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as SavedMealDto[];
}

export async function createSavedMeal(body: { dish_name: string; restaurant: string; note: string }): Promise<SavedMealDto> {
  const res = await apiRequest('/api/v1/saved-meals', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as SavedMealDto;
}

export async function deleteSavedMeal(id: number): Promise<void> {
  const res = await apiRequest(`/api/v1/saved-meals/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function patchProfile(body: { full_name?: string; email?: string }): Promise<{ id: number; email: string; full_name: string }> {
  const res = await apiRequest('/api/v1/me/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as { id: number; email: string; full_name: string };
}

export async function changePassword(body: { current_password: string; new_password: string }): Promise<void> {
  const res = await apiRequest('/api/v1/me/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await readApiError(res));
}

export async function postRecommendationsRank(body: { scan_id?: number | null; top_n?: number }): Promise<RecommendRankApiResponse> {
  const res = await apiRequest('/api/v1/recommendations/rank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scan_id: body.scan_id ?? null, top_n: body.top_n ?? 6 }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as RecommendRankApiResponse;
}

export async function fetchRecommendationMetrics(): Promise<Record<string, unknown>> {
  const res = await apiRequest('/api/v1/recommendations/metrics', { method: 'GET' });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as Record<string, unknown>;
}

export async function extractMenuFromFile(file: File, includeRaw = false): Promise<MenuExtractDto> {
  const formData = new FormData();
  formData.append('file', file);
  const q = includeRaw ? '?include_raw=true' : '';
  const res = await apiRequest(`/api/v1/scans/extract${q}`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MenuExtractDto;
}

export async function extractMenuFromUrl(url: string, includeRaw = false): Promise<MenuExtractDto> {
  const q = includeRaw ? '?include_raw=true' : '';
  const res = await apiRequest(`/api/v1/scans/extract-url${q}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error(await readApiError(res));
  return (await res.json()) as MenuExtractDto;
}
