/**
 * services/providers.ts
 *
 * Provider search + profile + registration.
 * Types match the real FastAPI schemas in app/schemas/providers.py
 *
 *   GET  /providers/categories
 *   GET  /providers/locations
 *   GET  /providers/me            (own provider profile)
 *   POST /providers/register
 *   GET  /providers               ?location_node_id=&category_id=&page=&page_size=
 *   GET  /providers/:id
 */

import { ApiError } from "./api";
import { api } from "./api";

// ── Reference types ───────────────────────────────────────────────────────────
export interface SubCategory {
  id: number;
  category_id: number;
  name_fr: string;
  name_en: string;
  slug: string;
}

export interface Category {
  id: number;
  name_fr: string;
  name_en: string;
  slug: string;
  icon_name: string;
  sort_order: number;
  sub_categories: SubCategory[];
}

export interface LocationNode {
  id: number;
  name: string;
  display_name_fr: string;
  latitude: number;
  longitude: number;
  sort_order: number;
}

// ── Provider types ────────────────────────────────────────────────────────────
export interface ProviderOut {
  id: string;
  user_id: string;
  full_name: string;
  category_id: number;
  sub_category_id: number;
  location_node_id: number;
  is_mobile_provider: boolean;
  offers_delivery: boolean;
  is_active: boolean;
  id_card_verified: boolean;
  suspension_reason: string | null;
  confirmed_tx_count: number;
  thumbs_up_count: number;
  thumbs_down_count: number;
  satisfaction_rate: number | null;
  created_at: string;
  updated_at: string;
  category: Category;
  sub_category: SubCategory;
  location_node: LocationNode;
}

export interface ProviderSummaryOut {
  id: string;
  full_name: string;
  category_id: number;
  sub_category_id: number;
  location_node_id: number;
  is_mobile_provider: boolean;
  offers_delivery: boolean;
  id_card_verified: boolean;
  confirmed_tx_count: number;
  thumbs_up_count: number;
  thumbs_down_count: number;
  satisfaction_rate: number | null;
  category: Category;
  sub_category: SubCategory;
  location_node: LocationNode;
}

export interface ProviderSearchOut {
  total: number;
  page: number;
  page_size: number;
  results: ProviderSummaryOut[];
}

export interface ProviderRegisterIn {
  full_name: string;
  category_id: number;
  sub_category_id: number;
  location_node_id: number;
  is_mobile_provider?: boolean;
  offers_delivery?: boolean;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function listCategories(): Promise<Category[]> {
  return api.get<Category[]>("/providers/categories", false);
}

export async function listLocations(): Promise<LocationNode[]> {
  return api.get<LocationNode[]>("/providers/locations", false);
}

/**
 * Get the authenticated user's own provider profile.
 * Returns null if the user has not registered as a provider (404).
 */
export async function getMyProviderProfile(): Promise<ProviderOut | null> {
  try {
    return await api.get<ProviderOut>("/providers/me");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function registerProvider(payload: ProviderRegisterIn): Promise<ProviderOut> {
  return api.post<ProviderOut>("/providers/register", payload);
}

export async function updateMyProfile(payload: Partial<ProviderRegisterIn>): Promise<ProviderOut> {
  return api.patch<ProviderOut>("/providers/me", payload);
}

export async function searchProviders(params: {
  location_node_id?: number;
  category_id?: number;
  sub_category_id?: number;
  mobile_only?: boolean;
  delivery_only?: boolean;
  page?: number;
  page_size?: number;
}): Promise<ProviderSearchOut> {
  const qs = new URLSearchParams();
  if (params.location_node_id) qs.set("location_node_id", String(params.location_node_id));
  if (params.category_id)      qs.set("category_id",      String(params.category_id));
  if (params.sub_category_id)  qs.set("sub_category_id",  String(params.sub_category_id));
  if (params.mobile_only)      qs.set("mobile_only",      "true");
  if (params.delivery_only)    qs.set("delivery_only",    "true");
  qs.set("page",      String(params.page      ?? 1));
  qs.set("page_size", String(params.page_size ?? 20));
  return api.get<ProviderSearchOut>(`/providers?${qs.toString()}`);
}

export async function getProviderById(id: string): Promise<ProviderOut> {
  return api.get<ProviderOut>(`/providers/${id}`);
}
