import { ScrollView, StyleSheet, Text } from "react-native";
import { useLocale } from "../i18n";

export function PrivacyScreen() {
  const { t } = useLocale();
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{t.privacyTitle}</Text>
      <Text style={styles.body}>{t.privacyBody}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#F6F1E8" },
  content: { padding: 20, gap: 12 },
  title: { fontSize: 28, fontWeight: "800", color: "#2A2118" },
  body: { color: "#2A2118", lineHeight: 24, fontSize: 16 },
});
