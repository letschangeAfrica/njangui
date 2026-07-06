/**
 * Screen 3 — OTP Verification
 *
 * Pixel-matched to the approved design spec: 6 auto-managed cells filled by
 * the shared custom keypad, auto-submit on the 6th digit (no "Next" button),
 * a brief verifying → success transition, then navigation to the PIN screen.
 *
 * There is NO standalone OTP-verify endpoint (see app/services/auth_service.py)
 * — the 6-digit code is verified TOGETHER with the 4-digit PIN in a single
 * call on the next screen (/auth/register or /auth/login). So this screen
 * only checks the code is 6 digits long, then carries it forward as
 * `otpCode`. A wrong/expired code surfaces as an inline error on pin.tsx.
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import NumericKeypad from "../../components/NumericKeypad";
import { C, F } from "../../constants/theme";
import { t } from "../../lib/i18n";
import { formatCameroonianNumber } from "../../lib/phoneCarrier";
import { sendOtp } from "../../services/auth";
import { track } from "../../services/analytics";

const CODE_LENGTH = 6;
const RESEND_SEC = 60;
const CARET_BLINK_MS = 530;
const VERIFYING_MS = 600;
const SUCCESS_PAUSE_MS = 450;
const TOAST_MS = 2400;

type Phase = "idle" | "verifying" | "success";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone: string; debugOtp: string; isExisting: string }>();
  const phone = params.phone ?? "";
  const isNewUser = params.isExisting !== "1";

  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(""));
  const [phase, setPhase] = useState<Phase>("idle");
  const [resendLeft, setResendLeft] = useState(RESEND_SEC);
  const [caretOn, setCaretOn] = useState(true);
  const [toast, setToast] = useState("");
  const [debugOtp, setDebugOtp] = useState(params.debugOtp ?? "");

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // resend countdown
  useEffect(() => {
    if (resendLeft <= 0) return;
    const id = setInterval(() => setResendLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [resendLeft]);

  // blinking caret
  useEffect(() => {
    const id = setInterval(() => setCaretOn((v) => !v), CARET_BLINK_MS);
    return () => clearInterval(id);
  }, []);

  function firstEmpty(c: string[]): number {
    const i = c.findIndex((d) => d === "");
    return i === -1 ? CODE_LENGTH : i;
  }

  function press(digit: string) {
    if (phase === "verifying" || phase === "success") return;
    const next = [...code];
    const i = firstEmpty(next);
    if (i >= CODE_LENGTH) return;
    next[i] = digit;
    setCode(next);
    if (firstEmpty(next) >= CODE_LENGTH) {
      autoSubmit(next);
    }
  }

  function backspace() {
    if (phase === "verifying" || phase === "success") return;
    const next = [...code];
    let i = firstEmpty(next) - 1;
    if (i < 0) i = CODE_LENGTH - 1;
    next[i] = "";
    setCode(next);
  }

  async function autoSubmit(finalCode: string[]) {
    setPhase("verifying");
    track("otp_auto_submit");
    await delay(VERIFYING_MS);
    setPhase("success");
    await delay(SUCCESS_PAUSE_MS);
    router.push({
      pathname: "/(auth)/pin",
      params: { phone, otpCode: finalCode.join(""), isExisting: params.isExisting ?? "0" },
    });
  }

  function flashToast(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(""), TOAST_MS);
  }

  async function handleResend() {
    if (resendLeft > 0) return;
    try {
      const res = await sendOtp(phone);
      setDebugOtp(res.debug_otp ?? "");
      setResendLeft(RESEND_SEC);
      setCode(Array(CODE_LENGTH).fill(""));
      setPhase("idle");
      track("otp_resend");
      flashToast(t("otp.resendToast"));
    } catch {
      track("otp_resend_error");
      flashToast(t("otp.sendFailed"));
    }
  }

  const activeIdx = firstEmpty(code);
  const routeLabel = t(isNewUser ? "otp.route.create" : "otp.route.enter");
  const countdown = `0:${String(resendLeft).padStart(2, "0")}`;
  const nationalDigits = phone.replace("+237", "");

  return (
    <SafeAreaView style={s.safe}>
      {/* Back */}
      <View style={s.backRow}>
        <TouchableOpacity
          style={s.back}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel={t("otp.back.a11y")}
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
        <Text style={s.title}>{t("otp.title")}</Text>
        <Text style={s.subtitle}>{t("otp.subtitle")}</Text>
        <View style={s.phoneRow}>
          <Text style={s.phoneText}>+237 {formatCameroonianNumber(nationalDigits)}</Text>
          <TouchableOpacity
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t("otp.change")}
          >
            <Text style={s.changeLink}>{t("otp.change")}</Text>
          </TouchableOpacity>
        </View>

        {/* OTP cells */}
        <View style={s.cellsRow} accessibilityLabel={t("otp.field.a11y")}>
          {code.map((digit, i) => {
            const isActive = i === activeIdx && phase === "idle";
            const isFilled = digit !== "";
            let borderColor = "#EADFCD";
            let bg = C.white;
            if (phase === "success") { borderColor = "#B8D9C6"; bg = "#F1F8F4"; }
            else if (isActive) borderColor = C.brandGreen;
            else if (isFilled) borderColor = "#D8C7AC";

            return (
              <View
                key={i}
                style={[s.cell, { borderColor, backgroundColor: bg }]}
                accessibilityLabel={t("otp.cell.a11y", {
                  n: String(i + 1),
                  state: isFilled ? t("otp.cell.filled") : t("otp.cell.empty"),
                })}
              >
                {isFilled ? (
                  <Text style={s.cellDigit}>{digit}</Text>
                ) : isActive ? (
                  <View style={[s.caret, { opacity: caretOn ? 1 : 0 }]} />
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Status line */}
        <View style={s.statusArea} accessibilityLiveRegion="polite">
          {phase === "verifying" && (
            <View style={s.statusRow}>
              <ActivityIndicator size="small" color="#241C15" />
              <Text style={s.statusVerifying}>{t("otp.verifying")}</Text>
            </View>
          )}
          {phase === "success" && (
            <View style={s.statusRow}>
              <Ionicons name="checkmark-circle" size={16} color="#1E7A52" />
              <Text style={s.statusSuccess}>{t("otp.success", { route: routeLabel })}</Text>
            </View>
          )}
        </View>

        <View style={{ flex: 1 }} />

        {/* Resend */}
        <View style={s.resendRow}>
          <Text style={s.resendPrompt}>{t("otp.notReceived")}</Text>
          {resendLeft <= 0 ? (
            <TouchableOpacity
              onPress={handleResend}
              accessibilityRole="button"
              accessibilityLabel={t("otp.resend")}
            >
              <Text style={s.resendLink}>{t("otp.resend")}</Text>
            </TouchableOpacity>
          ) : (
            <Text style={s.resendWaiting}>{t("otp.resendIn", { countdown })}</Text>
          )}
        </View>

        {/* Dev hint — only in local development, never in a release build */}
        {!!debugOtp && __DEV__ && (
          <Text style={s.devHint}>{t("otp.devHint", { code: debugOtp })}</Text>
        )}
      </View>

      <NumericKeypad onDigit={press} onBackspace={backspace} disabled={phase !== "idle"} />

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

  content: { flex: 1, paddingHorizontal: 28, paddingTop: 6 },

  // Brand
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 22 },
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
    color: "#241C15", marginBottom: 10,
  },
  subtitle: {
    fontFamily: F.regular, fontSize: 14.5, lineHeight: 21,
    color: "#6B5D4F", marginBottom: 6,
  },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 26 },
  phoneText: { fontFamily: F.bold, fontSize: 15, color: "#241C15" },
  changeLink: { fontFamily: F.bold, fontSize: 12.5, color: C.brandGreenDeep },

  // OTP cells
  cellsRow: { flexDirection: "row", gap: 9, justifyContent: "space-between" },
  cell: {
    width: 46, height: 58, borderWidth: 1.5, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  cellDigit: { fontFamily: F.bold, fontSize: 26, color: "#241C15" },
  caret: { width: 2, height: 26, borderRadius: 1, backgroundColor: C.brandGreen },

  // Status
  statusArea: { minHeight: 24, marginTop: 16, alignItems: "center" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusVerifying: { fontFamily: F.semibold, fontSize: 13, color: "#6B5D4F" },
  statusSuccess: { fontFamily: F.bold, fontSize: 13, color: "#1E7A52" },

  // Resend
  resendRow: {
    flexDirection: "row", justifyContent: "center", alignItems: "center",
    gap: 6, marginBottom: 8,
  },
  resendPrompt: { fontFamily: F.regular, fontSize: 13.5, color: "#6B5D4F" },
  resendLink: { fontFamily: F.bold, fontSize: 13.5, color: C.brandGreenDeep },
  resendWaiting: { fontFamily: F.bold, fontSize: 13.5, color: "#B3A896" },

  devHint: {
    fontFamily: F.regular, fontSize: 11, textAlign: "center",
    color: "#C3B7A4", marginBottom: 14,
  },

  toast: {
    position: "absolute", bottom: 120, alignSelf: "center",
    backgroundColor: "#241C15", paddingVertical: 11, paddingHorizontal: 18,
    borderRadius: 999,
  },
  toastText: { fontFamily: F.semibold, fontSize: 13, color: "#FBF7F1" },
});
