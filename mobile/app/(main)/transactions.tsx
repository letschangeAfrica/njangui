/**
 * Screen 12 — My Transactions list
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
import { C, F, statusMeta } from "../../constants/theme";
import { getMe } from "../../services/auth";
import { listTransactions, TransactionOut } from "../../services/transactions";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return iso; }
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return ""; }
}

function statusIcon(status: string): IoniconsName {
  if (status === "confirmed") return "checkmark-circle";
  if (status === "pending")   return "time-outline";
  return "close-circle";
}

// ── Filter tabs ───────────────────────────────────────────────────────────────

const FILTERS: { key: string; label: string }[] = [
  { key: "Tous",       label: "Tous" },
  { key: "Confirmés",  label: "Confirmés" },
  { key: "En attente", label: "En attente" },
  { key: "Annulés",    label: "Annulés" },
];

// ── Transaction card ──────────────────────────────────────────────────────────

function TxCard({
  tx,
  isProvider,
}: {
  tx: TransactionOut;
  isProvider: boolean;
}) {
  const meta = statusMeta(tx.status);

  return (
    <TouchableOpacity style={tc.root} activeOpacity={0.84}>
      {/* Status icon */}
      <View style={[tc.iconWrap, { backgroundColor: meta.bg }]}>
        <Ionicons name={statusIcon(tx.status)} size={22} color={meta.color} />
      </View>

      {/* Body */}
      <View style={{ flex: 1 }}>
        <View style={tc.topRow}>
          <Text style={tc.name} numberOfLines={1}>{tx.provider_name}</Text>
          <Text style={tc.amount}>{tx.amount_xaf.toLocaleString("fr-FR")} F</Text>
        </View>
        <View style={tc.bottomRow}>
          <Text style={tc.date}>{formatDate(tx.initiated_at)} · {formatTime(tx.initiated_at)}</Text>
          <View style={[tc.statusPill, { backgroundColor: meta.bg }]}>
            <View style={[tc.statusDot, { backgroundColor: meta.color }]} />
            <Text style={[tc.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
        {isProvider && (
          <View style={tc.rolePill}>
            <Ionicons name="briefcase-outline" size={10} color={C.terra} />
            <Text style={tc.rolePillText}>Reçu en tant que prestataire</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TransactionsScreen() {
  const router = useRouter();

  const [filter,     setFilter]     = useState("Tous");
  const [txList,     setTxList]     = useState<TransactionOut[]>([]);
  const [myUserId,   setMyUserId]   = useState<string | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const loadData = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const [data, me] = await Promise.all([
        listTransactions({ page_size: 50 }),
        getMe().catch(() => null),
      ]);
      setTxList(data.results);
      if (me) setMyUserId(me.id);
    } catch (err: any) {
      setError(err?.message ?? "Impossible de charger les transactions.");
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const displayed = txList.filter((tx) => {
    if (filter === "Tous")       return true;
    if (filter === "Confirmés")  return tx.status === "confirmed";
    if (filter === "En attente") return tx.status === "pending";
    if (filter === "Annulés")    return tx.status === "cancelled";
    return true;
  });

  const confirmed = txList.filter((t) => t.status === "confirmed");
  const totalXaf  = confirmed.reduce((sum, t) => sum + t.amount_xaf, 0);

  if (loading) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={C.navy} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Transactions</Text>
          <Text style={s.subtitle}>{txList.length} au total</Text>
        </View>
        <TouchableOpacity
          style={s.newBtn}
          onPress={() => router.push("/(main)/search" as any)}
        >
          <Ionicons name="add" size={18} color={C.white} />
          <Text style={s.newBtnText}>Nouvelle</Text>
        </TouchableOpacity>
      </View>

      {/* ── Error ── */}
      {error && (
        <TouchableOpacity style={s.errorBanner} onPress={() => loadData()}>
          <Ionicons name="alert-circle-outline" size={16} color={C.red} />
          <Text style={s.errorText}>{error} — Appuyer pour réessayer</Text>
        </TouchableOpacity>
      )}

      {/* ── Summary ── */}
      <View style={s.summaryCard}>
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>{txList.length}</Text>
          <Text style={s.summaryLbl}>Total</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={[s.summaryVal, { color: C.green }]}>{confirmed.length}</Text>
          <Text style={s.summaryLbl}>Confirmées</Text>
        </View>
        <View style={s.summaryDivider} />
        <View style={s.summaryItem}>
          <Text style={s.summaryVal}>
            {totalXaf >= 1000
              ? `${(totalXaf / 1000).toFixed(0)}k`
              : totalXaf.toLocaleString("fr-FR")}
          </Text>
          <Text style={s.summaryLbl}>FCFA confirmés</Text>
        </View>
      </View>

      {/* ── Filter tabs ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.filters}
        style={s.filtersScroll}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterTab, filter === f.key && s.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterTabText, filter === f.key && s.filterTabTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── List ── */}
      <ScrollView
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={C.navy}
          />
        }
      >
        {displayed.length === 0 ? (
          <View style={s.empty}>
            <View style={s.emptyIconWrap}>
              <Ionicons name="receipt-outline" size={28} color={C.muted} />
            </View>
            <Text style={s.emptyTitle}>Aucune transaction</Text>
            <Text style={s.emptySub}>
              {filter === "Tous"
                ? "Commencez par trouver un prestataire"
                : `Aucune transaction "${filter.toLowerCase()}"`}
            </Text>
            {filter === "Tous" && (
              <TouchableOpacity
                style={s.emptyAction}
                onPress={() => router.push("/(main)/search" as any)}
              >
                <Text style={s.emptyActionText}>Trouver un prestataire</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayed.map((tx) => (
            <TxCard
              key={tx.id}
              tx={tx}
              isProvider={!!(myUserId && tx.provider_id === myUserId)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Card styles ───────────────────────────────────────────────────────────────

const tc = StyleSheet.create({
  root: {
    flexDirection: "row", alignItems: "flex-start", gap: 12,
    backgroundColor: C.cardBg,
    borderRadius: 16, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: C.border,
  },
  iconWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  topRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 5,
  },
  name: {
    fontFamily: F.semibold, fontSize: 14, color: C.ink,
    flex: 1, marginRight: 8,
  },
  amount: { fontFamily: F.bold, fontSize: 14, color: C.ink },
  bottomRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center",
  },
  date: { fontFamily: F.regular, fontSize: 11, color: C.muted },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontFamily: F.medium, fontSize: 11 },
  rolePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-start", marginTop: 6,
    backgroundColor: C.terraFaint, borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  rolePillText: { fontFamily: F.regular, fontSize: 10, color: C.terra },
});

// ── Screen styles ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },

  header: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 20,
    paddingTop: 16, paddingBottom: 14,
  },
  title: { fontFamily: F.bold, fontSize: 26, color: C.navy, marginBottom: 2 },
  subtitle: { fontFamily: F.regular, fontSize: 13, color: C.muted },
  newBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.blue, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 9,
  },
  newBtnText: { fontFamily: F.semibold, fontSize: 13, color: C.white },

  errorBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginHorizontal: 16, marginBottom: 10,
    backgroundColor: C.redFaint, borderRadius: 12, padding: 12,
    borderLeftWidth: 3, borderLeftColor: C.red,
  },
  errorText: { fontFamily: F.regular, fontSize: 12, color: C.red, flex: 1 },

  summaryCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.cardBg,
    borderRadius: 16, marginHorizontal: 16, marginBottom: 14,
    paddingVertical: 16,
    borderWidth: 1, borderColor: C.border,
  },
  summaryItem: { flex: 1, alignItems: "center", gap: 4 },
  summaryVal: { fontFamily: F.bold, fontSize: 22, color: C.ink },
  summaryLbl: { fontFamily: F.regular, fontSize: 11, color: C.muted },
  summaryDivider: { width: 1, height: 32, backgroundColor: C.divider },

  filtersScroll: { maxHeight: 44, marginBottom: 12 },
  filters: { paddingHorizontal: 16, gap: 7, alignItems: "center" },
  filterTab: {
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 7,
    backgroundColor: C.cardBg, borderWidth: 1.5, borderColor: C.border,
  },
  filterTabActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterTabText: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  filterTabTextActive: { color: C.white },

  list: { paddingHorizontal: 16, paddingBottom: 32 },

  empty: { alignItems: "center", paddingTop: 60, gap: 8 },
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
  emptyAction: {
    marginTop: 8, backgroundColor: C.blueFaint,
    borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyActionText: { fontFamily: F.semibold, fontSize: 14, color: C.blue },
});
