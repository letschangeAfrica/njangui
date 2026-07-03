/**
 * Screen 14 — Register as a provider
 *
 * Loads categories from GET /providers/categories
 * Loads locations  from GET /providers/locations
 * Submits to        POST /providers/register
 */

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { C, F } from "../../constants/theme";
import {
  Category,
  listCategories,
  listLocations,
  LocationNode,
  registerProvider,
  SubCategory,
} from "../../services/providers";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
type Step = "info" | "category" | "location" | "options";

const STEPS: Step[] = ["info", "category", "location", "options"];

// Step metadata — icon + label shown in the header area
const STEP_META: Record<Step, { icon: IoniconsName; iconBg: string; iconColor: string; title: string; sub: string }> = {
  info: {
    icon: "person-outline",
    iconBg: C.blueFaint, iconColor: C.blue,
    title: "Comment vous appelez-vous ?",
    sub: "Ce nom apparaîtra sur votre profil public",
  },
  category: {
    icon: "grid-outline",
    iconBg: C.terraFaint, iconColor: C.terra,
    title: "Votre domaine d'activité",
    sub: "Choisissez la catégorie qui correspond le mieux",
  },
  location: {
    icon: "location-outline",
    iconBg: C.greenFaint, iconColor: C.green,
    title: "Votre zone de service",
    sub: "Où exercez-vous principalement ?",
  },
  options: {
    icon: "options-outline",
    iconBg: C.stoneBg, iconColor: C.dim,
    title: "Options de service",
    sub: "Ces informations aident les clients à vous trouver",
  },
};

// ── Top bar — shared across all states ───────────────────────────────────────

