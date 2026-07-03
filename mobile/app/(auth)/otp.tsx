/**
 * Screen 3 — OTP Verification
 *
 * 6-box code input, countdown timer, resend link, next button.
 * Does NOT call the backend here — OTP is verified as part of
 * /auth/register or /auth/login on the PIN screen.
 *
 * In dev mode the backend returns the OTP in the response (debug_otp);
 * we show it in an amber banner so you don't have to check the terminal.
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F } from "../../constants/theme";
import { sendOtp } from "../../services/auth";

const OTP_LENGTH = 6;
const RESEND_SEC = 60;

function maskPhone(phone: string): string {
  if (!phone || phone.length < 6) return phone;
  const digits = phone.replace(/\D/g, "");
  const last4 = digits.slice(-4);
  return `+237 *** *** ${last4.slice(0, 2)} ${last4.slice(2)}`;
}

export default function OtpScreen() {
  const router   = useRouter();
  const params      = useLocalSearchParams<{ phone: string; debugOtp: string; isExisting: string }>();
  const phone       = params.phone ?? "";
  const debugOtp    = params.debugOtp ?? "";
  const isExisting  = params.isExisting === "1";

  const [code, setCode]       = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [seconds, setSeconds] = useState(RESEND_SEC);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // countdown timer
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [seconds]);

  const isComplete = code.filter(Boolean).length === OTP_LENGTH;

  function handleDigit(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(index: number, key: string) {
    if (key === "Backspace" && !code[index] && index > 0) {
      const next = [...code];
      next[index - 1] = "";
      setCode(next);
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleResend() {
    setSeconds(RESEND_SEC);
    setCode(Array(OTP_LENGTH).fill(""));
    inputRefs.current[0]?.focus();
    try { await sendOtp(phone); } catch { /* ignore */ }
  }

  // No API call here — pass phone + otpCode to PIN screen.
  const handleNext = useCallback(() => {
    if (!isComplete) return;
    router.push({
      pathname: "/(auth)/pin",
      params: { phone, otpCode: code.join(""), isExisting: isExisting ? "1" : "0" },
    } as any);
  }, [isComplete, code, phone, router]);

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.container}>

        {/* Back */}
        <TouchableOpacity
          style={s.back}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={20} color={C.ink} />
        </TouchableOpacity>

        {/* Progress dots */}
        <View style={s.progress}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[s.dot, i <= 1 && s.dotActive]} />
          ))}
        </View>

        {/* Header */}
        <View style={s.header}>
          <View style={s.iconMark}>
            <Ionicons name="chatbubble-ellipses-outline" size={28} color={C.blue} />
          </View>
          <Text style={s.title}>Code de vérification</Text>
          <Text style={s.subtitle}>
            Code envoyé au{"\n"}
            <Text style={s.phoneHighlight}>{maskPhone(phone)}</Text>
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={s.changeNumber}>Changer le numéro</Text>
          </TouchableOpacity>
        </View>

        {/* Dev banner — visible only when backend returns debug_otp */}
        {!!debugOtp && (
          <View style={s.devBanner}>
            <View style={s.devBannerRow}>
              <Ionicons name="construct-outline" size={14} color="#92400E" />
              <Text style={s.devBannerLabel}>Mode dev — votre code :</Text>
            </View>
            <Text style={s.devBannerCode}>{debugOtp}</Text>
          </View>
        )}

        {/* OTP boxes */}
        <View style={s.boxRow}>
          {code.map((digit, i) => (
            <TextInput
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              style={[s.box, digit ? s.boxFilled : null]}
              value={digit}
              onChangeText={(v) => handleDigit(i, v)}
              onKeyPress={({ nativeEvent: { key } }) => handleKeyPress(i, key)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              caretHidden
            />
          ))}
        </View>

        {/* Fill indicator */}
        <View style={s.fillBar}>
          {code.map((d, i) => (
            <View key={i} style={[s.fillBarItem, d && s.fillBarItemFilled]} />
          ))}
        </View>

        {/* Resend */}
        <View style={s.resendRow}>
          {seconds > 0 ? (
            <Text style={s.resendTimer}>
              Renvoyer dans{" "}
              <Text style={s.resendTimerBold}>
                0:{String(seconds).padStart(2, "0")}
              </Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend}>
              <Text style={s.resendLink}>Renvoyer le code</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Next button */}
        <TouchableOpacity
          style={[s.btn, !isComplete && s.btnDisabled]}
          activeOpacity={isComplete ? 0.82 : 1}
          onPress={handleNext}
        >
          {isComplete ? (
            <>
              <Text style={s.btnText}>Suivant</Text>
              <Ionicons name="arrow-forward" size={18} color={C.white} />
            </>
          ) : (
            <Text style={[s.btnText, s.btnTextDisabled]}>Entrez le code</Text>
          )}
        </TouchableOpacity>

        <Text style={s.help}>
          Vous n'avez pas reçu le code ? Vérifiez que votre numéro est correct
          ou contactez le support.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },

  back: {
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
  header: { alignItems: "center", marginBottom: 24 },
  iconMark: {
    width: 72, height: 72, borderRadius: 20,
    backgroundColor: C.blueFaint,
    borderWidth: 1, borderColor: "rgba(27,79,216,0.15)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  title: { fontFamily: F.bold, fontSize: 26, color: C.navy, marginBottom: 10 },
  subtitle: {
    fontFamily: F.regular, fontSize: 15,
    color: C.dim, textAlign: "center", lineHeight: 22, marginBottom: 8,
  },
  phoneHighlight: { fontFamily: F.semibold, color: C.ink, fontSize: 16 },
  changeNumber: { fontFamily: F.medium, fontSize: 13, color: C.blue, marginTop: 4 },

  // Dev banner
  devBanner: {
    backgroundColor: "#FFFBEB",
    borderWidth: 1, borderColor: "#FCD34D",
    borderRadius: 12, padding: 12, marginBottom: 16,
    alignItems: "center", gap: 6,
  },
  devBannerRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  devBannerLabel: { fontFamily: F.regular, fontSize: 12, color: "#92400E" },
  devBannerCode: {
    fontFamily: F.bold, fontSize: 28,
    color: "#92400E", letterSpacing: 8,
  },

  // OTP boxes
  boxRow: { flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 16 },
  box: {
    width: 48, height: 58,
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, backgroundColor: C.cardBg,
    textAlign: "center",
    fontFamily: F.bold, fontSize: 24, color: C.ink,
  },
  boxFilled: { borderColor: C.terra, backgroundColor: C.terraFaint },

  // Fill indicator
  fillBar: { flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 20 },
  fillBarItem: { width: 8, height: 4, borderRadius: 2, backgroundColor: C.border },
  fillBarItemFilled: { backgroundColor: C.terra, width: 16 },

  // Resend
  resendRow: { alignItems: "center", marginBottom: 32, minHeight: 24 },
  resendTimer: { fontFamily: F.regular, fontSize: 14, color: C.muted },
  resendTimerBold: { fontFamily: F.bold, color: C.terra },
  resendLink: { fontFamily: F.semibold, fontSize: 15, color: C.blue },

  // Button
  btn: {
    height: 56, backgroundColor: C.blue,
    borderRadius: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center",
    gap: 8, marginBottom: 20,
  },
  btnDisabled: { backgroundColor: C.border },
  btnText: { fontFamily: F.bold, fontSize: 17, color: C.white },
  btnTextDisabled: { color: C.muted },

  help: {
    fontFamily: F.regular, fontSize: 12,
    color: C.muted, textAlign: "center", lineHeight: 18,
  },
});
