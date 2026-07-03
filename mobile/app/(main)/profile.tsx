/**
 * Screen 13 — My Profile
 *
 * Loads GET /auth/me + GET /providers/me in parallel on focus.
 */

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { avatarColor, C, F, rateColor } from "../../constants/theme";
import { getMe, logout, UserOut } from "../../services/auth";
import { getMyProviderProfile, ProviderOut } from "../../services/providers";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatJoinDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  } catch { return ""; }
}

function displayName(user: UserOut, provider: ProviderOut | null): string {
  return provider?.full_name ?? user.phone_number;
}

// ── Menu config ───────────────────────────────────────────────────────────────

type MenuItem = { icon: IoniconsName; label: string; chevron: boolean };

const MENU_BASE: { title: string; items: MenuItem[] }[] = [
  {
    title: "MON COMPTE",
    items: [
      { icon: "create-outline",      label: "Modifier mon profil",     chevron: true  },
      { icon: "lock-closed-outline", label: "Modifier le code PIN",    chevron: true  },
    ],
  },
  {
    title: "AIDE & SUPPORT",
    items: [
      { icon: "help-circle-outline",    label: "FAQ",                     chevron: true  },
      { icon: "chatbubble-outline",     label: "Contacter le support",    chevron: true  },
      { icon: "star-outline",          label: "Évaluer l'application",   chevron: false },
    ],
  },
  {
    title: "LÉGAL",
    items: [
      { icon: "document-text-outline", label: "Conditions d'utilisation", chevron: true },
      { icon: "shield-outline",        label: "Confidentialité",          chevron: true },
    ],
  },
];

const PROVIDER_SECTION: { title: string; items: MenuItem[] } = {
  title: "PRESTATAIRE",
  items: [
    { icon: "briefcase-outline",  label: "Mon profil prestataire", chevron: true },
    { icon: "list-outline",       label: "Mes services",           chevron: true },
    { icon: "location-outline",   label: "Ma zone de service",     chevron: true },
  ],
};