function TopBar({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={s.topBar}>
      <TouchableOpacity
        style={s.backBtn}
        onPress={onBack}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="arrow-back" size={20} color={C.ink} />
      </TouchableOpacity>
      <Text style={s.topTitle}>{title}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function RegisterProviderScreen() {
  const router = useRouter();

  // Reference data
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations,  setLocations]  = useState<LocationNode[]>([]);
  const [loadingRef, setLoadingRef] = useState(true);
  const [loadError,  setLoadError]  = useState<string | null>(null);

  // Form state
  const [step,        setStep]        = useState<Step>("info");
  const [fullName,    setFullName]    = useState("");
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  const [selectedSub, setSelectedSub] = useState<SubCategory | null>(null);
  const [selectedLoc, setSelectedLoc] = useState<LocationNode | null>(null);
  const [isMobile,    setIsMobile]    = useState(false);
  const [hasDelivery, setHasDelivery] = useState(false);

  // Submit state
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);
  const [done,         setDone]         = useState(false);

  function loadRef() {
    setLoadError(null); setLoadingRef(true);
    Promise.all([listCategories(), listLocations()])
      .then(([cats, locs]) => { setCategories(cats); setLocations(locs); })
      .catch((err: any) => setLoadError(err?.message ?? "Impossible de charger les données."))
      .finally(() => setLoadingRef(false));
  }

  useEffect(() => { loadRef(); }, []);

  const stepIndex = STEPS.indexOf(step);

  function nextStep() {
    const next = STEPS[stepIndex + 1];
    if (next) setStep(next);
  }
  function prevStep() {
    const prev = STEPS[stepIndex - 1];
    if (prev) setStep(prev);
    else router.back();
  }

  async function handleSubmit() {
    if (!selectedCat || !selectedSub || !selectedLoc) return;
    setSubmitting(true); setSubmitError(null);
    try {
      await registerProvider({
        full_name:          fullName.trim(),
        category_id:        selectedCat.id,
        sub_category_id:    selectedSub.id,
        location_node_id:   selectedLoc.id,
        is_mobile_provider: isMobile,
        offers_delivery:    hasDelivery,
      });
      setDone(true);
      setTimeout(() => router.replace("/(main)/home"), 2000);
    } catch (err: any) {
      setSubmitError(err?.message ?? "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  }

  const canProceed =
    (step === "info"     && fullName.trim().length >= 2) ||
    (step === "category" && selectedCat !== null && selectedSub !== null) ||
    (step === "location" && selectedLoc !== null) ||
    (step === "options");

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loadingRef) {
    return (
      <SafeAreaView style={s.safe}>
        <TopBar onBack={() => router.back()} title="Devenir prestataire" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }}>
          <ActivityIndicator size="large" color={C.navy} />
          <Text style={{ fontFamily: F.regular, fontSize: 14, color: C.muted }}>
            Chargement des catégories…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Load error ────────────────────────────────────────────────────────────

  if (loadError) {
    return (
      <SafeAreaView style={s.safe}>
        <TopBar onBack={() => router.back()} title="Devenir prestataire" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 }}>
          <View style={s.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={32} color={C.red} />
          </View>
          <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.ink, textAlign: "center" }}>
            {loadError}
          </Text>
          <TouchableOpacity style={s.retryBtn} onPress={loadRef}>
            <Text style={s.retryBtnText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────────

  if (done) {
    return (
      <SafeAreaView style={s.safe}>
        <View style={s.doneScreen}>
          <View style={s.doneIconWrap}>
            <Ionicons name="checkmark-circle" size={56} color={C.green} />
          </View>
          <Text style={s.doneTitle}>Profil créé !</Text>
          <Text style={s.doneSub}>
            Bienvenue dans la communauté des prestataires Njangui.{"\n"}
            Votre profil est maintenant visible par les clients.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────────

  const meta = STEP_META[step];

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {/* Top bar */}
        <TopBar onBack={prevStep} title="Devenir prestataire" />

        {/* Progress */}
        <View style={s.progressRow}>
          {STEPS.map((st, i) => (
            <View
              key={st}
              style={[
                s.progressSeg,
                i < stepIndex  && s.progressSegDone,
                i === stepIndex && s.progressSegActive,
              ]}
            />
          ))}
        </View>
        <Text style={s.progressLabel}>Étape {stepIndex + 1} sur {STEPS.length}</Text>

        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Step header */}
          <View style={s.stepHeader}>
            <View style={[s.stepIconWrap, { backgroundColor: meta.iconBg }]}>
              <Ionicons name={meta.icon} size={26} color={meta.iconColor} />
            </View>
            <Text style={s.stepTitle}>{meta.title}</Text>
            <Text style={s.stepSub}>{meta.sub}</Text>
          </View>

          {/* ── Step 1: Name ── */}
          {step === "info" && (
            <View style={s.card}>
              <Text style={s.fieldLabel}>NOM COMPLET</Text>
              <TextInput
                style={s.textInput}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Ex : Marie Atangana"
                placeholderTextColor={C.muted}
                autoFocus
                maxLength={100}
                returnKeyType="next"
                onSubmitEditing={() => canProceed && nextStep()}
              />
              <View style={s.fieldHintRow}>
                <Ionicons name="information-circle-outline" size={13} color={C.muted} />
                <Text style={s.fieldHint}>Utilisez votre vrai nom pour inspirer confiance</Text>
              </View>
            </View>
          )}

          {/* ── Step 2: Category ── */}
          {step === "category" && (
            <>
              <View style={s.catGrid}>
                {categories.map((cat) => {
                  const active = selectedCat?.id === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[s.catTile, active && s.catTileActive]}
                      onPress={() => { setSelectedCat(cat); setSelectedSub(null); }}
                      activeOpacity={0.8}
                    >
                      <Text style={s.catEmoji}>{cat.icon_name}</Text>
                      <Text style={[s.catName, active && s.catNameActive]} numberOfLines={2}>
                        {cat.name_fr}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedCat && selectedCat.sub_categories.length > 0 && (
                <View style={[s.card, { marginTop: 14 }]}>
                  <Text style={s.fieldLabel}>SPÉCIALITÉ</Text>
                  {selectedCat.sub_categories.map((sub, i, arr) => {
                    const active = selectedSub?.id === sub.id;
                    return (
                      <TouchableOpacity
                        key={sub.id}
                        style={[s.subRow, active && s.subRowActive, i < arr.length - 1 && s.subRowBorder]}
                        onPress={() => setSelectedSub(sub)}
                      >
                        <Text style={[s.subText, active && s.subTextActive]}>
                          {sub.name_fr}
                        </Text>
                        {active && (
                          <Ionicons name="checkmark" size={18} color={C.blue} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}

          {/* ── Step 3: Location ── */}
          {step === "location" && (
            <View style={s.locGrid}>
              {locations.map((loc) => {
                const active = selectedLoc?.id === loc.id;
                return (
                  <TouchableOpacity
                    key={loc.id}
                    style={[s.locChip, active && s.locChipActive]}
                    onPress={() => setSelectedLoc(loc)}
                  >
                    {active && (
                      <Ionicons name="checkmark" size={13} color={C.white} style={{ marginRight: 2 }} />
                    )}
                    <Text style={[s.locText, active && s.locTextActive]}>
                      {loc.display_name_fr}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {/* ── Step 4: Options + summary ── */}
          {step === "options" && (
            <>
              {/* Toggles */}
              <View style={s.card}>
                <TouchableOpacity
                  style={s.toggleRow}
                  onPress={() => setIsMobile(!isMobile)}
                  activeOpacity={0.8}
                >
                  <View style={[s.toggleIconWrap, { backgroundColor: isMobile ? C.blueFaint : C.stoneBg }]}>
                    <Ionicons name="car-outline" size={18} color={isMobile ? C.blue : C.dim} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>Je me déplace chez le client</Text>
                    <Text style={s.toggleSub}>Vous pouvez vous rendre chez vos clients</Text>
                  </View>
                  <Switch
                    value={isMobile}
                    onValueChange={setIsMobile}
                    trackColor={{ false: C.border, true: C.blueFaint }}
                    thumbColor={isMobile ? C.blue : C.white}
                  />
                </TouchableOpacity>

                <View style={s.toggleDivider} />

                <TouchableOpacity
                  style={s.toggleRow}
                  onPress={() => setHasDelivery(!hasDelivery)}
                  activeOpacity={0.8}
                >
                  <View style={[s.toggleIconWrap, { backgroundColor: hasDelivery ? C.terraFaint : C.stoneBg }]}>
                    <Ionicons name="cube-outline" size={18} color={hasDelivery ? C.terra : C.dim} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.toggleLabel}>Je propose la livraison</Text>
                    <Text style={s.toggleSub}>Vous livrez vos produits ou commandes</Text>
                  </View>
                  <Switch
                    value={hasDelivery}
                    onValueChange={setHasDelivery}
                    trackColor={{ false: C.border, true: C.terraFaint }}
                    thumbColor={hasDelivery ? C.terra : C.white}
                  />
                </TouchableOpacity>
              </View>

              {/* Summary */}
              <View style={[s.card, { marginTop: 14 }]}>
                <Text style={s.summaryTitle}>RÉCAPITULATIF</Text>
                {[
                  { icon: "person-outline"   as IoniconsName, label: "Nom",        value: fullName },
                  { icon: "grid-outline"     as IoniconsName, label: "Catégorie",  value: selectedCat?.name_fr ?? "" },
                  { icon: "construct-outline"as IoniconsName, label: "Spécialité", value: selectedSub?.name_fr ?? "" },
                  { icon: "location-outline" as IoniconsName, label: "Zone",       value: selectedLoc?.display_name_fr ?? "" },
                  { icon: "car-outline"      as IoniconsName, label: "Mobile",     value: isMobile    ? "Oui" : "Non" },
                  { icon: "cube-outline"     as IoniconsName, label: "Livraison",  value: hasDelivery ? "Oui" : "Non" },
                ].map((row, i, arr) => (
                  <View key={i} style={[s.summaryRow, i < arr.length - 1 && s.summaryRowBorder]}>
                    <View style={s.summaryIconWrap}>
                      <Ionicons name={row.icon} size={14} color={C.dim} />
                    </View>
                    <Text style={s.summaryKey}>{row.label}</Text>
                    <Text style={s.summaryVal} numberOfLines={1}>{row.value}</Text>
                  </View>
                ))}
              </View>

              {/* Submit error */}
              {submitError && (
                <View style={s.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={C.red} />
                  <Text style={s.errorText}>{submitError}</Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Bottom CTA */}
        <View style={s.bottomBar}>
          <TouchableOpacity
            style={[s.ctaBtn, (!canProceed || submitting) && s.ctaBtnDisabled]}
            activeOpacity={canProceed && !submitting ? 0.82 : 1}
            onPress={step !== "options" ? () => canProceed && nextStep() : handleSubmit}
            disabled={!canProceed || submitting}
          >
            {submitting ? (
              <ActivityIndicator color={C.white} />
            ) : (
              <>
                <Text style={[s.ctaText, !canProceed && s.ctaTextDisabled]}>
                  {step !== "options" ? "Continuer" : "Créer mon profil"}
                </Text>
                {canProceed && (
                  <Ionicons name="arrow-forward" size={18} color={C.white} />
                )}
              </>
            )}
          </TouchableOpacity>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.pageBg },

  // Top bar
  topBar: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12, gap: 12,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: C.cardBg, borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center",
  },
  topTitle: { flex: 1, fontFamily: F.bold, fontSize: 17, color: C.navy },

  // Progress
  progressRow: { flexDirection: "row", paddingHorizontal: 16, gap: 5, marginBottom: 6 },
  progressSeg: {
    flex: 1, height: 3, borderRadius: 2,
    backgroundColor: C.border,
  },
  progressSegDone:   { backgroundColor: C.terra + "80" },
  progressSegActive: { backgroundColor: C.terra },
  progressLabel: {
    fontFamily: F.regular, fontSize: 12, color: C.muted,
    paddingHorizontal: 16, marginBottom: 16,
  },

  scroll: { paddingHorizontal: 16, paddingBottom: 20 },

  // Step header
  stepHeader: { alignItems: "center", marginBottom: 20, gap: 10 },
  stepIconWrap: {
    width: 68, height: 68, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    marginBottom: 4,
  },
  stepTitle: {
    fontFamily: F.bold, fontSize: 22, color: C.navy,
    textAlign: "center",
  },
  stepSub: {
    fontFamily: F.regular, fontSize: 14, color: C.dim,
    textAlign: "center", lineHeight: 21,
  },

  // Card
  card: {
    backgroundColor: C.cardBg, borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: C.border,
    width: "100%",
  },
  fieldLabel: {
    fontFamily: F.semibold, fontSize: 10, letterSpacing: 1.1,
    color: C.muted, marginBottom: 12,
  },
  textInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 12,
    backgroundColor: C.pageBg, paddingHorizontal: 14, height: 52,
    fontFamily: F.medium, fontSize: 15, color: C.ink,
  },
  fieldHintRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 10 },
  fieldHint: { fontFamily: F.regular, fontSize: 12, color: C.muted },

  // Category grid
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, width: "100%" },
  catTile: {
    width: "47%", backgroundColor: C.cardBg, borderRadius: 14,
    padding: 14, alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: C.border,
  },
  catTileActive: { borderColor: C.navy, backgroundColor: C.blueFaint },
  catEmoji: { fontSize: 26 },
  catName: {
    fontFamily: F.medium, fontSize: 12, color: C.ink,
    textAlign: "center", lineHeight: 17,
  },
  catNameActive: { fontFamily: F.bold, color: C.navy },

  // Sub-category list
  subRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", paddingVertical: 13,
  },
  subRowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  subRowActive: {
    backgroundColor: C.blueFaint,
    marginHorizontal: -16, paddingHorizontal: 16,
    borderRadius: 8,
  },
  subText: { fontFamily: F.regular, fontSize: 14, color: C.ink },
  subTextActive: { fontFamily: F.semibold, color: C.blue },

  // Location chips
  locGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, width: "100%" },
  locChip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.cardBg, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 9,
    borderWidth: 1.5, borderColor: C.border,
  },
  locChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  locText: { fontFamily: F.medium, fontSize: 13, color: C.ink },
  locTextActive: { color: C.white },

  // Toggles
  toggleRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12,
  },
  toggleDivider: { height: 1, backgroundColor: C.divider },
  toggleIconWrap: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  toggleLabel: { fontFamily: F.semibold, fontSize: 14, color: C.ink, marginBottom: 2 },
  toggleSub: { fontFamily: F.regular, fontSize: 12, color: C.muted },

  // Summary
  summaryTitle: {
    fontFamily: F.semibold, fontSize: 10, letterSpacing: 1.1,
    color: C.muted, marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, gap: 10,
  },
  summaryRowBorder: { borderBottomWidth: 1, borderBottomColor: C.divider },
  summaryIconWrap: {
    width: 26, height: 26, borderRadius: 7,
    backgroundColor: C.stoneBg, alignItems: "center", justifyContent: "center",
  },
  summaryKey: { fontFamily: F.regular, fontSize: 13, color: C.muted, width: 80 },
  summaryVal: {
    fontFamily: F.semibold, fontSize: 13, color: C.ink,
    flex: 1, textAlign: "right",
  },

  // Error
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    marginTop: 14, backgroundColor: C.redFaint, borderRadius: 12,
    padding: 14, borderLeftWidth: 3, borderLeftColor: C.red,
  },
  errorText: { fontFamily: F.regular, fontSize: 13, color: C.red, flex: 1 },
  errorIconWrap: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: C.redFaint, alignItems: "center", justifyContent: "center",
  },
  retryBtn: {
    backgroundColor: C.blue, borderRadius: 12,
    paddingHorizontal: 24, paddingVertical: 11,
  },
  retryBtnText: { fontFamily: F.semibold, fontSize: 14, color: C.white },

  // Bottom CTA
  bottomBar: {
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: C.pageBg,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  ctaBtn: {
    height: 54, backgroundColor: C.blue, borderRadius: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  ctaBtnDisabled: { backgroundColor: C.border },
  ctaText: { fontFamily: F.bold, fontSize: 16, color: C.white },
  ctaTextDisabled: { color: C.muted },

  // Done
  doneScreen: {
    flex: 1, alignItems: "center", justifyContent: "center",
    padding: 32, gap: 14,
  },
  doneIconWrap: {
    width: 96, height: 96, borderRadius: 28,
    backgroundColor: C.greenFaint,
    alignItems: "center", justifyContent: "center",
    marginBottom: 8,
  },
  doneTitle: { fontFamily: F.bold, fontSize: 26, color: C.green },
  doneSub: {
    fontFamily: F.regular, fontSize: 15, color: C.dim,
    textAlign: "center", lineHeight: 24,
  },
});
