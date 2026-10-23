import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { catalog, sportLabel } from "../catalog";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { colors, ui } from "../ui";

export function BoardsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { locale, t } = useLocale();
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.rankings}</Text>
      <Text style={ui.muted}>{t.homeLead}</Text>
      <View style={styles.grid}>
        {catalog.sports.map((sport) => (
          <Pressable key={sport} style={styles.sport} onPress={() => navigation.navigate("Rankings", { sport })}>
            <Text style={styles.name}>{sportLabel(locale, sport)}</Text>
            <Text style={styles.count}>{(catalog.boards.players[sport] ?? []).length}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  sport: {
    width: "48%",
    flexGrow: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
    minHeight: 88,
    justifyContent: "space-between",
  },
  name: { fontSize: 18, fontWeight: "800", color: colors.ink },
  count: { marginTop: 8, color: colors.primary, fontWeight: "800", fontSize: 16 },
});
