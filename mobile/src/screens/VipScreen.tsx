import { Pressable, ScrollView, Text } from "react-native";
import { useLocale } from "../i18n";
import { useSession } from "../store";
import { ui } from "../ui";

export function VipScreen() {
  const { t } = useLocale();
  const session = useSession();
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.vip}</Text>
      <Text style={ui.muted}>{t.vipLead}</Text>
      <Text style={ui.title}>
        {t.quota} {session.vip ? "VIP" : session.fullLeft()}
      </Text>
      <Pressable style={ui.primaryBtn} onPress={() => session.setVip(!session.vip)}>
        <Text style={ui.primaryBtnText}>{session.vip ? t.vipOn : t.vipOff}</Text>
      </Pressable>
    </ScrollView>
  );
}
