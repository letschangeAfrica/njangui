/**
 * Screen 6 — Home / Dashboard
 *
 * Loads GET /auth/me + GET /providers/me in parallel on focus.
 */

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { avatarColor, C, F, rateColor } from "../../constants/theme";
import { getMe, UserOut } from "../../services/auth";
import { getMyProviderProfile, ProviderOut } from "../../services/providers";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// ── Quick action config ───────────────────────────────────────────────────────

const ACTIONS: {
  icon: IoniconsName;
  label: string;
  route: string;
  bg: string;
  fg: string;
}[] = [
  { icon: "search-outline",    label: "Trouver un\nprestataire", route: "/(main)/search",            bg: C.blueFaint,  fg: C.blue  },
  { icon: "receipt-outline",   label: "Mes\ntransactions",       route: "/(main)/transactions",      bg: C.terraFaint, fg: C.terra },
  { icon: "briefcase-outline", label: "Devenir\nprestataire",    route: "/(main)/register-provider", bg: C.stoneBg,    fg: C.navy  },
  { icon: "person-outline",    label: "Mon\nprofil",             route: "/(main)/profile",           bg: C.greenFaint, fg: C.green },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function firstName(user: UserOut | null, provider: ProviderOut | null): string {
  if (provider?.full_name) return provider.full_name.split(" ")[0];
  if (user?.phone_number)  return user.phone_number;
  return "–";
}

// ── Reputation hero ───────────────────────────────────────────────────────────

function ReputationHero({ provider }: { provider: ProviderOut }) {
  const rate   = provider.satisfaction_rate ?? 0;
  const colors = avatarColor(provider.full_name);

  return (
    <View style={hero.root}>
      {/* decorative corner shapes */}
      <View style={hero.cornerTopRight} />
      <View style={hero.cornerBottomLeft} />

      <View style={hero.topRow}>
        {/* avatar + name */}
        <View style={[hero.avatar, { backgroundColor: colors.bg }]}>
          <Text style={[hero.avatarText, { color: colors.text }]}>
            {provider.full_name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={hero.label}>MA RÉPUTATION</Text>
          <Text style={hero.name} numberOfLines={1}>{provider.full_name}</Text>
          <View style={hero.metaRow}>
            <Ionicons name="location-outline" size={11} color="rgba(255,255,255,0.55)" />
            <Text style={hero.meta}> {provider.location_node.display_name_fr}</Text>
            <Text style={hero.metaDot}> · </Text>
            <Text style={hero.meta}>{provider.category.name_fr}</Text>
          </View>
        </View>
        {provider.id_card_verified && (
          <View style={hero.badge}>
            <Ionicons name="shield-checkmark" size={13} color="#4ADE80" />
            <Text style={hero.badgeText}>Vérifié</Text>
          </View>
        )}
      </View>

      {/* stats row */}
      <View style={hero.statsRow}>
        <View style={hero.stat}>
          <Text style={hero.statVal}>{rate.toFixed(0)}%</Text>
          <Text style={hero.statLbl}>Satisfaction</Text>
        </View>
        <View style={hero.statSep} />
        <View style={hero.stat}>
          <Text style={hero.statVal}>{provider.confirmed_tx_count}</Text>
          <Text style={hero.statLbl}>Transactions</Text>
        </View>
        <View style={hero.statSep} />
        <View style={hero.stat}>
          <Text style={[hero.statVal, { color: "#4ADE80" }]}>{provider.thumbs_up_count}</Text>
          <Text style={hero.statLbl}>Positifs</Text>
        </View>
        <View style={hero.statSep} />
        <View style={hero.stat}>
          <Text style={[hero.statVal, { color: "#F87171" }]}>{provider.thumbs_down_count}</Text>
          <Text style={hero.statLbl}>Négatifs</Text>
        </View>
      </View>

      {/* satisfaction bar */}
      <View style={hero.barTrack}>
        <View style={[hero.barFill, {
          width: `${Math.min(rate, 100)}%` as any,
          backgroundColor: rateColor(rate),
        }]} />
      </View>
    </View>
  );
}

// ── Become-provider prompt ────────────────────────────────────────────────────

function ProviderPrompt({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity style={prompt.root} onPress={onPress} activeOpacity={0.88}>
      <View style={prompt.left}>
        <View style={prompt.iconWrap}>
          <Ionicons name="briefcase-outline" size={24} color={C.terra} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={prompt.title}>Devenez prestataire</Text>
          <Text style={prompt.sub}>
            Partagez vos services et bâtissez votre réputation dans la communauté Njangui.
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.terra} />
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const router = useRouter();

  const [user,      setUser]      = useState<UserOut | null>(null);
  const [provider,  setProvider]  = useState<ProviderOut | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    try {
      const [me, prov] = await Promise.all([getMe(), getMyProviderProfile()]);
      setUser(me); setProvider(prov);
    } catch { /* silent */ } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.navy} />
        </View>
      </SafeAreaView>
    );
  }

  const name = firstName(user, provider);

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} tintColor={C.navy} />
        }
      >

        {/* ── Top bar ── */}
        <View style={s.topBar}>
          <View>
            <Text style={s.greeting}>Bonjour,</Text>
            <Text style={s.userName}>{name}</Text>
          </View>
          <View style={s.topActions}>
            <TouchableOpacity style={s.iconBtn} onPress={() => router.push("/(main)/profile" as any)}>
              <Ionicons name="notifications-outline" size={20} color={C.ink} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.avatarBtn, { backgroundColor: provider
                ? avatarColor(provider.full_name).bg
                : C.navy }]}
              onPress={() => router.push("/(main)/profile" as any)}
            >
              <Text style={s.avatarBtnText}>{name.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Hero ── */}
        {provider
          ? <ReputationHero provider={provider} />
          : <ProviderPrompt onPress={() => router.push("/(main)/register-provider" as any)} />
        }

        {/* ── Quick actions ── */}
        <Text style={s.sectionLabel}>ACTIONS RAPIDES</Text>
        <View style={s.actionsGrid}>
          {ACTIONS.map((a, i) => (
            <TouchableOpacity
              key={i}
              style={[s.actionTile, { backgroundColor: a.bg }]}
              activeOpacity={0.82}
              onPress={() => router.push(a.route as any)}
            >
              <View style={[s.actionIconWrap, { backgroundColor: a.fg + "22" }]}>
                <Ionicons name={a.icon} size={20} color={a.fg} />
              </View>
              <Text style={[s.actionLabel, { color: C.ink }]}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Account block ── */}
        {user && (
          <>
            <Text style={s.sectionLabel}>MON COMPTE</Text>
            <View style={s.infoBlock}>
              <View style={s.infoRow}>
                <Text style={s.infoKey}>Téléphone</Text>
                <Text style={s.infoVal}>{user.phone_number}</Text>
              </View>
              <View style={[s.infoRow, { borderBottomWidth: 0 }]}>
                <Text style={s.infoKey}>Statut</Text>
                <View style={[s.statusPill, {
                  backgroundColor: user.is_verified ? C.greenFaint : C.amberFaint,
                }]}>
                  <View style={[s.statusDot, {
                    backgroundColor: user.is_verified ? C.green : C.amber,
                  }]} />
                  <Text style={[s.statusText, {
                    color: user.is_verified ? C.green : C.amber,
                  }]}>
                    {user.is_verified ? "Vérifié" : "Non vérifié"}
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {/* ── Referral banner ── */}
        <View style={s.referralBanner}>
          <View style={s.referralBody}>
            <Text style={s.referralTitle}>Invitez vos proches</Text>
            <Text style={s.referralSub}>
              Chaque ami inscrit vous offre{"\n"}un mois de visibilité supplémentaire.
            </Text>
            <TouchableOpacity style={s.referralBtn}>
              <Ionicons name="share-social-outline" size={14} color={C.white} />
              <Text style={s.referralBtnText}>Partager l'invitation</Text>
            </TouchableOpacity>
          </View>
          <View style={s.referralAccent} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Hero styles ───────────────────────────────────────────────────────────────

const hero = StyleSheet.create({
  root: {
    backgroundColor: C.navy,
    borderRadius: 20,
    marginHorizontal: 16,
    marginBottom: 24,
    padding: 20,
    overflow: "hidden",
  },
  cornerTopRight: {
    position: "absolute", top: -30, right: -30,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  cornerBottomLeft: {
    position: "absolute", bottom: -24, left: -24,
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(200,120,42,0.18)",
  },
  topRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 20 },
  avatar: {
    width: 48, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { fontFamily: F.bold, fontSize: 20 },
  label: {
    fontFamily: F.semibold, fontSize: 9, letterSpacing: 1.2,
    color: "rgba(255,255,255,0.45)", marginBottom: 3,
  },
  name: { fontFamily: F.bold, fontSize: 16, color: C.white, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center" },
  meta: { fontFamily: F.regular, fontSize: 11, color: "rgba(255,255,255,0.55)" },
  metaDot: { fontFamily: F.regular, fontSize: 11, color: "rgba(255,255,255,0.3)" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "rgba(74,222,128,0.4)",
    backgroundColor: "rgba(74,222,128,0.12)",
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4,
  },
  badgeText: { fontFamily: F.semibold, fontSize: 11, color: "#4ADE80" },

  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  stat: { flex: 1, alignItems: "center" },
  statVal: { fontFamily: F.bold, fontSize: 18, color: C.white, marginBottom: 2 },
  statLbl: { fontFamily: F.regular, fontSize: 10, color: "rgba(255,255,255,0.5)" },
  statSep: { width: 1, height: 28, backgroundColor: "rgba(255,255,255,0.15)" },

  barTrack: {
    height: 4, backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 2, overflow: "hidden",
  },
  barFill: { height: "100%", borderRadius: 2 },
});

// ── Prompt styles ─────────────────────────────────────────────────────────────

const prompt = StyleSheet.create({
  root: {
    flexDirection: "row", alignItems: "center",
    marginHorizontal: 16, marginBottom: 24,
    backgroundColor: C.cardBg,
    borderRadius: 16, padding: 16,
    borderWidth: 1.5, borderColor: C.terra,
    gap: 12,
  },
  left: { flex: 1, flexDirection: "row", alignItems: "flex-start", gap: 12 },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.terraFaint,
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  title: { fontFamily: F.bold, fontSize: 15, color: C.ink, marginBottom: 3 },
  sub: { fontFamily: F.regular, fontSize: 12, color: C.dim, lineHeight: 18 },
});

// ── Screen styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },

  topBar: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
  },
  greeting: { fontFamily: F.regular, fontSize: 13, color: C.muted, marginBottom: 1 },
  userName: { fontFamily: F.bold, fontSize: 24, color: C.navy },
  topActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  avatarBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  avatarBtnText: { fontFamily: F.bold, fontSize: 16, color: C.white },

  sectionLabel: {
    fontFamily: F.semibold, fontSize: 10, letterSpacing: 1.2,
    color: C.muted, paddingHorizontal: 20, marginBottom: 12,
    textTransform: "uppercase",
  },

  actionsGrid: {
    flexDirection: "row", flexWrap: "wrap",
    paddingHorizontal: 16, gap: 10, marginBottom: 28,
  },
  actionTile: {
    width: "47%", borderRadius: 16, padding: 16, gap: 10,
  },
  actionIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  actionLabel: {
    fontFamily: F.semibold, fontSize: 13, lineHeight: 18,
  },

  infoBlock: {
    marginHorizontal: 16, marginBottom: 28,
    backgroundColor: C.cardBg, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: C.divider,
  },
  infoKey: { fontFamily: F.regular, fontSize: 13, color: C.muted },
  infoVal: { fontFamily: F.semibold, fontSize: 13, color: C.ink },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: F.semibold, fontSize: 12 },

  referralBanner: {
    marginHorizontal: 16,
    backgroundColor: C.navy,
    borderRadius: 20, padding: 20, overflow: "hidden",
    flexDirection: "row",
  },
  referralBody: { flex: 1, gap: 6 },
  referralTitle: { fontFamily: F.bold, fontSize: 16, color: C.white },
  referralSub: {
    fontFamily: F.regular, fontSize: 12,
    color: "rgba(255,255,255,0.65)", lineHeight: 18,
  },
  referralBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", marginTop: 10,
    backgroundColor: C.terra, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  referralBtnText: { fontFamily: F.semibold, fontSize: 13, color: C.white },
  referralAccent: {
    position: "absolute", right: -20, top: -20,
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "rgba(200,120,42,0.2)",
  },
});
