/**
 * Shared custom numeric keypad — used by the phone-entry and OTP screens
 * instead of the system keyboard, so digit entry looks and behaves
 * identically across both.
 */

import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { F } from "../constants/theme";
import { t } from "../lib/i18n";

const ROWS: (string | null)[][] = [
  ["1", "2", "3"],
  ["4", "5", "6"],
  ["7", "8", "9"],
  [null, "0", "backspace"],
];

export default function NumericKeypad({
  onDigit,
  onBackspace,
  disabled,
}: {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={s.keypad}>
      {ROWS.flat().map((key, i) => {
        if (key === null) return <View key={i} style={s.key} />;
        if (key === "backspace") {
          return (
            <TouchableOpacity
              key={i}
              style={s.key}
              onPress={onBackspace}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel={t("phone.keypad.backspace")}
            >
              <Ionicons name="backspace-outline" size={22} color="#6B5D4F" />
            </TouchableOpacity>
          );
        }
        return (
          <TouchableOpacity
            key={i}
            style={[s.key, s.keyDigit]}
            onPress={() => onDigit(key)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={t("phone.keypad.digit", { digit: key })}
          >
            <Text style={s.keyDigitText}>{key}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  keypad: {
    flexDirection: "row", flexWrap: "wrap",
    backgroundColor: "#EFE6D8", borderTopWidth: 1, borderTopColor: "#E3D6C1",
    paddingHorizontal: 6, paddingTop: 8, paddingBottom: 26, gap: 6,
  },
  key: {
    width: "32%", height: 52, borderRadius: 13,
    alignItems: "center", justifyContent: "center",
  },
  keyDigit: { backgroundColor: "#FFFFFF" },
  keyDigitText: { fontFamily: F.bold, fontSize: 22, color: "#241C15" },
});
