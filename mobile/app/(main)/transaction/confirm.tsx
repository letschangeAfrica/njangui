/**
 * Screen 10 — Transaction confirmation
 * Screen 11 — Rate provider (thumbs up / down)
 *
 * Two-step screen:
 *   Step 1: show transaction summary → "Confirmer"
 *   Step 2: leave rating (thumbs up / down) + optional comment → "Terminer"
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F } from "../../../constants/theme";
import { initiateTransaction, rateTransaction } from "../../../services/transactions";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

export default function ConfirmTransactionScreen() {
  const router = useRouter();
  const { providerId, providerName, amount, description } =
    useLocalSearchParams<{
      providerId: string;
      providerName: string;
      amount: string;
      description: string;
    }>();

  const [step, setStep]       = useState<"confirm" | "rate" | "done">("confirm");
  const [rating, setRating]   = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [txId, setTxId]       = useState<string | null>(null);

  const numAmount = parseInt(amount ?? "0", 10);

  async function handleConfirm() {
    setLoading(true);
    try {
      const tx = await initiateTransaction({
        provider_id: providerId,
        amount_xaf: numAmount,
        description: description ?? "",
      });
      setTxId(tx.id);
      setStep("rate");
    } catch (err: any) {
      Alert.alert(
        "Erreur",
        err?.message ?? "Impossible d'initier la transaction. Réessayez.",
        [{ text: "OK" }],
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleRate() {
    if (!rating) return;
    setLoading(true);
    try {
      if (txId) {
        await rateTransaction(txId, {
          thumbs_up: rating === "up",
          comment: comment.trim() || undefined,
        });
      }
      setStep("done");
      setTimeout(() => router.replace("/"), 1800);
    } catch (err: any) {
      // Non-blocking: rating failure shouldn't block the success screen
      console.warn("rateTransaction error:", err?.message);
      setStep("done");
      setTimeout(() => router.replace("/"), 1800);
    } finally {
      setLoading(false);
    }
  }

  // ── Done screen ──────────────────────────────────────────────────────────
  if (step === "done") {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.doneScreen}>
          <View style={s.doneSquare}>
            <Ionicons name="checkmark-circle" size={48} color={C.white} />
          </View>
          <Text style={s.doneTitle}>Transaction enregistrée !</Text>
          <Text style={s.doneSub}>
            Votre avis a été soumis.{"\n"}
            La transaction sera confirmée par {providerName}.
          </Text>
          <View style={s.doneDetails}>
            <Text style={s.doneAmount}>
              {numAmount.toLocaleString("fr-FR")} FCFA
            </Text>
            <Text style={s.doneProvider}>{providerName}</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // ── Rate screen ──────────────────────────────────────────────────────────
  if (step === "rate") {
    return (
      <SafeAreaView style={s.safe}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.rateHeader}>
            <View style={s.rateIconMark}>
              <Ionicons name="star-outline" size={30} color={C.terra} />
            </View>
            <Text style={s.rateSuper}>Votre avis sur</Text>
            <Text style={s.rateName}>{providerName}</Text>
            <Text style={s.rateSub}>
              Votre avis aide la communauté à faire de meilleurs choix
            </Text>
          </View>

          {/* Thumbs */}
          <View style={s.thumbsRow}>
            <TouchableOpacity
              style={[s.thumbBtn, rating === "up" && s.thumbBtnUp]}
              onPress={() => setRating("up")}
              activeOpacity={0.8}
            >
              <View style={[s.thumbIconWrap, rating === "up" && s.thumbIconWrapUp]}>
                <Ionicons
                  name="thumbs-up"
                  size={28}
                  color={rating === "up" ? C.green : C.muted}
                />
              </View>
              <Text style={[s.thumbLbl, rating === "up" && { color: C.green }]}>
                Satisfait
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.thumbBtn, rating === "down" && s.thumbBtnDown]}
              onPress={() => setRating("down")}
              activeOpacity={0.8}
            >
              <View style={[s.thumbIconWrap, rating === "down" && s.thumbIconWrapDown]}>
                <Ionicons
                  name="thumbs-down"
                  size={28}
                  color={rating === "down" ? C.red : C.muted}
                />
              </View>
              <Text style={[s.thumbLbl, rating === "down" && { color: C.red }]}>
                Insatisfait
              </Text>
            </TouchableOpacity>
          </View>

          {/* Comment */}
          <View style={s.commentCard}>
            <Text style={s.fieldLabel}>
              Commentaire{" "}
              <Text style={{ color: C.muted, fontFamily: F.regular }}>(facultatif)</Text>
            </Text>
            <TextInput
              style={s.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Décrivez votre expérience avec ce prestataire..."
              placeholderTextColor={C.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={s.charCount}>{comment.length}/500</Text>
          </View>

          {/* Transaction recap */}
          <View style={s.recapBox}>
            <Text style={s.recapAmount}>
              {numAmount.toLocaleString("fr-FR")} FCFA
            </Text>
            <Text style={s.recapDesc} numberOfLines={2}>{description}</Text>
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[s.submitBtn, (!rating || loading) && s.submitBtnDisabled]}
            activeOpacity={rating ? 0.82 : 1}
            onPress={handleRate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={C.white} />
            ) : rating ? (
              <>
                <Text style={s.submitTxt}>Soumettre l'avis</Text>
                <Ionicons name="arrow-forward" size={18} color={C.white} />
              </>
            ) : (
              <Text style={[s.submitTxt, s.submitTxtDisabled]}>
                Sélectionnez un avis
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={s.skipBtn}
            onPress={() => router.replace("/(main)/home")}
          >
            <Text style={s.skipTxt}>Passer pour l'instant</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Confirm screen ───────────────────────────────────────────────────────
  return (
    <SafeAreaView style={s.safe}>

      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <Text style={s.topTitle}>Confirmation</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >

        {/* Big amount card */}
        <View style={s.amountCard}>
          <View style={s.amtCircle1} />
          <View style={s.amtCircle2} />
          <Text style={s.amtLabel}>Montant de la transaction</Text>
          <Text style={s.amtValue}>
            {numAmount.toLocaleString("fr-FR")} FCFA
          </Text>
          <View style={s.amtStatusBadge}>
            <Ionicons name="time-outline" size={13} color="#F5A623" />
            <Text style={s.amtStatusTxt}>En attente de confirmation</Text>
          </View>
        </View>

        {/* Details rows */}
        <View style={s.detailsCard}>
          {([
            { icon: "person-outline"  as IoniconsName, label: "Prestataire", value: providerName ?? "—" },
            { icon: "create-outline"  as IoniconsName, label: "Service",     value: description ?? "—" },
            { icon: "calendar-outline" as IoniconsName, label: "Date",        value: new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) },
          ] as { icon: IoniconsName; label: string; value: string }[]).map((row, i) => (
            <View key={i} style={[s.detailRow, i > 0 && s.detailRowBorder]}>
              <View style={s.detailIconWrap}>
                <Ionicons name={row.icon} size={16} color={C.dim} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.detailLbl}>{row.label}</Text>
                <Text style={s.detailVal} numberOfLines={2}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Warning */}
        <View style={s.warnBox}>
          <Ionicons name="warning-outline" size={17} color={C.terra} />
          <Text style={s.warnText}>
            Confirmez uniquement si vous avez réellement effectué cette transaction.
            Les fausses déclarations peuvent entraîner une suspension de votre compte.
          </Text>
        </View>

        <TouchableOpacity
          style={[s.confirmBtn, loading && { opacity: 0.7 }]}
          activeOpacity={0.82}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={C.white} />
          ) : (
            <>
              <Text style={s.confirmTxt}>Confirmer la transaction</Text>
              <Ionicons name="arrow-forward" size={18} color={C.white} />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={s.cancelBtn}
          onPress={() => router.back()}
          disabled={loading}
        >
          <Text style={s.cancelTxt}>Annuler</Text>
        </TouchableOpacity>

      </ScrollView>
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

  scroll: { paddingHorizontal: 16, paddingBottom: 32, gap: 14 },

  // Amount card — navy hero
  amountCard: {
    backgroundColor: C.navy, borderRadius: 24, padding: 28,
    alignItems: "center", overflow: "hidden",
  },
  amtCircle1: {
    position: "absolute", top: -30, right: -20,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  amtCircle2: {
    position: "absolute", bottom: -20, left: -20,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(200,120,42,0.15)",
  },
  amtLabel: {
    fontFamily: F.regular, fontSize: 13,
    color: "rgba(255,255,255,0.65)", marginBottom: 8,
  },
  amtValue: {
    fontFamily: F.bold, fontSize: 36,
    color: C.white, marginBottom: 14,
  },
  amtStatusBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(245,166,35,0.2)", borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6,
  },
  amtStatusTxt: {
    fontFamily: F.medium, fontSize: 12, color: "#F5A623",
  },

  // Details
  detailsCard: {
    backgroundColor: C.cardBg, borderRadius: 20,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  detailRowBorder: { borderTopWidth: 1, borderTopColor: C.divider },
  detailIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: C.stoneBg,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  detailLbl: { fontFamily: F.regular, fontSize: 11, color: C.muted, marginBottom: 2 },
  detailVal: { fontFamily: F.semibold, fontSize: 14, color: C.ink },

  // Warning
  warnBox: {
    flexDirection: "row", alignItems: "flex-start",
    backgroundColor: C.terraFaint,
    borderLeftWidth: 3, borderLeftColor: C.terra,
    borderRadius: 10, padding: 12, gap: 10,
  },
  warnText: {
    flex: 1, fontFamily: F.regular,
    fontSize: 12, color: C.dim, lineHeight: 18,
  },

  // Confirm button
  confirmBtn: {
    height: 56, backgroundColor: C.blue, borderRadius: 16,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
  },
  confirmTxt: { fontFamily: F.bold, fontSize: 16, color: C.white },

  // Cancel
  cancelBtn: {
    height: 48, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  cancelTxt: { fontFamily: F.medium, fontSize: 15, color: C.dim },

  // ── Rate step ────────────────────────────────────────────────────────────
  rateHeader: { alignItems: "center", paddingTop: 20, marginBottom: 24 },
  rateIconMark: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: C.terraFaint,
    borderWidth: 1, borderColor: "rgba(200,120,42,0.2)",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  rateSuper: { fontFamily: F.regular, fontSize: 14, color: C.muted, marginBottom: 4 },
  rateName: { fontFamily: F.bold, fontSize: 22, color: C.navy, marginBottom: 8 },
  rateSub: {
    fontFamily: F.regular, fontSize: 13, color: C.dim,
    textAlign: "center", lineHeight: 20,
    paddingHorizontal: 24,
  },

  thumbsRow: { flexDirection: "row", gap: 14, marginBottom: 14 },
  thumbBtn: {
    flex: 1, backgroundColor: C.cardBg,
    borderRadius: 20, padding: 20,
    alignItems: "center", gap: 12,
    borderWidth: 1.5, borderColor: C.border,
  },
  thumbBtnUp: { borderColor: C.green, backgroundColor: C.greenFaint },
  thumbBtnDown: { borderColor: C.red, backgroundColor: C.redFaint },
  thumbIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: C.stoneBg,
    alignItems: "center", justifyContent: "center",
  },
  thumbIconWrapUp: { backgroundColor: C.greenFaint },
  thumbIconWrapDown: { backgroundColor: C.redFaint },
  thumbLbl: { fontFamily: F.semibold, fontSize: 14, color: C.dim },

  commentCard: {
    backgroundColor: C.cardBg, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 14,
  },
  fieldLabel: {
    fontFamily: F.semibold, fontSize: 12, color: C.dim,
    textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10,
  },
  commentInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    backgroundColor: C.stoneBg, padding: 14,
    fontFamily: F.regular, fontSize: 14,
    color: C.ink, minHeight: 100,
  },
  charCount: {
    fontFamily: F.regular, fontSize: 11,
    color: C.muted, textAlign: "right", marginTop: 6,
  },

  recapBox: {
    backgroundColor: C.blueFaint, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(27,79,216,0.12)",
    padding: 14, alignItems: "center", marginBottom: 14,
  },
  recapAmount: { fontFamily: F.bold, fontSize: 20, color: C.blue, marginBottom: 4 },
  recapDesc: {
    fontFamily: F.regular, fontSize: 13,
    color: C.dim, textAlign: "center",
  },

  submitBtn: {
    height: 56, backgroundColor: C.blue, borderRadius: 16,
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8, marginBottom: 10,
  },
  submitBtnDisabled: { backgroundColor: C.border },
  submitTxt: { fontFamily: F.bold, fontSize: 16, color: C.white },
  submitTxtDisabled: { color: C.muted },

  skipBtn: { alignItems: "center", paddingVertical: 12 },
  skipTxt: { fontFamily: F.medium, fontSize: 14, color: C.muted },

  // ── Done screen ──────────────────────────────────────────────────────────
  doneScreen: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: 32, gap: 12,
  },
  doneSquare: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: C.green,
    alignItems: "center", justifyContent: "center", marginBottom: 8,
  },
  doneTitle: { fontFamily: F.bold, fontSize: 24, color: C.green, textAlign: "center" },
  doneSub: {
    fontFamily: F.regular, fontSize: 14,
    color: C.dim, textAlign: "center", lineHeight: 22,
  },
  doneDetails: {
    backgroundColor: C.cardBg, borderRadius: 20, padding: 20,
    alignItems: "center", marginTop: 8, width: "100%",
    borderWidth: 1, borderColor: C.border,
  },
  doneAmount: { fontFamily: F.bold, fontSize: 28, color: C.navy, marginBottom: 4 },
  doneProvider: { fontFamily: F.medium, fontSize: 14, color: C.muted },
});
