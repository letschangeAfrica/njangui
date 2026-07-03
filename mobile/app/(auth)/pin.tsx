/**
 * Screens 4 & 5 — PIN creation (new users) / PIN entry (returning users)
 *
 * Receives { phone, otpCode } from the OTP screen.
 *
 * Flow:
 *   1. User enters a 4-digit PIN  →  step "create"
 *   2. User re-enters to confirm  →  step "confirm"
 *   3. On match → POST /auth/register  (new user)
 *      If 409 (already registered) → POST /auth/login  (existing user)
 *      If login also fails → show error, let them try again
 *
 * Special case — returning user:
 *   If register returns 409, we switch to "login" mode:
 *   the confirm step is replaced by a single "enter your existing PIN" prompt.
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  Vibration,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F } from "../../constants/theme";
import { ApiError } from "../../services/api";
import { loginUser, registerUser } from "../../services/auth";

const PIN_LENGTH = 4;

// Must match backend validation in app/schemas/auth.py
const BLOCKED_PINS = new Set([
  "1234","0000","1111","2222","3333","4444",
  "5555","6666","7777","8888","9999","0123","4321",
]);

function validatePin(pin: string): string | null {
  if (pin.length !== 4) return null; // not complete yet
  if (BLOCKED_PINS.has(pin)) return "Ce PIN est trop simple. Choisissez un PIN plus sécurisé.";
  return null; // valid
}

const KEYS = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  ["", "0", "⌫"],
];

type Step = "create" | "confirm" | "login";

export default function PinScreen() {
  const router = useRouter();
  const params      = useLocalSearchParams<{ phone: string; otpCode: string; isExisting: string }>();
  const phone       = params.phone   ?? "";
  const otpCode     = params.otpCode ?? "";
  const isExisting  = params.isExisting === "1";

  const [step, setStep]       = useState<Step>(isExisting ? "login" : "create");
  const [created, setCreated] = useState("");
  const [current, setCurrent] = useState("");
  const [error, setError]     = useState("");
  const [shake, setShake]     = useState(false);
  const [done, setDone]       = useState(false);
  const [loading, setLoading] = useState(false);

  // ── auto-advance when 4 digits entered ───────────────────────────────────
  useEffect(() => {
    if (current.length < PIN_LENGTH || loading) return;

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
        triggerShake("Les codes PIN ne correspondent pas. Réessayez.");
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

  function triggerShake(msg: string) {
    if (Platform.OS !== "web") Vibration.vibrate(300);
    setShake(true);
    setError(msg);
    setTimeout(() => {
      setShake(false);
      setCurrent("");
      setError("");
    }, 800);
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
      } catch (err: any) {
        setLoading(false);
        const msg = err instanceof ApiError ? err.message : "Une erreur est survenue.";
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

      const msg = err instanceof ApiError ? err.message : "Une erreur est survenue.";

      if (err instanceof ApiError && err.status === 422) {
        // PIN validation failed (backend)
        setStep("create");
        setCreated("");
        triggerShake(msg.replace(/^pin:\s*/i, ""));
        return;
      }

      // OTP expired, network error, account issue → show inline
      triggerShake(msg);
    }
  }

  function handleKey(key: string) {
    if (done || loading) return;
    if (key === "⌫") {
      setCurrent((p) => p.slice(0, -1));
      setError("");
      return;
    }
    if (!key || current.length >= PIN_LENGTH) return;
    setCurrent((p) => p + key);
  }

  // ── headings per step ─────────────────────────────────────────────────────
  const heading =
    step === "create"  ? "Créez votre code PIN" :
    step === "confirm" ? "Confirmez votre code PIN" :
                         "Entrez votre code PIN";
  const subtext =
    step === "create"  ? "Choisissez un code à 4 chiffres pour sécuriser votre compte" :
    step === "confirm" ? "Saisissez à nouveau votre code PIN pour confirmer" :
                         "Ce numéro est déjà enregistré. Entrez votre code PIN existant.";

  // ── Done screen ───────────────────────────────────────────────────────────
  if (done) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.doneContainer}>
          <View style={s.doneSquare}>
            <Ionicons name="checkmark" size={40} color={C.white} />
          </View>
          <Text style={s.doneTitle}>
            {step === "login" ? "Connexion réussie !" : "Compte créé !"}
          </Text>
          <ActivityIndicator color={C.navy} style={{ marginTop: 20 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Back — visible on create and login steps, hidden during confirm */}
        {step !== "confirm" && (
          <TouchableOpacity
            style={s.back}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={20} color={C.ink} />
          </TouchableOpacity>
        )}

        {/* Progress dots */}
        <View style={s.progress}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[s.dot, i <= 2 && s.dotActive]} />
          ))}
        </View>

        {/* Header */}
        <View style={s.header}>
          <View style={[s.iconMark, step === "login" && s.iconMarkLogin]}>
            <Ionicons
              name={step === "login" ? "key-outline" : "lock-closed-outline"}
              size={28}
              color={step === "login" ? C.terra : C.blue}
            />
          </View>
          <Text style={s.title}>{heading}</Text>
          <Text style={[s.subtitle, step === "login" && { color: C.red }]}>
            {subtext}
          </Text>
        </View>

        {/* PIN dots */}
        <View style={[s.dotsRow, shake && s.dotsShake]}>
          {Array(PIN_LENGTH).fill(null).map((_, i) => (
            <View
              key={i}
              style={[
                s.pinDot,
                i < current.length && s.pinDotFilled,
                error && s.pinDotError,
              ]}
            />
          ))}
        </View>

        {/* Error message */}
        {!!error && <Text style={s.errorText}>{error}</Text>}

        {/* Loading indicator */}
        {loading && (
          <ActivityIndicator color={C.navy} style={{ marginTop: 8 }} />
        )}

        {/* Keypad */}
        <View style={s.keypad}>
          {KEYS.map((row, ri) => (
            <View key={ri} style={s.keyRow}>
              {row.map((key, ki) => (
                <TouchableOpacity
                  key={ki}
                  style={[s.key, !key && s.keyEmpty]}
                  activeOpacity={key ? 0.7 : 1}
                  onPress={() => handleKey(key)}
                  disabled={!key || loading}
                >
                  {key === "⌫" ? (
                    <Ionicons name="backspace-outline" size={24} color={C.dim} />
                  ) : (
                    <Text style={s.keyText}>{key}</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>

        {/* Restart / escape links */}
        {step === "confirm" && (
          <TouchableOpacity
            style={s.goBack}
            onPress={() => { setStep("create"); setCurrent(""); setError(""); }}
          >
            <Ionicons name="arrow-back" size={14} color={C.blue} />
            <Text style={s.goBackText}>Recommencer</Text>
          </TouchableOpacity>
        )}
        {step === "login" && (
          <TouchableOpacity
            style={s.goBack}
            onPress={() => router.replace("/(auth)/phone")}
          >
            <Ionicons name="refresh-outline" size={14} color={C.blue} />
            <Text style={s.goBackText}>Obtenir un nouveau code</Text>
          </TouchableOpacity>
        )}

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },
  container: {
    flex: 1, paddingHorizontal: 24,
    paddingTop: 12, paddingBottom: 32,
    alignItems: "center",
  },

  // Back
  back: {
    alignSelf: "flex-start",
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.cardBg,
    borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },

  // Progress steps
  progress: { flexDirection: "row", gap: 6, marginBottom: 28, justifyContent: "center" },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.border },
  dotActive: { backgroundColor: C.terra, width: 24 },

  // Header
  header: { alignItems: "center", marginBottom: 36 },
  iconMark: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: C.blueFaint,
    borderWidth: 1, borderColor: "rgba(27,79,216,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  iconMarkLogin: {
    backgroundColor: C.terraFaint,
    borderColor: "rgba(200,120,42,0.2)",
  },
  title: {
    fontFamily: F.bold, fontSize: 24,
    color: C.navy, marginBottom: 8, textAlign: "center",
  },
  subtitle: {
    fontFamily: F.regular, fontSize: 14,
    color: C.dim, textAlign: "center", lineHeight: 20,
  },

  // PIN dots
  dotsRow: { flexDirection: "row", gap: 16, marginBottom: 8 },
  dotsShake: { transform: [{ translateX: 8 }] },
  pinDot: {
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 2, borderColor: C.border, backgroundColor: "transparent",
  },
  pinDotFilled: { backgroundColor: C.navy, borderColor: C.navy },
  pinDotError: { borderColor: C.red },

  errorText: {
    fontFamily: F.regular, fontSize: 13,
    color: C.red, marginBottom: 8, textAlign: "center",
  },

  // Keypad
  keypad: { width: "100%", maxWidth: 300, marginTop: 32, gap: 12 },
  keyRow: { flexDirection: "row", justifyContent: "space-between" },
  key: {
    width: 80, height: 72, borderRadius: 20,
    backgroundColor: C.cardBg,
    borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  keyEmpty: { backgroundColor: "transparent", borderColor: "transparent" },
  keyText: { fontFamily: F.semibold, fontSize: 26, color: C.ink },

  // Restart
  goBack: {
    marginTop: 24, flexDirection: "row",
    alignItems: "center", gap: 6,
  },
  goBackText: { fontFamily: F.medium, fontSize: 14, color: C.blue },

  // Done screen
  doneContainer: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  doneSquare: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.green,
    alignItems: "center", justifyContent: "center",
  },
  doneTitle: { fontFamily: F.bold, fontSize: 22, color: C.navy },
});
