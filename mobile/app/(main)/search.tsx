/**
 * Screen 7 — Search / Browse providers
 *
 * Loads categories from GET /providers/categories
 * Searches providers from GET /providers with debounced query + category filter
 */

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { avatarColor, C, F, rateColor } from "../../constants/theme";
import {
  Category,
  listCategories,
  ProviderSummaryOut,
  searchProviders,
} from "../../services/providers";

// ── Provider card ─────────────────────────────────────────────────────────────

function ProviderCard({
  provider,
  onPress,
}: {
  provider: ProviderSummaryOut;
  onPress: () => void;
}) {
  const rate   = provider.satisfaction_rate ?? 0;
  const colors = avatarColor(provider.full_name);

  return (
    <TouchableOpacity style={pc.root} activeOpacity={0.84} onPress={onPress}>
      {/* Avatar */}
      <View style={[pc.avatar, { backgroundColor: colors.bg }]}>
        <Text style={[pc.avatarText, { color: colors.text }]}>
          {provider.full_name.charAt(0).toUpperCase()}
        </Text>
      </View>

      {/* Body */}
      <View style={{ flex: 1 }}>
        {/* Name row */}
        <View style={pc.nameRow}>
          <Text style={pc.name} numberOfLines={1}>{provider.full_name}</Text>
          {provider.id_card_verified && (
            <Ionicons name="shield-checkmark" size={14} color={C.green} />
          )}
          {provider.is_mobile_provider && (
            <View style={pc.mobilePill}>
              <Text style={pc.mobilePillText}>Mobile</Text>
            </View>
          )}
        </View>

        {/* Category + location */}
        <Text style={pc.category}>{provider.category.name_fr}</Text>
        <View style={pc.locationRow}>
          <Ionicons name="location-outline" size={11} color={C.muted} />
          <Text style={pc.location}>{provider.location_node.display_name_fr}</Text>
        </View>

        {/* Satisfaction bar */}
        <View style={pc.barRow}>
          <View style={pc.barTrack}>
            <View style={[pc.barFill, {
              width: `${Math.min(rate, 100)}%` as any,
              backgroundColor: rateColor(rate),
            }]} />
          </View>
          <Text style={[pc.rateText, { color: rateColor(rate) }]}>
            {rate.toFixed(0)}%
          </Text>
          <Text style={pc.txText}>· {provider.confirmed_tx_count} tx</Text>
        </View>
      </View>

      <Ionicons name="chevron-forward" size={16} color={C.muted} />
    </TouchableOpacity>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function SearchScreen() {
  const router = useRouter();

  const [query,       setQuery]       = useState("");
  const [activeCatId, setActiveCatId] = useState<number | null>(null);
  const [focused,     setFocused]     = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [providers,  setProviders]  = useState<ProviderSummaryOut[]>([]);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [searching,  setSearching]  = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useFocusEffect(useCallback(() => {
    listCategories().then(setCategories).catch(() => {});
  }, []));

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(false), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, activeCatId]);

  async function doSearch(refresh = false) {
    if (refresh) setRefreshing(true);
    else if (providers.length === 0) setLoading(true);
    else setSearching(true);
    setError(null);
    try {
      const data = await searchProviders({ category_id: activeCatId ?? undefined, page_size: 30 });
      const q = query.trim().toLowerCase();
      const filtered = q
        ? data.results.filter(
            (p) =>
              p.full_name.toLowerCase().includes(q) ||
              p.category.name_fr.toLowerCase().includes(q) ||
              p.sub_category.name_fr.toLowerCase().includes(q),
          )
        : data.results;
      setProviders(filtered);
      setTotal(filtered.length);
    } catch (err: any) {
      setError(err?.message ?? "Impossible de charger les prestataires.");
    } finally {
      setLoading(false); setSearching(false); setRefreshing(false);
    }
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Prestataires</Text>
          <Text style={s.subtitle}>
            {loading ? "Chargement…" : `${total} résultat${total !== 1 ? "s" : ""}`}
          </Text>
        </View>
      </View>

      {/* ── Search bar ── */}
      <View style={[s.searchWrap, focused && s.searchWrapFocused]}>
        <Ionicons name="search-outline" size={18} color={focused ? C.blue : C.muted} />
        <TextInput
          style={s.searchInput}
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Nom, couture, mécanicien…"
          placeholderTextColor={C.muted}
          returnKeyType="search"
        />
        {searching && <ActivityIndicator size="small" color={C.blue} />}
        {query.length > 0 && !searching && (
          <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color={C.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Category chips ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
        style={s.chipsScroll}
      >
        <TouchableOpacity
          style={[s.chip, activeCatId === null && s.chipActive]}
          onPress={() => setActiveCatId(null)}
        >
          <Text style={[s.chipLabel, activeCatId === null && s.chipLabelActive]}>
            Tous
          </Text>
        </TouchableOpacity>

        {categories.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[s.chip, activeCatId === cat.id && s.chipActive]}
            onPress={() => setActiveCatId(activeCatId === cat.id ? null : cat.id)}
          >
            <Text style={s.chipIcon}>{cat.icon_name}</Text>
            <Text style={[s.chipLabel, activeCatId === cat.id && s.chipLabelActive]}>
              {cat.name_fr}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── Filter row ── */}
      <View style={s.filterRow}>
        <Text style={s.filterCount}>
          {total} prestataire{total !== 1 ? "s" : ""}
        </Text>
        {activeCatId !== null && (
          <TouchableOpacity style={s.clearBtn} onPress={() => setActiveCatId(null)}>
            <Ionicons name="close" size={12} color={C.red} />
            <Text style={s.clearBtnText}>Effacer le filtre</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Error ── */}
      {error && (
        <TouchableOpacity style={s.errorBanner} onPress={() => doSearch()}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={s.errorText}>{error} — Appuyer pour réessayer</Text>
        </TouchableOpacity>
      )}

      {/* ── List ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator size="large" color={C.navy} />
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.muted }}>
            Chargement…
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => doSearch(true)} tintColor={C.navy} />
          }
        >
          {providers.length === 0 ? (
            <View style={s.empty}>
              <View style={s.emptyIconWrap}>
                <Ionicons name="search-outline" size={32} color={C.muted} />
              </View>
              <Text style={s.emptyTitle}>Aucun prestataire trouvé</Text>
              <Text style={s.emptySub}>
                {query
                  ? "Essayez un autre terme de recherche"
                  : "Aucun prestataire dans cette catégorie pour l'instant"}
              </Text>
            </View>
          ) : (
            providers.map((p) => (
              <ProviderCard
                key={p.id}
                provider={p}
                onPress={() =>
                  router.push({
                    pathname: "/(main)/provider/[id]",
                    params: { id: p.id },
                  } as any)
                }
              />
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ── Card styles ───────────────────────────────────────────────────────────────

const pc = StyleSheet.create({
  root: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.cardBg,
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  avatarText: { fontFamily: F.bold, fontSize: 18 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 },
  name: { fontFamily: F.bold, fontSize: 14, color: C.ink, flex: 1 },
  mobilePill: {
    backgroundColor: C.terraFaint, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  mobilePillText: { fontFamily: F.medium, fontSize: 10, color: C.terra },
  category: { fontFamily: F.medium, fontSize: 12, color: C.blue, marginBottom: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 8 },
  location: { fontFamily: F.regular, fontSize: 11, color: C.muted },
  barRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  barTrack: { flex: 1, height: 4, backgroundColor: C.stoneBg, borderRadius: 2, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 2 },
  rateText: { fontFamily: F.semibold, fontSize: 12 },
  txText: { fontFamily: F.regular, fontSize: 11, color: C.muted },
});

// ── Screen styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },

  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 14 },
  title: { fontFamily: F.bold, fontSize: 26, color: C.navy, marginBottom: 2 },
  subtitle: { fontFamily: F.regular, fontSize: 13, color: C.muted },

  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.cardBg,
    marginHorizontal: 16, paddingHorizontal: 14, height: 48,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    marginBottom: 14,
  },
  searchWrapFocused: { borderColor: C.blue },
  searchInput: {
    flex: 1,
    fontFamily: F.regular, fontSize: 14, color: C.ink,
  },

  chipsScroll: { maxHeight: 44, marginBottom: 10 },
  chips: { paddingHorizontal: 16, gap: 7, alignItems: "center" },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.cardBg, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1.5, borderColor: C.border,
  },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipIcon: { fontSize: 13 },
  chipLabel: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  chipLabelActive: { color: C.white },

  filterRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 20, marginBottom: 10,
  },
  filterCount: { fontFamily: F.medium, fontSize: 13, color: C.dim },
  clearBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: C.redFaint, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  clearBtnText: { fontFamily: F.medium, fontSize: 12, color: C.red },

  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: C.redFaint, borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: C.red,
  },
  errorText: { fontFamily: F.regular, fontSize: 12, color: C.red, flex: 1 },

  list: { paddingHorizontal: 16, paddingBottom: 32 },
  empty: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.stoneBg, alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  emptyTitle: { fontFamily: F.semibold, fontSize: 16, color: C.ink },
  emptySub: {
    fontFamily: F.regular, fontSize: 13, color: C.muted,
    textAlign: "center", paddingHorizontal: 40, lineHeight: 20,
  },
});
