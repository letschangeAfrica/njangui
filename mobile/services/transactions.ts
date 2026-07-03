/**
 * services/transactions.ts
 *
 * Wired to the real FastAPI endpoints:
 *
 *   POST /transactions               initiate
 *   GET  /transactions               list mine
 *   GET  /transactions/:id           get one
 *   POST /transactions/:id/confirm   provider confirms
 *   POST /transactions/:id/rate      customer rates
 */

import { api } from "./api";

export interface RatingOut {
  id: string;
  thumbs_up: boolean;
  comment: string | null;
  created_at: string;
}

export interface TransactionOut {
  id: string;
  provider_id: string;
  customer_id: string;
  amount_xaf: number;
  description: string | null;
  status: "pending" | "confirmed" | "expired" | "disputed";
  initiated_by: string;
  initiated_at: string;
  expires_at: string;
  provider_confirmed_at: string | null;
  customer_confirmed_at: string | null;
  provider_name: string;
  customer_name: string | null;
  rating: RatingOut | null;
}

export interface TransactionListOut {
  total: number;
  page: number;
  page_size: number;
  results: TransactionOut[];
}

export async function initiateTransaction(payload: {
  provider_id: string;
  amount_xaf: number;
  description?: string;
}): Promise<TransactionOut> {
  return api.post<TransactionOut>("/transactions", payload);
}

export async function listTransactions(params: {
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<TransactionListOut> {
  const qs = new URLSearchParams();
  if (params.status) qs.set("status", params.status);
  qs.set("page",      String(params.page      ?? 1));
  qs.set("page_size", String(params.page_size ?? 20));
  return api.get<TransactionListOut>(`/transactions?${qs.toString()}`);
}

export async function getTransaction(id: string): Promise<TransactionOut> {
  return api.get<TransactionOut>(`/transactions/${id}`);
}

export async function confirmTransaction(id: string): Promise<TransactionOut> {
  return api.post<TransactionOut>(`/transactions/${id}/confirm`, {});
}

export async function rateTransaction(
  id: string,
  payload: { thumbs_up: boolean; comment?: string },
): Promise<RatingOut> {
  return api.post<RatingOut>(`/transactions/${id}/rate`, payload);
}
