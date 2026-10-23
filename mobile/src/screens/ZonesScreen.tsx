import { Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { ui } from "../ui";

export function ZonesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLocale();
  const { zones } = useSession();
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.zones}</Text>
      <Text style={ui.muted}>{t.zoneLead}</Text>
      <Pressable style={ui.primaryBtn} onPress={() => navigation.navigate("ZoneCreate")}>
        <Text style={ui.primaryBtnText}>{t.createZone}</Text>
      </Pressable>
      {zones.length === 0 ? <Text style={ui.muted}>{t.emptyZone}</Text> : null}
      {zones.map((zone) => (
        <Pressable key={zone.id} style={ui.card} onPress={() => navigation.navigate("Zone", { id: zone.id })}>
          <Text style={ui.title}>{zone.title}</Text>
          <Text style={ui.muted}>{zone.description}</Text>
          <Text style={ui.muted}>
            {zone.items.length} · {zone.dims.map((dim) => dim.label).join(" / ")}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}
