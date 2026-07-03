/**
 * Screen 8 — Provider Profile detail
 *
 * Loads provider from GET /providers/:id
 */

import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { avatarColor, C, F, rateColor } from "../../../constants/theme";
import { getProviderById, ProviderOut } from "../../../services/providers";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// ── Info row ──────────────────────────────────────────────────────────────────

function InfoRow({
  icon,
  label,
  value,
  last,
}: {
  icon: IoniconsName;
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View style={[ir.root, !last && ir.border]}>
      <View style={ir.iconWrap}>
        <Ionicons name={icon} size={16} color={C.dim} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={ir.label}>{label}</Text>
        <Text style={ir.value}>{value}</Text>
      </View>
    </View>
  );
}

const ir = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  border: { borderBottomWidth: 1, borderBottomColor: C.divider },
  iconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: C.stoneBg, alignItems: "center", justifyContent: "center",
  },
  label: { fontFamily: F.regular, fontSize: 11, color: C.muted, marginBottom: 2 },
  value: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
});

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ProviderScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [provider, setProvider] = useState<ProviderOut | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);

  function load() {
    if (!id) return;
    setLoading(true); setError(null);
    getProviderById(id)
      .then(setProvider)
      .catch((err: any) => setError(err?.message ?? "Impossible de charger le profil."))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [id]);

  // ── Loading ──
  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.ink} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.navy} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──
  if (error || !provider) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={C.ink} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 }}>
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: C.redFaint, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="alert-circle-outline" size={30} color={C.red} />
          </View>
          <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink, textAlign: "center" }}>
            {error ?? "Prestataire introuvable"}
          </Text>
          <TouchableOpacity
            style={{ backgroundColor: C.blue, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10 }}
            onPress={load}
          >
            <Text style={{ fontFamily: F.semibold, fontSize: 14, color: C.white }}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Derived ──
  const rate      = provider.satisfaction_rate ?? 0;
  const colors    = avatarColor(provider.full_name);
  const totalReviews = provider.thumbs_up_count + provider.thumbs_down_count;

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Top bar ── */}
      <View style={s.topBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={C.ink} />
        </TouchableOpacity>
        <Text style={s.topTitle} numberOfLines={1}>{provider.full_name}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 110 }}>

        {/* ── Hero block ── */}
        <View style={s.hero}>
          {/* decorative accent */}
          <View style={s.heroAccent} />

          <View style={s.heroTop}>
            {/* Avatar */}
            <View style={[s.heroAvatar, { backgroundColor: colors.bg }]}>
              <Text style={[s.heroAvatarText, { color: colors.text }]}>
                {provider.full_name.charAt(0).toUpperCase()}
              </Text>
            </View>

            {/* Identity */}
            <View style={{ flex: 1 }}>
              <Text style={s.heroName}>{provider.full_name}</Text>
              <Text style={s.heroCat}>{provider.category.name_fr}</Text>
              <View style={s.heroLocationRow}>
                <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.5)" />
                <Text style={s.heroLocation}> {provider.location_node.display_name_fr}</Text>
              </View>
            </View>

            {/* Badges */}
            <View style={{ gap: 6 }}>
              {provider.id_card_verified && (
                <View style={s.verifiedBadge}>
                  <Ionicons name="shield-checkmark" size={12} color="#4ADE80" />
                  <Text style={s.verifiedText}>Vérifié</Text>
                </View>
              )}
              {provider.is_mobile_provider && (
                <View style={s.mobileBadge}>
                  <Ionicons name="car-outline" size={12} color={C.terra} />
                  <Text style={s.mobileBadgeText}>Mobile</Text>
                </View>
              )}
            </View>
          </View>

          {/* Stats */}
          <View style={s.statsRow}>
            {[
              { val: `${rate.toFixed(0)}%`, lbl: "Satisfaction", hi: rateColor(rate) },
              { val: `${provider.confirmed_tx_count}`,   lbl: "Transactions",  hi: C.white },
              { val: `${provider.thumbs_up_count}`,   lbl: "Positifs",  hi: "#4ADE80" },
              { val: `${provider.thumbs_down_count}`, lbl: "Négatifs", hi: "#F87171" },
            ].map((st, i) => (
              <View key={i} style={s.statBlock}>
                <Text style={[s.statVal, { color: st.hi }]}>{st.val}</Text>
                <Text style={s.statLbl}>{st.lbl}</Text>
                {i < 3 && <View style={s.statSep} />}
              </View>
            ))}
          </View>

          {/* Bar */}
          <View style={s.barTrack}>
            <View style={[s.barFill, {
              width: `${Math.min(rate, 100)}%` as any,
              backgroundColor: rateColor(rate),
            }]} />
          </View>
        </View>

        {/* ── Info section ── */}
        <Text style={s.sectionLabel}>INFORMATIONS</Text>
        <View style={s.card}>
          <InfoRow icon="folder-outline"       label="Catégorie"  value={provider.category.name_fr} />
          <InfoRow icon="construct-outline"    label="Spécialité" value={provider.sub_category.name_fr} />
          <InfoRow icon="location-outline"     label="Zone"       value={provider.location_node.display_name_fr} />
          <InfoRow icon="car-outline"          label="Se déplace" value={provider.is_mobile_provider ? "Oui — vient chez vous" : "Non"} />
          <InfoRow icon="cube-outline"         label="Livraison"  value={provider.offers_delivery ? "Oui" : "Non"} last />
        </View>

        {/* ── Reviews section ── */}
        <Text style={s.sectionLabel}>AVIS ({totalReviews})</Text>

        {totalReviews === 0 ? (
          <View style={s.emptyReviews}>
            <View style={s.emptyReviewsIcon}>
              <Ionicons name="chatbubble-outline" size={24} color={C.muted} />
            </View>
            <Text style={s.emptyReviewsTitle}>Aucun avis pour l'instant</Text>
            <Text style={s.emptyReviewsSub}>
              Initiez une transaction pour laisser le premier avis
            </Text>
          </View>
        ) : (
          <View style={s.card}>
            <View style={s.reviewSummaryRow}>
              <View style={s.reviewSumItem}>
                <Ionicons name="thumbs-up-outline" size={20} color={C.green} />
                <Text style={[s.reviewSumVal, { color: C.green }]}>{provider.thumbs_up_count}</Text>
                <Text style={s.reviewSumLbl}>avis positifs</Text>
              </View>
              <View style={{ width: 1, height: 40, backgroundColor: C.divider }} />
              <View style={s.reviewSumItem}>
                <Ionicons name="thumbs-down-outline" size={20} color={C.red} />
                <Text style={[s.reviewSumVal, { color: C.red }]}>{provider.thumbs_down_count}</Text>
                <Text style={s.reviewSumLbl}>avis négatifs</Text>
              </View>
              <View style={{ width: 1, height: 40, backgroundColor: C.divider }} />
              <View style={s.reviewSumItem}>
                <Text style={[s.reviewSumVal, { color: rateColor(rate) }]}>{rate.toFixed(0)}%</Text>
                <Text style={s.reviewSumLbl}>satisfaction</Text>
              </View>
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── Sticky CTA ── */}
      <View style={s.stickyBar}>
        <View>
          <Text style={s.stickyRate}>{rate.toFixed(0)}% satisfaction</Text>
          <Text style={s.stickyTx}>
            {provider.confirmed_tx_count} transaction{provider.confirmed_tx_count !== 1 ? "s" : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={s.ctaBtn}
          activeOpacity={0.82}
          onPress={() =>
            router.push({
              pathname: "/(main)/transaction/new",
              params: { providerId: provider.id, providerName: provider.full_name },
            } as any)
          }
        >
          <Text style={s.ctaText}>Initier une transaction</Text>
          <Ionicons name="arrow-forward" size={16} color={C.white} />
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },

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
  topTitle: {
    flex: 1, fontFamily: F.bold, fontSize: 16, color: C.navy,
  },

  // Hero
  hero: {
    backgroundColor: C.navy,
    borderRadius: 20, margin: 16,
    padding: 20, overflow: "hidden",
  },
  heroAccent: {
    position: "absolute", bottom: -30, right: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(200,120,42,0.18)",
  },
  heroTop: {
    flexDirection: "row", alignItems: "flex-start",
    gap: 12, marginBottom: 20,
  },
  heroAvatar: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  heroAvatarText: { fontFamily: F.bold, fontSize: 22 },
  heroName: { fontFamily: F.bold, fontSize: 16, color: C.white, marginBottom: 3 },
  heroCat: { fontFamily: F.medium, fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 },
  heroLocationRow: { flexDirection: "row", alignItems: "center" },
  heroLocation: { fontFamily: F.regular, fontSize: 11, color: "rgba(255,255,255,0.5)" },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "rgba(74,222,128,0.35)",
    backgroundColor: "rgba(74,222,128,0.12)",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  verifiedText: { fontFamily: F.semibold, fontSize: 10, color: "#4ADE80" },
  mobileBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "rgba(200,120,42,0.35)",
    backgroundColor: "rgba(200,120,42,0.15)",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  mobileBadgeText: { fontFamily: F.semibold, fontSize: 10, color: C.terra },

  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  statBlock: { flex: 1, alignItems: "center", position: "relative" },
  statVal: { fontFamily: F.bold, fontSize: 16, color: C.white, marginBottom: 2 },
  statLbl: { fontFamily: F.regular, fontSize: 9, color: "rgba(255,255,255,0.45)" },
  statSep: {
    position: "absolute", right: 0, top: 4,
    width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.15)",
  },

  barTrack: {
    height: 4, backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 2, overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 2 },

  sectionLabel: {
    fontFamily: F.semibold, fontSize: 10, letterSpacing: 1.2,
    color: C.muted, paddingHorizontal: 20, marginBottom: 10,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: C.cardBg,
    borderRadius: 16, marginHorizontal: 16, marginBottom: 20,
    paddingHorizontal: 16, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },

  emptyReviews: {
    marginHorizontal: 16, marginBottom: 20,
    backgroundColor: C.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 24, alignItems: "center", gap: 8,
  },
  emptyReviewsIcon: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: C.stoneBg, alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  emptyReviewsTitle: { fontFamily: F.semibold, fontSize: 14, color: C.ink },
  emptyReviewsSub: {
    fontFamily: F.regular, fontSize: 12, color: C.muted,
    textAlign: "center", lineHeight: 18,
  },

  reviewSummaryRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 8,
  },
  reviewSumItem: { flex: 1, alignItems: "center", gap: 4, paddingVertical: 8 },
  reviewSumVal: { fontFamily: F.bold, fontSize: 18, color: C.ink },
  reviewSumLbl: { fontFamily: F.regular, fontSize: 10, color: C.muted },

  // Sticky
  stickyBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: C.cardBg,
    paddingHorizontal: 20, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: C.border,
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  },
  stickyRate: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  stickyTx: { fontFamily: F.regular, fontSize: 12, color: C.muted },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.blue, borderRadius: 14,
    paddingHorizontal: 18, paddingVertical: 13,
  },
  ctaText: { fontFamily: F.bold, fontSize: 14, color: C.white },
});
