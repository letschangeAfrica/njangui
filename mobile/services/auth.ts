/**
 * services/auth.ts
 *
 * Auth flow — wired to the real FastAPI endpoints:
 *
 *   POST /auth/otp/request   { phone_number }
 *        → { message, expires_in, debug_otp? }
 *
 *   POST /auth/register      { phone_number, otp_code, pin, language }
 *        → { access_token, user }   (new users)
 *
 *   POST /auth/login         { phone_number, otp_code, pin }
 *        → { access_token, user }   (existing users)
 *
 *   GET  /auth/me            → UserOut
 *
 *   POST /auth/pin/change    { current_pin, new_pin }
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, TOKEN_KEY } from "./api";

// ── Types ─────────────────────────────────────────────────────────────────────
export interface UserOut {
  id: string;
  phone_number: string;
  role: string;
  is_verified: boolean;
  language: string;
}

export interface TokenOut {
  access_token: string;
  token_type: string;
  user: UserOut;
}

export interface OTPRequestedOut {
  message: string;
  expires_in: number;
  debug_otp?: string | null; // Only populated in DEBUG/dev mode — shows in OTP screen
}

// ── Token helpers ─────────────────────────────────────────────────────────────
export async function saveToken(token: string) {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function clearToken() {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function isLoggedIn(): Promise<boolean> {
  const token = await getToken();
  return !!token;
}

// ── Auth actions ──────────────────────────────────────────────────────────────

/**
 * Step 1 — Request OTP
 * Returns the full response including debug_otp (non-null in dev mode).
 */
export async function sendOtp(phoneNumber: string): Promise<OTPRequestedOut> {
  return api.post<OTPRequestedOut>(
    "/auth/otp/request",
    { phone_number: phoneNumber },
    false,
  );
}

/**
 * Step 2a — Register (NEW users)
 * Combines OTP verification + account creation + PIN in one request.
 * Saves the JWT and returns the full TokenOut.
 *
 * Throws ApiError(409) if phone is already registered →
 * caller should switch to loginUser() instead.
 */
export async function registerUser(
  phoneNumber: string,
  otpCode: string,
  pin: string,
): Promise<TokenOut> {
  const data = await api.post<TokenOut>(
    "/auth/register",
    { phone_number: phoneNumber, otp_code: otpCode, pin, language: "fr" },
    false,
  );
  await saveToken(data.access_token);
  return data;
}

/**
 * Step 2b — Login (EXISTING users)
 * OTP proves phone ownership. PIN proves identity. Both required.
 * Saves the JWT and returns the full TokenOut.
 */
export async function loginUser(
  phoneNumber: string,
  otpCode: string,
  pin: string,
): Promise<TokenOut> {
  const data = await api.post<TokenOut>(
    "/auth/login",
    { phone_number: phoneNumber, otp_code: otpCode, pin },
    false,
  );
  await saveToken(data.access_token);
  return data;
}

/**
 * Fetch current authenticated user profile.
 */
export async function getMe(): Promise<UserOut> {
  return api.get<UserOut>("/auth/me");
}

/**
 * Change PIN (authenticated).
 */
export async function changePin(currentPin: string, newPin: string): Promise<void> {
  await api.post("/auth/pin/change", { current_pin: currentPin, new_pin: newPin });
}

/**
 * Check if a phone number already has an account.
 * Used before the PIN screen to route new vs existing users correctly.
 */
export async function checkPhoneExists(phoneNumber: string): Promise<boolean> {
  try {
    const res = await api.get<{ exists: boolean }>(
      `/auth/exists?phone=${encodeURIComponent(phoneNumber)}`,
      false,
    );
    return res.exists;
  } catch {
    return false; // fail open → treat as new user, register will handle the 409
  }
}

/**
 * Sign out — clears the local token.
 */
export async function logout(): Promise<void> {
  await clearToken();
}
