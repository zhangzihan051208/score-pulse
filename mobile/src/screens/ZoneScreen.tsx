import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { ui } from "../ui";

export function ZoneScreen({ route, navigation }: NativeStackScreenProps<RootStackParamList, "Zone">) {
  const { t } = useLocale();
  const session = useSession();
  const zone = session.zones.find((item) => item.id === route.params.id);
  const [name, setName] = useState("");
  if (!zone) {
    return (
      <View style={[ui.page, { padding: 20 }]}>
        <Text>{t.empty}</Text>
      </View>
    );
  }
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{zone.title}</Text>
      <Text style={ui.muted}>{zone.description}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <TextInput value={name} onChangeText={setName} placeholder={t.itemPh} placeholderTextColor="#A89886" style={[ui.input, { flex: 1 }]} />
        <Pressable
          style={ui.primaryBtn}
          onPress={() => {
            if (!name.trim()) return;
            session.addZoneItem(zone.id, name.trim());
            setName("");
          }}
        >
          <Text style={ui.primaryBtnText}>{t.addItem}</Text>
        </Pressable>
      </View>
      {zone.items.map((item) => {
        const visible = item.comments.filter((comment) => comment.status === "ok");
        const avg = average(visible.flatMap((comment) => Object.values(comment.scores)));
        return (
          <Pressable key={item.id} style={ui.card} onPress={() => navigation.navigate("ZoneItem", { zoneId: zone.id, itemId: item.id })}>
            <View style={ui.row}>
              <Text style={[ui.title, { flex: 1 }]}>{item.name}</Text>
              {avg != null ? <Text style={ui.score}>{avg.toFixed(1)}</Text> : null}
            </View>
            {item.blurb ? <Text style={ui.muted}>{item.blurb}</Text> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
