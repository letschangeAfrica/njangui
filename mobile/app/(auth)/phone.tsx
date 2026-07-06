/**
 * Screen 2 — Phone number entry
 *
 * Pixel-matched to the approved design spec: no system keyboard — a custom
 * on-screen digit pad, live carrier detection (MTN/Orange/Camtel/Nexttel),
 * debounced inline validation, and a loading state on submit.
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NumericKeypad from "../../components/NumericKeypad";
import { C, F } from "../../constants/theme";
import { t } from "../../lib/i18n";
import {
  detectCarrier,
  carrierColor,
  formatCameroonianNumber,
  isPrefixKnown,
  isValidCameroonianNumber,
} from "../../lib/phoneCarrier";
import { checkPhoneExists, sendOtp } from "../../services/auth";
import { track } from "../../services/analytics";

const NATIONAL_NUMBER_LENGTH = 9;
const PREFIX_DEBOUNCE_MS = 900;
const CARET_BLINK_MS = 530;

export default function PhoneScreen() {
  const router = useRouter();
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const isLogin = intent === "login";

  const [digits, setDigits] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [caretOn, setCaretOn] = useState(true);

  const shakeX = useRef(new Animated.Value(0)).current;
  const hintFade = useRef(new Animated.Value(0)).current;
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const carrier = detectCarrier(digits);
  const isValid = isValidCameroonianNumber(digits);
  const showValidHint = isValid && !error && !loading;

  // blinking caret
  useEffect(() => {
    const id = setInterval(() => setCaretOn((v) => !v), CARET_BLINK_MS);
    return () => clearInterval(id);
  }, []);

  // debounced "unknown prefix" validation while typing — never live per-keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (digits.length >= 3 && !isPrefixKnown(digits)) {
        setError(t("phone.error.unknownPrefix"));
      }
    }, PREFIX_DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [digits]);

  // fade in the carrier badge / valid hint when they appear
  useEffect(() => {
    if (carrier || showValidHint) {
      hintFade.setValue(0);
      Animated.timing(hintFade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    }
  }, [carrier, showValidHint, hintFade]);

  function shake() {
    shakeX.setValue(0);
    Animated.sequence([
      Animated.timing(shakeX, { toValue: -6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: -4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 4, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeX, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }

  function press(digit: string) {
    if (loading || digits.length >= NATIONAL_NUMBER_LENGTH) return;
    setDigits((d) => d + digit);
    setError("");
  }

  function backspace() {
    if (loading) return;
    setDigits((d) => d.slice(0, -1));
    setError("");
  }

  function validateNow(): boolean {
    if (digits.length === 0) {
      setError(t("phone.error.empty"));
      return false;
    }
    if (digits[0] !== "6") {
      setError(t("phone.error.mustStartWith6"));
      return false;
    }
    if (!isPrefixKnown(digits)) {
      setError(t("phone.error.unknownPrefix"));
      return false;
    }
    if (digits.length < NATIONAL_NUMBER_LENGTH) {
      setError(t("phone.error.tooShort"));
      return false;
    }
    setError("");
    return true;
  }

  async function handleSubmit() {
    if (loading) return;
    if (!validateNow()) {
      shake();
      return;
    }

    const raw = "+237" + digits;
    setLoading(true);
    track("phone_submit_attempt", { carrier: carrier ?? "unknown" });
    try {
      const [res, exists] = await Promise.all([sendOtp(raw), checkPhoneExists(raw)]);
      track("phone_submit_success", { carrier: carrier ?? "unknown" });
      router.push({
        pathname: "/(auth)/otp",
        params: {
          phone: raw,
          debugOtp: res.debug_otp ?? "",
          isExisting: exists ? "1" : "0",
        },
      });
    } catch (err: any) {
      track("phone_submit_error");
      setError(t("phone.error.sendFailed"));
      shake();
    } finally {
      setLoading(false);
    }
  }

  const fieldBorderColor = error ? "#E3B8B0" : isValid ? "#B8D9C6" : "#EADFCD";

  return (
    <SafeAreaView style={s.safe}>
      {/* Back */}
      <View style={s.backRow}>
        <TouchableOpacity
          style={s.back}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t("phone.back.a11y")}
        >
          <Ionicons name="arrow-back" size={22} color="#241C15" />
        </TouchableOpacity>
      </View>

      <View style={s.content}>
        {/* Brand chip */}
        <View style={s.brandRow}>
          <View style={s.brandMark}>
            <Text style={s.brandMarkLetter}>N</Text>
          </View>
          <Text style={s.brandWord}>NJANGUI</Text>
        </View>

        {/* Header */}
        <Text style={s.title}>{t(isLogin ? "phone.title.login" : "phone.title.register")}</Text>
        <Text style={s.subtitle}>
          {t(isLogin ? "phone.subtitle.login" : "phone.subtitle.register")}
        </Text>

        {/* Phone field */}
        <Animated.View
          style={[
            s.field,
            { borderColor: fieldBorderColor, transform: [{ translateX: shakeX }] },
          ]}
          accessible
          accessibilityLabel={t("phone.field.a11y")}
        >
          <View style={s.fieldRow}>
            <View style={s.prefixChip}>
              <Text style={s.prefixFlag}>🇨🇲</Text>
              <Text style={s.prefixCode}>+237</Text>
            </View>
            <View style={s.divider} />
            <View style={s.digitsArea}>
              {digits.length > 0 ? (
                <Text style={s.digitsText}>{formatCameroonianNumber(digits)}</Text>
              ) : (
                <Text style={s.placeholderText}>{t("phone.placeholder")}</Text>
              )}
              {digits.length < NATIONAL_NUMBER_LENGTH && !loading && (
                <View style={[s.caret, { opacity: caretOn ? 1 : 0 }]} />
              )}
            </View>
            {carrier && (
              <Animated.View style={[s.carrierBadge, { opacity: hintFade }]}>
                <View style={[s.carrierDot, { backgroundColor: carrierColor(carrier) }]} />
                <Text style={[s.carrierLabel, { color: carrierColor(carrier) }]}>{carrier}</Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* Inline validation */}
        <View style={s.validationArea} accessibilityLiveRegion="polite">
          {!!error && (
            <View style={s.errorRow}>
              <Ionicons name="alert-circle-outline" size={15} color="#C0442E" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
          {showValidHint && (
            <Animated.View style={[s.errorRow, { opacity: hintFade }]}>
              <Ionicons name="checkmark-circle" size={15} color="#1E7A52" />
              <Text style={s.validText}>{t("phone.validNumber", { carrier: carrier ?? "" })}</Text>
            </Animated.View>
          )}
        </View>

        <View style={{ flex: 1 }} />

        {/* CTA */}
        <TouchableOpacity
          style={[s.cta, (isValid || loading) && s.ctaActive]}
          activeOpacity={isValid ? 0.85 : 1}
          onPress={handleSubmit}
          accessibilityRole="button"
          accessibilityLabel={t("phone.cta")}
          accessibilityState={{ disabled: !isValid || loading }}
        >
          {loading ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <Text style={[s.ctaText, (isValid || loading) && s.ctaTextActive]}>
              {t("phone.cta")}
            </Text>
          )}
        </TouchableOpacity>

        <Text style={s.legal}>{t("phone.legal")}</Text>
      </View>

      <NumericKeypad onDigit={press} onBackspace={backspace} disabled={loading} />
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

  content: { flex: 1, paddingHorizontal: 28, paddingTop: 6 },

  // Brand
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 26 },
  brandMark: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: C.brandGreen,
    alignItems: "center", justifyContent: "center",
  },
  brandMarkLetter: { fontFamily: F.bold, fontSize: 19, color: C.white },
  brandWord: { fontFamily: F.bold, fontSize: 17, letterSpacing: 2, color: "#241C15" },

  // Header
  title: {
    fontFamily: F.bold, fontSize: 27, lineHeight: 32,
    color: "#241C15", marginBottom: 8,
  },
  subtitle: {
    fontFamily: F.regular, fontSize: 14.5, lineHeight: 21,
    color: "#6B5D4F", marginBottom: 26,
  },

  // Phone field
  field: {
    backgroundColor: C.white, borderWidth: 1.5,
    borderRadius: 16, padding: 15,
  },
  fieldRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  prefixChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "#F1E7D8", borderRadius: 11,
    paddingVertical: 9, paddingHorizontal: 11,
  },
  prefixFlag: { fontSize: 15 },
  prefixCode: { fontFamily: F.bold, fontSize: 16, color: "#3A2E22" },
  divider: { width: 1, height: 26, backgroundColor: "#EADFCD" },
  digitsArea: { flex: 1, flexDirection: "row", alignItems: "center" },
  digitsText: { fontFamily: F.bold, fontSize: 17, color: "#241C15" },
  placeholderText: { fontFamily: F.semibold, fontSize: 17, color: "#B9AC9A" },
  caret: { width: 2, height: 20, marginLeft: 4, borderRadius: 1, backgroundColor: C.brandGreen },
  carrierBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#F7F1E7", borderRadius: 999,
    paddingVertical: 4, paddingHorizontal: 8,
  },
  carrierDot: { width: 6, height: 6, borderRadius: 3 },
  carrierLabel: { fontFamily: F.bold, fontSize: 11 },

  // Validation
  validationArea: { minHeight: 22, marginTop: 10 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  errorText: { fontFamily: F.semibold, fontSize: 13, color: "#C0442E" },
  validText: { fontFamily: F.semibold, fontSize: 13, color: "#1E7A52" },

  // CTA
  cta: {
    width: "100%", height: 56, borderRadius: 16,
    backgroundColor: "#E7DBC9",
    alignItems: "center", justifyContent: "center",
  },
  ctaActive: { backgroundColor: C.brandGreen },
  ctaText: { fontFamily: F.bold, fontSize: 18, color: "#B3A896" },
  ctaTextActive: { color: C.white },

  legal: {
    fontFamily: F.regular, fontSize: 11.5, lineHeight: 16.5,
    color: "#9A8B79", textAlign: "center",
    marginTop: 14, marginBottom: 16,
  },
});
