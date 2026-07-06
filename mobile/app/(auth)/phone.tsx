/**
 * Screen 2 — Phone number entry
 *
 * Warm pageBg, square icon mark, Cameroon (+237) prefix locked,
 * large phone field, CTA pinned above the keyboard.
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F } from "../../constants/theme";
import { checkPhoneExists, sendOtp } from "../../services/auth";

export default function PhoneScreen() {
  const router = useRouter();
  const { intent } = useLocalSearchParams<{ intent?: string }>();
  const [phone, setPhone]     = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  // `intent` is a UI hint carried from onboarding ("register" | "login") —
  // it only changes the copy below. The actual new-vs-existing branching
  // stays authoritative on the server via checkPhoneExists().
  const title = intent === "login" ? "Connectez-vous" : "Votre numéro";
  const subtitle =
    intent === "login"
      ? "Entrez votre numéro pour recevoir un code de connexion"
      : "Nous vous enverrons un code de vérification par SMS";

  const isValid = phone.replace(/\s/g, "").length >= 8;

  // format as: 6 77 00 11 22
  function handleChange(text: string) {
    const digits = text.replace(/\D/g, "").slice(0, 9);
    const parts: string[] = [];
    if (digits.length > 0) parts.push(digits.slice(0, 1));
    if (digits.length > 1) parts.push(digits.slice(1, 3));
    if (digits.length > 3) parts.push(digits.slice(3, 5));
    if (digits.length > 5) parts.push(digits.slice(5, 7));
    if (digits.length > 7) parts.push(digits.slice(7, 9));
    setPhone(parts.join(" "));
  }

  async function handleContinue() {
    if (!isValid || loading) return;
    const raw = "+237" + phone.replace(/\s/g, "");
    setLoading(true);
    try {
      // Run both in parallel — OTP request and existence check
      const [res, exists] = await Promise.all([
        sendOtp(raw),
        checkPhoneExists(raw),
      ]);
      router.push({
        pathname: "/(auth)/otp",
        params: {
          phone: raw,
          debugOtp: res.debug_otp ?? "",
          isExisting: exists ? "1" : "0",
        },
      });
    } catch (err: any) {
      Alert.alert(
        "Erreur d'envoi",
        err?.message ?? "Impossible d'envoyer le code. Réessayez.",
        [{ text: "OK" }],
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={s.kav}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {/* ── Scrollable content ── */}
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity
            style={s.back}
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={20} color={C.ink} />
          </TouchableOpacity>

          {/* Header */}
          <View style={s.header}>
            <View style={s.iconMark}>
              <Ionicons name="phone-portrait-outline" size={28} color={C.blue} />
            </View>
            <Text style={s.title}>{title}</Text>
            <Text style={s.subtitle}>{subtitle}</Text>
          </View>

          {/* Input card */}
          <View style={s.card}>
            <Text style={s.label}>Numéro de téléphone</Text>
            <View style={[s.inputRow, focused && s.inputRowFocused]}>
              {/* country prefix — keep flag as cultural content */}
              <View style={s.prefix}>
                <Text style={s.prefixFlag}>🇨🇲</Text>
                <Text style={s.prefixCode}>+237</Text>
              </View>
              <View style={s.divider} />
              <TextInput
                style={s.input}
                value={phone}
                onChangeText={handleChange}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="6 77 00 11 22"
                placeholderTextColor={C.muted}
                keyboardType="phone-pad"
                returnKeyType="done"
                maxLength={13}
                onSubmitEditing={handleContinue}
                autoFocus
              />
              {phone.length > 0 && (
                <TouchableOpacity
                  onPress={() => setPhone("")}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close-circle" size={18} color={C.muted} />
                </TouchableOpacity>
              )}
            </View>
            <Text style={s.hint}>
              Formats acceptés : Orange (+237 69…), MTN (+237 67…), Camtel (+237 62…)
            </Text>
          </View>

          {/* Info box */}
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={17} color={C.terra} />
            <Text style={s.infoText}>
              Des frais SMS standards de votre opérateur peuvent s'appliquer.
            </Text>
          </View>
        </ScrollView>

        {/* ── Bottom actions — always visible above keyboard ── */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.btn, (!isValid || loading) && s.btnDisabled]}
            activeOpacity={isValid ? 0.82 : 0.5}
            onPress={handleContinue}
          >
            {loading ? (
              <ActivityIndicator color={C.white} />
            ) : isValid ? (
              <>
                <Text style={s.btnText}>Continuer</Text>
                <Ionicons name="arrow-forward" size={18} color={C.white} />
              </>
            ) : (
              <Text style={[s.btnText, s.btnTextDisabled]}>Entrez votre numéro</Text>
            )}
          </TouchableOpacity>

          <Text style={s.terms}>
            En continuant, vous acceptez nos{" "}
            <Text style={s.termsLink}>Conditions d'utilisation</Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },
  kav: { flex: 1 },

  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },

  // Back
  back: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.cardBg,
    borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
    marginBottom: 24,
  },

  // Header
  header: { alignItems: "center", marginBottom: 28 },
  iconMark: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: C.blueFaint,
    borderWidth: 1, borderColor: "rgba(27,79,216,0.15)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontFamily: F.bold, fontSize: 26,
    color: C.navy, marginBottom: 8, textAlign: "center",
  },
  subtitle: {
    fontFamily: F.regular, fontSize: 14,
    color: C.dim, textAlign: "center", lineHeight: 21,
  },

  // Input card
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 20, padding: 18, marginBottom: 14,
    borderWidth: 1, borderColor: C.border,
  },
  label: {
    fontFamily: F.semibold, fontSize: 12,
    color: C.dim, letterSpacing: 0.6,
    textTransform: "uppercase", marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, backgroundColor: C.stoneBg,
    height: 60, paddingHorizontal: 14,
  },
  inputRowFocused: { borderColor: C.blue, backgroundColor: C.cardBg },
  prefix: {
    flexDirection: "row", alignItems: "center",
    gap: 6, paddingRight: 10,
  },
  prefixFlag: { fontSize: 22 },
  prefixCode: { fontFamily: F.bold, fontSize: 16, color: C.navy },
  divider: { width: 1, height: 28, backgroundColor: C.border, marginRight: 12 },
  input: {
    flex: 1, fontFamily: F.medium,
    fontSize: 22, color: C.ink, letterSpacing: 2,
  },
  hint: {
    fontFamily: F.regular, fontSize: 11,
    color: C.muted, marginTop: 8, lineHeight: 16,
  },

  // Info box
  infoBox: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: C.terraFaint,
    borderLeftWidth: 3, borderLeftColor: C.terra,
    borderRadius: 10, padding: 12, gap: 10,
  },
  infoText: {
    flex: 1, fontFamily: F.regular,
    fontSize: 12, color: C.dim, lineHeight: 18,
  },

  // Bottom bar — pinned above keyboard
  bottomBar: {
    paddingHorizontal: 20, paddingVertical: 16,
    backgroundColor: C.pageBg, gap: 12,
  },
  btn: {
    height: 56, backgroundColor: C.blue,
    borderRadius: 16, flexDirection: "row",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  btnDisabled: { backgroundColor: C.border },
  btnText: { fontFamily: F.bold, fontSize: 17, color: C.white },
  btnTextDisabled: { color: C.muted },

  terms: {
    fontFamily: F.regular, fontSize: 12,
    color: C.muted, textAlign: "center",
  },
  termsLink: { color: C.blue, fontFamily: F.medium },
});
