import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocale } from "../i18n";

/** Empty banner shared by iOS, Android, and web. No ad SDK is loaded. */
export function AdSlot({ dock = false }: { dock?: boolean }) {
  const { t } = useLocale();
  const insets = useSafeAreaInsets();
  return (
    <View
      accessibilityRole="summary"
      accessibilityLabel={t.adLabel}
      style={[styles.slot, dock && { paddingBottom: Math.max(insets.bottom, 8) }]}
    >
      <View style={styles.copy}>
        <Text style={styles.label}>{t.adLabel}</Text>
        <Text style={styles.hint}>{t.adHint}</Text>
      </View>
      <Text style={styles.platforms}>iOS · Android · Web</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    minHeight: 64,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#F3E6C8",
    borderTopWidth: 1,
    borderTopColor: "#E0C9A0",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  copy: { flex: 1, gap: 2 },
  label: { color: "#8A5A12", fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  hint: { color: "#7A6A5A", fontSize: 12, lineHeight: 16 },
  platforms: { color: "#A08050", fontSize: 10, fontWeight: "700" },
});
