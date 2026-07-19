/**
 * Screens 4 & 5 — PIN creation (new users) / PIN entry (returning users)
 *
 * Pixel-matched to the approved design spec, same warm palette and shared
 * NumericKeypad as phone.tsx/otp.tsx.
 *
 * Receives { phone, otpCode, isExisting } from the OTP screen.
 *
 * Flow:
 *   1. User enters a 4-digit PIN  →  step "create"
 *   2. User re-enters to confirm  →  step "confirm"
 *   3. On match → POST /auth/register  (new user)
 *      If 409 (already registered) → POST /auth/login  (existing user)
 *      If login also fails → show error, let them try again
 *
 * Special case — returning user:
 *   If register returns 409, we switch to "login" mode: the confirm step
 *   is replaced by a single "enter your existing PIN" prompt.
 *
 * Deliberately NOT built (see plan for why):
 *   - Biometric unlock: expo-local-authentication isn't used anywhere else
 *     in this codebase yet — the original spec said only add it if it's
 *     already wired in. Introducing a new native dependency + OS
 *     permission flow is a separate decision.
 *   - Personalized "Bon retour, {name}" greeting: the User model has no
 *     name field, and this screen runs before the JWT exists, so there's
 *     no profile to read one from yet.
 *   - Local PIN storage: never stored client-side, by design — the
 *     backend verifies it server-side on every login (verify_pin in
 *     auth_service.py). Only the JWT is persisted, via AsyncStorage in
 *     services/auth.ts, which is the correct place for a bearer token.
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NumericKeypad from "../../components/NumericKeypad";
import { C, F } from "../../constants/theme";
import { t } from "../../lib/i18n";
import { ApiError } from "../../services/api";
import { loginUser, registerUser } from "../../services/auth";

const PIN_LENGTH = 4;
const OTP_MAX_ATTEMPTS = 5; // must match app/services/auth_service.py OTP_MAX_ATTEMPTS
const SHAKE_MS = 800;
const TOAST_MS = 2400;

// Must match backend validation in app/schemas/auth.py
const BLOCKED_PINS = new Set([
  "1234", "0000", "1111", "2222", "3333", "4444",
  "5555", "6666", "7777", "8888", "9999", "0123", "4321",
]);

function validatePin(pin: string): string | null {
  if (pin.length !== PIN_LENGTH) return null; // not complete yet
  if (BLOCKED_PINS.has(pin)) return t("pin.error.pinTooWeak");
  return null; // valid
}

// Backend always phrases the lockout message as "...minute(s)." — parse
// the count so the UI can show a live countdown instead of a static
// sentence. Falls back to the raw message if the wording ever changes.
function extractLockoutMinutes(message: string): number | null {
  const match = /(\d+)\s*minute/.exec(message);
  return match ? parseInt(match[1], 10) : null;
}

type Step = "create" | "confirm" | "login";

export default function PinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; otpCode: string; isExisting: string }>();
  const phone = params.phone ?? "";
  const otpCode = params.otpCode ?? "";
  const isExisting = params.isExisting === "1";

  const [step, setStep] = useState<Step>(isExisting ? "login" : "create");
  const [created, setCreated] = useState("");
  const [current, setCurrent] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attemptsLeft, setAttemptsLeft] = useState(OTP_MAX_ATTEMPTS);
  const [lockSeconds, setLockSeconds] = useState(0); // 0 = not locked
  const [lockMessage, setLockMessage] = useState(""); // raw backend text, shown when minutes can't be parsed
  const [toast, setToast] = useState("");

  const shakeX = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locked = lockSeconds > 0 || !!lockMessage;
  const accent = step === "login" ? C.terra : C.brandGreen;

  // ── lockout countdown ─────────────────────────────────────────────────────
  useEffect(() => {
    if (lockSeconds <= 0) return;
    const id = setInterval(() => {
      setLockSeconds((s) => {
        if (s <= 1) {
          setAttemptsLeft(OTP_MAX_ATTEMPTS);
          setError("");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [lockSeconds > 0]);

  // ── auto-advance when 4 digits entered ───────────────────────────────────
  useEffect(() => {
    if (current.length < PIN_LENGTH || loading || locked) return;

    if (step === "create") {
      const validationError = validatePin(current);
      if (validationError) {
        triggerShake(validationError);
        return;
      }
      setCreated(current);
      setCurrent("");
      setStep("confirm");
      return;
    }

    if (step === "confirm") {
      if (current !== created) {
        triggerShake(t("pin.error.mismatch"));
        setStep("create");
        setCreated("");
        return;
      }
      submitAuth(current);
      return;
    }

    if (step === "login") {
      submitAuth(current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current]);

  function shakeAnim() {
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 5, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function triggerShake(msg: string) {
    if (Platform.OS !== "web") Vibration.vibrate(300);
    shakeAnim();
    setError(msg);
    if (clearTimer.current) clearTimeout(clearTimer.current);
    clearTimer.current = setTimeout(() => {
      setCurrent("");
      setError("");
    }, SHAKE_MS);
  }

  function flashToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), TOAST_MS);
  }

  function enterLockout(message: string) {
    const minutes = extractLockoutMinutes(message);
    setCurrent("");
    setError("");
    if (minutes !== null) {
      setLockSeconds(minutes * 60);
      setLockMessage("");
    } else {
      setLockSeconds(0);
      setLockMessage(message);
    }
  }

  async function submitAuth(pin: string) {
    setLoading(true);
    setError("");

    // ── Existing user (login step) — call loginUser directly ────────────────
    if (step === "login") {
      try {
        await loginUser(phone, otpCode, pin);
        setDone(true);
        setTimeout(() => router.replace("/"), 700);
      } catch (err) {
        setLoading(false);
        if (err instanceof ApiError && err.status === 403) {
          enterLockout(err.message);
          return;
        }
        if (err instanceof ApiError && err.status === 401) {
          const left = Math.max(0, attemptsLeft - 1);
          setAttemptsLeft(left);
          triggerShake(t("pin.error.wrongWithAttempts", { left: String(left) }));
          return;
        }
        const msg = err instanceof ApiError ? err.message : t("pin.error.generic");
        triggerShake(msg);
      }
      return;
    }

    // ── New user (confirm step) — try register ───────────────────────────────
    try {
      await registerUser(phone, otpCode, pin);
      setDone(true);
      setTimeout(() => router.replace("/"), 700);
    } catch (err) {
      setLoading(false);

      if (err instanceof ApiError && err.status === 409) {
        // Phone already registered → switch to login mode
        setStep("login");
        setCurrent("");
        setError("");
        return;
      }

      if (err instanceof ApiError && err.status === 422) {
        // PIN validation failed (backend)
        setStep("create");
        setCreated("");
        triggerShake(err.message.replace(/^pin:\s*/i, ""));
        return;
      }

      // OTP expired, network error, account issue → show inline
      const msg = err instanceof ApiError ? err.message : t("pin.error.generic");
      triggerShake(msg);
    }
  }

  function handleKey(key: string) {
    if (done || loading || locked) return;
    setCurrent((p) => (p.length < PIN_LENGTH ? p + key : p));
    setError("");
  }

  function handleBackspace() {
    if (done || loading || locked) return;
    setCurrent((p) => p.slice(0, -1));
    setError("");
  }

  function handleForgot() {
    flashToast(t("pin.forgot.toast"));
    setTimeout(() => router.replace("/(auth)/phone"), TOAST_MS);
  }

  // ── headings per step ─────────────────────────────────────────────────────
  const heading = t(
    step === "create" ? "pin.title.create" : step === "confirm" ? "pin.title.confirm" : "pin.title.login",
  );
  const subtext = t(
    step === "create"
      ? "pin.subtitle.create"
      : step === "confirm"
        ? "pin.subtitle.confirm"
        : "pin.subtitle.login",
  );

  const mm = Math.floor(lockSeconds / 60);
  const ss = String(lockSeconds % 60).padStart(2, "0");
  const countdown = `${mm}:${ss}`;

  // ── Done screen ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.doneContainer}>
          <View style={[s.doneSquare, { backgroundColor: "#1E7A52" }]}>
            <Ionicons name="checkmark" size={40} color={C.white} />
          </View>
          <Text style={s.doneTitle}>
            {step === "login" ? t("pin.done.login") : t("pin.done.created")}
          </Text>
          <ActivityIndicator color="#241C15" style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      {/* Back */}
      {step !== "confirm" && (
        <View style={s.backRow}>
          <TouchableOpacity
            style={s.back}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel={t("pin.back.a11y")}
          >
            <Ionicons name="arrow-back" size={22} color="#241C15" />
          </TouchableOpacity>
        </View>
      )}

      <View style={s.content}>
        {/* Brand chip */}
        <View style={s.brandRow}>
          <View style={[s.brandMark, { backgroundColor: accent }]}>
            <Text style={s.brandMarkLetter}>N</Text>
          </View>
          <Text style={s.brandWord}>NJANGUI</Text>
        </View>

        {/* Lock emblem */}
        <View style={[s.emblem, { backgroundColor: accent }]}>
          <Ionicons name="lock-closed-outline" size={28} color={C.white} />
        </View>

        {/* Header */}
        <Text style={s.title}>{heading}</Text>
        <Text style={s.subtitle}>{subtext}</Text>

        {/* PIN dots — masked ring style, not boxed OTP cells */}
        <Animated.View
          style={[s.dotsRow, { transform: [{ translateX: shakeX }] }]}
          accessibilityLabel={t("pin.field.a11y")}
        >
          {Array(PIN_LENGTH)
            .fill(null)
            .map((_, i) => {
              const filled = i < current.length;
              let ringColor = "#EADFCD";
              let ringBg = "#F5EEE2";
              if (!!error) {
                ringColor = "#E3B8B0";
                ringBg = "#FCF3F1";
              } else if (filled) {
                ringColor = "#C9B896";
                ringBg = C.white;
              }
              return (
                <View
                  key={i}
                  style={[s.pinRing, { borderColor: ringColor, backgroundColor: ringBg }]}
                  accessibilityLabel={t("pin.dot.a11y", {
                    n: String(i + 1),
                    state: filled ? t("pin.dot.filled") : "",
                  })}
                >
                  {filled && (
                    <View
                      style={[s.pinDot, { backgroundColor: error ? "#C0442E" : "#241C15" }]}
                    />
                  )}
                </View>
              );
            })}
        </Animated.View>

        {/* Status line */}
        <View style={s.statusArea} accessibilityLiveRegion="assertive">
          {!!error && <Text style={s.errorText}>{error}</Text>}
          {loading && <ActivityIndicator color="#241C15" style={{ marginTop: 4 }} />}
        </View>

        {/* Lockout card */}
        {locked && (
          <View style={s.lockCard} accessibilityLiveRegion="assertive">
            <Text style={s.lockTitle}>{t("pin.locked.title")}</Text>
            <Text style={s.lockBody}>
              {lockMessage || t("pin.locked.body", { countdown })}
            </Text>
            <TouchableOpacity
              style={s.lockCta}
              onPress={() => router.replace("/(auth)/phone")}
              accessibilityRole="button"
              accessibilityLabel={t("pin.locked.cta")}
            >
              <Text style={s.lockCtaText}>{t("pin.locked.cta")}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ flex: 1 }} />

        {/* Step indicator (create/confirm only) */}
        {(step === "create" || step === "confirm") && (
          <View style={s.stepRow}>
            <View style={[s.stepDot, step === "create" && { backgroundColor: accent }]} />
            <View style={[s.stepDot, step === "confirm" && { backgroundColor: accent }]} />
            <Text style={s.stepLabel}>
              {t("pin.step.label", { step: step === "create" ? "1" : "2" })}
            </Text>
          </View>
        )}

        {/* Forgot link (login mode) */}
        {step === "login" && !locked && (
          <TouchableOpacity
            style={s.forgot}
            onPress={handleForgot}
            accessibilityRole="button"
            accessibilityLabel={t("pin.forgot")}
          >
            <Text style={s.forgotText}>{t("pin.forgot")}</Text>
          </TouchableOpacity>
        )}
      </View>

      <NumericKeypad onDigit={handleKey} onBackspace={handleBackspace} disabled={loading || locked} />

      {!!toast && (
        <View style={s.toast} pointerEvents="none">
          <Text style={s.toastText}>{toast}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FBF7F1" },

  backRow: { paddingHorizontal: 20, paddingTop: 4 },
  back: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },

  content: { flex: 1, paddingHorizontal: 28, paddingTop: 6, alignItems: "center" },

  // Brand
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "flex-start", marginBottom: 8 },
  brandMark: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  brandMarkLetter: { fontFamily: F.bold, fontSize: 19, color: C.white },
  brandWord: { fontFamily: F.bold, fontSize: 17, letterSpacing: 2, color: "#241C15" },

  // Lock emblem
  emblem: {
    width: 64, height: 64, borderRadius: 20, marginTop: 14, marginBottom: 16,
    alignItems: "center", justifyContent: "center",
  },

  // Header
  title: {
    fontFamily: F.bold, fontSize: 25,
    color: "#241C15", marginBottom: 8, textAlign: "center",
  },
  subtitle: {
    fontFamily: F.regular, fontSize: 14,
    color: "#6B5D4F", textAlign: "center", lineHeight: 20, maxWidth: 290, marginBottom: 30,
  },

  // PIN dots
  dotsRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
  pinRing: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  pinDot: { width: 14, height: 14, borderRadius: 7 },

  statusArea: { minHeight: 24, marginTop: 18, alignItems: "center" },
  errorText: { fontFamily: F.semibold, fontSize: 13, color: "#C0442E", textAlign: "center" },

  // Lockout card
  lockCard: {
    marginTop: 10, backgroundColor: "#FCF3F1", borderWidth: 1, borderColor: "#E3B8B0",
    borderRadius: 14, padding: 14, maxWidth: 300,
  },
  lockTitle: { fontFamily: F.bold, fontSize: 13, color: "#C0442E", marginBottom: 4 },
  lockBody: { fontFamily: F.regular, fontSize: 12.5, lineHeight: 18, color: "#8A5A50" },
  lockCta: {
    marginTop: 10, alignSelf: "flex-start", backgroundColor: "#C0442E",
    borderRadius: 999, paddingVertical: 8, paddingHorizontal: 16,
  },
  lockCtaText: { fontFamily: F.bold, fontSize: 12.5, color: C.white },

  // Step indicator
  stepRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  stepDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#DCCFB8" },
  stepLabel: { fontFamily: F.semibold, fontSize: 12, color: "#9A8B79", marginLeft: 4 },

  // Forgot
  forgot: { marginBottom: 8, padding: 6 },
  forgotText: { fontFamily: F.bold, fontSize: 13.5, color: C.brandGreenDeep },

  // Done screen
  doneContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  doneSquare: {
    width: 80, height: 80, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
  },
  doneTitle: { fontFamily: F.bold, fontSize: 22, color: "#241C15" },

  // Toast
  toast: {
    position: "absolute", bottom: 120, alignSelf: "center",
    backgroundColor: "#241C15", paddingVertical: 11, paddingHorizontal: 18,
    borderRadius: 999,
  },
  toastText: { fontFamily: F.semibold, fontSize: 13, color: "#FBF7F1" },
});