// ── Screen ────────────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const router = useRouter();

  const [user,       setUser]       = useState<UserOut | null>(null);
  const [provider,   setProvider]   = useState<ProviderOut | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([getMe(), getMyProviderProfile()])
        .then(([u, p]) => { setUser(u); setProvider(p); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, []),
  );

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/");
    } catch {
      setLoggingOut(false);
    }
  }

  if (loading || !user) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.header}>
          <Text style={s.title}>Profil</Text>
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          {loading
            ? <ActivityIndicator size="large" color={C.navy} />
            : <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.muted }}>
                Impossible de charger le profil
              </Text>
          }
        </View>
        {/* Always show logout so user can escape even when API is down */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
          {loggingOut
            ? <ActivityIndicator color={C.red} />
            : <>
                <Ionicons name="log-out-outline" size={18} color={C.red} />
                <Text style={s.logoutText}>Se déconnecter</Text>
              </>
          }
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const rate       = provider?.satisfaction_rate ?? 0;
  const isProvider = !!provider;
  const joinDate   = provider ? formatJoinDate(provider.created_at) : null;
  const name       = displayName(user, provider);
  const colors     = avatarColor(name);

  const menuSections = isProvider
    ? [MENU_BASE[0], PROVIDER_SECTION, ...MENU_BASE.slice(1)]
    : MENU_BASE;

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <Text style={s.title}>Profil</Text>
          <TouchableOpacity style={s.settingsBtn}>
            <Ionicons name="settings-outline" size={20} color={C.dim} />
          </TouchableOpacity>
        </View>

        {/* ── Identity card ── */}
        <View style={s.identityCard}>
          <View style={[s.avatar, { backgroundColor: colors.bg }]}>
            <Text style={[s.avatarText, { color: colors.text }]}>
              {name.charAt(0).toUpperCase()}
            </Text>
            {(provider?.id_card_verified || user.is_verified) && (
              <View style={s.verifiedDot}>
                <Ionicons name="shield-checkmark" size={11} color={C.white} />
              </View>
            )}
          </View>

          <Text style={s.userName}>{name}</Text>
          <Text style={s.userPhone}>{user.phone_number}</Text>

          <View style={s.pillsRow}>
            {isProvider ? (
              <View style={[s.pill, { backgroundColor: C.blueFaint }]}>
                <Ionicons name="briefcase-outline" size={12} color={C.blue} />
                <Text style={[s.pillText, { color: C.blue }]}>Prestataire</Text>
              </View>
            ) : (
              <View style={[s.pill, { backgroundColor: C.stoneBg }]}>
                <Ionicons name="person-outline" size={12} color={C.dim} />
                <Text style={[s.pillText, { color: C.dim }]}>Client</Text>
              </View>
            )}
            {(provider?.id_card_verified || user.is_verified) && (
              <View style={[s.pill, { backgroundColor: C.greenFaint }]}>
                <Ionicons name="shield-checkmark" size={12} color={C.green} />
                <Text style={[s.pillText, { color: C.green }]}>Vérifié</Text>
              </View>
            )}
            {provider?.is_mobile_provider && (
              <View style={[s.pill, { backgroundColor: C.terraFaint }]}>
                <Ionicons name="car-outline" size={12} color={C.terra} />
                <Text style={[s.pillText, { color: C.terra }]}>Mobile</Text>
              </View>
            )}
          </View>

          {joinDate && (
            <Text style={s.joinedText}>Membre depuis {joinDate}</Text>
          )}
        </View>

        {/* ── Reputation card — providers only ── */}
        {isProvider && (
          <View style={s.reputationCard}>
            <Text style={s.sectionLabel}>MA RÉPUTATION</Text>

            <View style={s.statsRow}>
              <View style={s.statBlock}>
                <Text style={[s.statVal, { color: rateColor(rate) }]}>{rate.toFixed(1)}%</Text>
                <Text style={s.statLbl}>Satisfaction</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statBlock}>
                <Text style={s.statVal}>{provider!.confirmed_tx_count}</Text>
                <Text style={s.statLbl}>Transactions</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statBlock}>
                <Text style={[s.statVal, { color: C.green }]}>{provider!.thumbs_up_count}</Text>
                <Text style={s.statLbl}>Positifs</Text>
              </View>
              <View style={s.statDivider} />
              <View style={s.statBlock}>
                <Text style={[s.statVal, { color: C.red }]}>{provider!.thumbs_down_count}</Text>
                <Text style={s.statLbl}>Négatifs</Text>
              </View>
            </View>

            <View style={s.barTrack}>
              <View style={[s.barFill, {
                width: `${Math.min(rate, 100)}%` as any,
                backgroundColor: rateColor(rate),
              }]} />
            </View>
            <Text style={s.barLabel}>
              Basé sur {provider!.confirmed_tx_count} transaction{provider!.confirmed_tx_count !== 1 ? "s" : ""} confirmée{provider!.confirmed_tx_count !== 1 ? "s" : ""}
            </Text>
          </View>
        )}

        {/* ── Provider info — providers only ── */}
        {isProvider && (
          <>
            <Text style={[s.sectionLabel, { paddingHorizontal: 20 }]}>PROFIL PRESTATAIRE</Text>
            <View style={s.infoCard}>
              {[
                { icon: "pricetag-outline" as IoniconsName,  label: "Catégorie",  value: provider!.category.name_fr },
                { icon: "construct-outline" as IoniconsName, label: "Spécialité", value: provider!.sub_category.name_fr },
                { icon: "location-outline" as IoniconsName,  label: "Zone",       value: provider!.location_node.display_name_fr },
                { icon: "car-outline" as IoniconsName,       label: "Mobile",     value: provider!.is_mobile_provider ? "Oui — se déplace chez vous" : "Non" },
                { icon: "cube-outline" as IoniconsName,      label: "Livraison",  value: provider!.offers_delivery ? "Oui" : "Non" },
              ].map((row, i, arr) => (
                <View key={i} style={[s.infoRow, i < arr.length - 1 && s.infoRowBorder]}>
                  <View style={s.infoIconWrap}>
                    <Ionicons name={row.icon} size={16} color={C.dim} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.infoLabel}>{row.label}</Text>
                    <Text style={s.infoValue}>{row.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        {/* ── Become provider CTA — clients only ── */}
        {!isProvider && (
          <TouchableOpacity
            style={s.becomeProviderBtn}
            activeOpacity={0.82}
            onPress={() => router.push("/(main)/register-provider" as any)}
          >
            <View style={s.becomeProviderIconWrap}>
              <Ionicons name="briefcase-outline" size={22} color={C.terra} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.becomeProviderTitle}>Devenir prestataire</Text>
              <Text style={s.becomeProviderSub}>Construisez votre réputation et trouvez des clients</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={C.terra} />
          </TouchableOpacity>
        )}

        {/* ── Menu sections ── */}
        {menuSections.map((section, si) => (
          <View key={si} style={s.menuSection}>
            <Text style={[s.sectionLabel, { paddingHorizontal: 20 }]}>{section.title}</Text>
            <View style={s.menuCard}>
              {section.items.map((item, ii) => (
                <TouchableOpacity
                  key={ii}
                  style={[s.menuItem, ii < section.items.length - 1 && s.menuItemBorder]}
                  activeOpacity={0.7}
                >
                  <View style={s.menuIconWrap}>
                    <Ionicons name={item.icon} size={18} color={C.dim} />
                  </View>
                  <Text style={s.menuLabel}>{item.label}</Text>
                  {item.chevron && (
                    <Ionicons name="chevron-forward" size={16} color={C.muted} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ── Logout ── */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} disabled={loggingOut}>
          {loggingOut ? (
            <ActivityIndicator color={C.red} />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color={C.red} />
              <Text style={s.logoutText}>Se déconnecter</Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={s.version}>Njangui v1.0.0 · Fait avec soin au Cameroun</Text>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },
  content: { paddingBottom: 40 },

  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 20,
  },
  title: { fontFamily: F.bold, fontSize: 26, color: C.navy },
  settingsBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },

  // Identity card
  identityCard: {
    backgroundColor: C.cardBg, borderRadius: 20,
    marginHorizontal: 16, marginBottom: 16,
    padding: 24, alignItems: "center",
    borderWidth: 1, borderColor: C.border,
  },
  avatar: {
    width: 76, height: 76, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    marginBottom: 14, position: "relative",
  },
  avatarText: { fontFamily: F.bold, fontSize: 30 },
  verifiedDot: {
    position: "absolute", bottom: -4, right: -4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.green, borderWidth: 2, borderColor: C.cardBg,
    alignItems: "center", justifyContent: "center",
  },
  userName: { fontFamily: F.bold, fontSize: 20, color: C.ink, marginBottom: 4 },
  userPhone: { fontFamily: F.regular, fontSize: 14, color: C.dim, marginBottom: 14 },
  pillsRow: {
    flexDirection: "row", gap: 6, marginBottom: 10,
    flexWrap: "wrap", justifyContent: "center",
  },
  pill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  pillText: { fontFamily: F.semibold, fontSize: 12 },
  joinedText: { fontFamily: F.regular, fontSize: 12, color: C.muted },

  sectionLabel: {
    fontFamily: F.semibold, fontSize: 10, letterSpacing: 1.2,
    color: C.muted, marginBottom: 10,
    textTransform: "uppercase",
  },

  // Reputation card
  reputationCard: {
    backgroundColor: C.cardBg, borderRadius: 20,
    marginHorizontal: 16, marginBottom: 16, padding: 18,
    borderWidth: 1, borderColor: C.border,
  },
  statsRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  statBlock: { flex: 1, alignItems: "center", gap: 3 },
  statVal: { fontFamily: F.bold, fontSize: 18, color: C.ink },
  statLbl: { fontFamily: F.regular, fontSize: 10, color: C.muted },
  statDivider: { width: 1, height: 32, backgroundColor: C.divider },
  barTrack: {
    height: 5, backgroundColor: C.stoneBg,
    borderRadius: 3, overflow: "hidden", marginBottom: 8,
  },
  barFill: { height: "100%", borderRadius: 3 },
  barLabel: { fontFamily: F.regular, fontSize: 11, color: C.muted, textAlign: "center" },

  // Provider info card
  infoCard: {
    backgroundColor: C.cardBg, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 16,
    paddingHorizontal: 16, paddingVertical: 4,
    borderWidth: 1, borderColor: C.border,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  infoIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: C.stoneBg, alignItems: "center", justifyContent: "center",
  },
  infoLabel: { fontFamily: F.regular, fontSize: 11, color: C.muted, marginBottom: 2 },
  infoValue: { fontFamily: F.semibold, fontSize: 14, color: C.ink },

  // Become provider
  becomeProviderBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.cardBg, borderRadius: 16,
    marginHorizontal: 16, marginBottom: 16, padding: 16,
    borderWidth: 1.5, borderColor: C.terra,
  },
  becomeProviderIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: C.terraFaint,
    alignItems: "center", justifyContent: "center",
  },
  becomeProviderTitle: { fontFamily: F.bold, fontSize: 15, color: C.ink, marginBottom: 2 },
  becomeProviderSub: { fontFamily: F.regular, fontSize: 12, color: C.muted },

  // Menu
  menuSection: { marginBottom: 16 },
  menuCard: {
    backgroundColor: C.cardBg, borderRadius: 16,
    marginHorizontal: 16, overflow: "hidden",
    borderWidth: 1, borderColor: C.border,
  },
  menuItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 15, gap: 12,
  },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  menuIconWrap: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: C.stoneBg, alignItems: "center", justifyContent: "center",
  },
  menuLabel: { flex: 1, fontFamily: F.medium, fontSize: 15, color: C.ink },

  // Logout
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    marginHorizontal: 16, marginTop: 4, marginBottom: 16,
    height: 52, borderRadius: 16,
    borderWidth: 1.5, borderColor: C.redFaint,
    backgroundColor: C.redFaint,
  },
  logoutText: { fontFamily: F.semibold, fontSize: 15, color: C.red },

  version: {
    fontFamily: F.regular, fontSize: 12, color: C.muted,
    textAlign: "center", marginBottom: 8,
  },
});
