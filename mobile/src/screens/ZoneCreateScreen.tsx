import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { colors, ui } from "../ui";

const categories = [
  ["food", "美食", "Food"],
  ["drink", "饮品", "Drink"],
  ["snack", "零食", "Snack"],
  ["restaurant", "餐厅", "Restaurant"],
  ["product", "好物", "Gear"],
  ["custom", "自定义", "Custom"],
] as const;

export function ZoneCreateScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "ZoneCreate">) {
  const { locale, t } = useLocale();
  const session = useSession();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dims, setDims] = useState("味道\n份量\n性价比");
  const [category, setCategory] = useState<(typeof categories)[number][0]>("food");

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.createZone}</Text>
      <Text style={ui.muted}>{t.zoneLead}</Text>
      <TextInput value={title} onChangeText={setTitle} placeholder={t.zoneTitlePh} placeholderTextColor="#A89886" style={ui.input} />
      <TextInput value={description} onChangeText={setDescription} placeholder={t.commentPh} placeholderTextColor="#A89886" style={ui.input} />
      <TextInput
        value={dims}
        onChangeText={setDims}
        placeholder={t.zoneDimsPh}
        placeholderTextColor="#A89886"
        style={[ui.input, { minHeight: 88 }]}
        multiline
      />
      <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
        {categories.map(([id, zh, en]) => (
          <Pressable key={id} onPress={() => setCategory(id)} style={[ui.chip, category === id && ui.chipOn]}>
            <Text style={[ui.chipText, category === id && ui.chipTextOn]}>{locale === "zh" ? zh : en}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Pressable
        style={ui.primaryBtn}
        onPress={() => {
          const labels = dims
            .split(/\n|,|，/)
            .map((line) => line.trim())
            .filter(Boolean)
            .slice(0, 5);
          if (!title.trim() || labels.length < 3) return;
          const id = session.addZone({
            title: title.trim(),
            category,
            description: description.trim(),
            dims: labels.map((label, index) => ({ id: `d${index}`, label })),
          });
          navigation.replace("Zone", { id });
        }}
      >
        <Text style={ui.primaryBtnText}>{t.publish}</Text>
      </Pressable>
      <Text style={{ color: colors.muted, fontSize: 12 }}>{t.zoneDimsPh}</Text>
    </ScrollView>
  );
}
