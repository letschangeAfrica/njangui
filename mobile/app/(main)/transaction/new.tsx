/**
 * Screen 9 — Initiate a transaction
 *
 * Amount input, description, confirm button.
 * After confirmation navigates to the confirm/rate screen.
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
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
import { avatarColor, C, F } from "../../../constants/theme";

const QUICK_AMOUNTS = [5000, 10000, 25000, 50000];

export default function NewTransactionScreen() {
  const router = useRouter();
  const { providerId, providerName } = useLocalSearchParams<{
    providerId: string;
    providerName: string;
  }>();

  const [amount, setAmount]   = useState("");
  const [desc, setDesc]       = useState("");
  const [focused, setFocused] = useState<"amount" | "desc" | null>(null);

  const numAmount = parseInt(amount.replace(/\D/g, ""), 10) || 0;
  const isValid   = numAmount >= 500 && desc.trim().length >= 3;

  const avatar = avatarColor(providerName ?? "P");

  function formatAmount(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (!digits) return "";
    return parseInt(digits, 10).toLocaleString("fr-FR");
  }

  function handleAmountChange(text: string) {
    setAmount(formatAmount(text));
  }

  function handleConfirm() {
    if (!isValid) return;
    router.push({
      pathname: "/(main)/transaction/confirm",
      params: {
        providerId,
        providerName,
        amount: String(numAmount),
        description: desc.trim(),
      },
    } as any);
  }

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >

        {/* ── Top bar ── */}
        <View style={s.topBar}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.back()}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={C.ink} />
          </TouchableOpacity>
          <Text style={s.topTitle}>Nouvelle transaction</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Provider summary ── */}
          <View style={s.providerCard}>
            <View style={[s.providerAvatar, { backgroundColor: avatar.bg }]}>
              <Text style={[s.providerAvatarTxt, { color: avatar.text }]}>
                {(providerName ?? "P").charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.providerLabel}>Prestataire</Text>
              <Text style={s.providerName} numberOfLines={1}>{providerName ?? "—"}</Text>
            </View>
            <View style={s.providerBadge}>
              <Ionicons name="briefcase-outline" size={13} color={C.terra} />
            </View>
          </View>

          {/* ── Amount ── */}
          <View style={s.card}>
            <Text style={s.fieldLabel}>Montant (FCFA)</Text>
            <View style={[s.inputRow, focused === "amount" && s.inputFocused]}>
              <Text style={s.currencySign}>F</Text>
              <TextInput
                style={s.amountInput}
                value={amount}
                onChangeText={handleAmountChange}
                onFocus={() => setFocused("amount")}
                onBlur={() => setFocused(null)}
                placeholder="0"
                placeholderTextColor={C.muted}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            {/* Quick-select amounts */}
            <View style={s.quickRow}>
              {QUICK_AMOUNTS.map((a) => (
                <TouchableOpacity
                  key={a}
                  style={[s.quickBtn, numAmount === a && s.quickBtnActive]}
                  onPress={() => setAmount(a.toLocaleString("fr-FR"))}
                >
                  <Text style={[s.quickBtnTxt, numAmount === a && s.quickBtnTxtActive]}>
                    {(a / 1000).toFixed(0)}k
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {numAmount > 0 && numAmount < 500 && (
              <Text style={s.fieldError}>Montant minimum : 500 FCFA</Text>
            )}
          </View>

          {/* ── Description ── */}
          <View style={s.card}>
            <Text style={s.fieldLabel}>Description du service</Text>
            <TextInput
              style={[s.descInput, focused === "desc" && s.inputFocused]}
              value={desc}
              onChangeText={setDesc}
              onFocus={() => setFocused("desc")}
              onBlur={() => setFocused(null)}
              placeholder="Ex : Robe sur mesure taille 40, couleur bordeaux"
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              maxLength={300}
              returnKeyType="done"
            />
            <Text style={s.charCount}>{desc.length}/300</Text>
          </View>

          {/* ── Info box ── */}
          <View style={s.infoBox}>
            <Ionicons name="information-circle-outline" size={17} color={C.terra} />
            <Text style={s.infoText}>
              La transaction sera en attente jusqu'à ce que le prestataire la confirme.
              Vous pourrez ensuite laisser un avis.
            </Text>
          </View>

          {/* ── Summary ── */}
          {isValid && (
            <View style={s.summaryBox}>
              <Text style={s.summaryTitle}>Récapitulatif</Text>
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>Prestataire</Text>
                <Text style={s.summaryVal} numberOfLines={1}>{providerName}</Text>
              </View>
              <View style={s.summaryRow}>
                <Text style={s.summaryLbl}>Montant</Text>
                <Text style={[s.summaryVal, { color: C.blue }]}>
                  {numAmount.toLocaleString("fr-FR")} FCFA
                </Text>
              </View>
              <View style={[s.summaryRow, { borderBottomWidth: 0 }]}>
                <Text style={s.summaryLbl}>Service</Text>
                <Text style={[s.summaryVal, { flex: 1, textAlign: "right" }]} numberOfLines={2}>
                  {desc}
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* ── Sticky confirm button ── */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.confirmBtn, !isValid && s.confirmBtnDisabled]}
            activeOpacity={isValid ? 0.82 : 1}
            onPress={handleConfirm}
          >
            {isValid ? (
              <>
                <Text style={s.confirmTxt}>
                  Confirmer — {numAmount.toLocaleString("fr-FR")} FCFA
                </Text>
                <Ionicons name="arrow-forward" size={18} color={C.white} />
              </>
            ) : (
              <Text style={[s.confirmTxt, s.confirmTxtDisabled]}>
                Remplissez les champs
              </Text>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },

  // Top bar
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.cardBg,
    borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  topTitle: { flex: 1, fontFamily: F.bold, fontSize: 18, color: C.navy },

  scroll: { paddingHorizontal: 16, paddingBottom: 16, gap: 14 },

  // Provider card
  providerCard: {
    backgroundColor: C.cardBg, borderRadius: 18, padding: 16,
    flexDirection: "row", alignItems: "center", gap: 14,
    borderWidth: 1, borderColor: C.border,
  },
  providerAvatar: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  providerAvatarTxt: { fontFamily: F.bold, fontSize: 22 },
  providerLabel: { fontFamily: F.regular, fontSize: 11, color: C.muted, marginBottom: 3 },
  providerName: { fontFamily: F.bold, fontSize: 16, color: C.ink },
  providerBadge: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: C.terraFaint,
    alignItems: "center", justifyContent: "center",
  },

  // Card (reusable container)
  card: {
    backgroundColor: C.cardBg, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  fieldLabel: {
    fontFamily: F.semibold, fontSize: 12,
    color: C.dim, textTransform: "uppercase",
    letterSpacing: 0.5, marginBottom: 10,
  },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    borderWidth: 1.5, borderColor: C.border,
    borderRadius: 14, backgroundColor: C.stoneBg,
    paddingHorizontal: 14, height: 60,
  },
  inputFocused: { borderColor: C.blue, backgroundColor: C.cardBg },
  currencySign: { fontFamily: F.bold, fontSize: 20, color: C.muted, marginRight: 8 },
  amountInput: {
    flex: 1, fontFamily: F.bold,
    fontSize: 28, color: C.ink,
  },

  // Quick amounts
  quickRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  quickBtn: {
    flex: 1, height: 38, borderRadius: 10,
    backgroundColor: C.stoneBg,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1.5, borderColor: C.border,
  },
  quickBtnActive: { backgroundColor: C.navy, borderColor: C.navy },
  quickBtnTxt: { fontFamily: F.semibold, fontSize: 13, color: C.dim },
  quickBtnTxtActive: { color: C.white },
  fieldError: { fontFamily: F.regular, fontSize: 12, color: C.red, marginTop: 6 },

  // Description input
  descInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    backgroundColor: C.stoneBg, padding: 14,
    fontFamily: F.regular, fontSize: 14,
    color: C.ink, minHeight: 90,
  },
  charCount: {
    fontFamily: F.regular, fontSize: 11,
    color: C.muted, textAlign: "right", marginTop: 6,
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

  // Summary
  summaryBox: {
    backgroundColor: C.cardBg, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.border,
  },
  summaryTitle: { fontFamily: F.bold, fontSize: 14, color: C.ink, marginBottom: 10 },
  summaryRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  summaryLbl: { fontFamily: F.regular, fontSize: 13, color: C.muted },
  summaryVal: { fontFamily: F.semibold, fontSize: 13, color: C.ink },

  // Bottom bar
  bottomBar: { paddingHorizontal: 16, paddingVertical: 16, backgroundColor: C.pageBg },
  confirmBtn: {
    height: 56, backgroundColor: C.blue, borderRadius: 16,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  confirmBtnDisabled: { backgroundColor: C.border },
  confirmTxt: { fontFamily: F.bold, fontSize: 16, color: C.white },
  confirmTxtDisabled: { color: C.muted },
});
