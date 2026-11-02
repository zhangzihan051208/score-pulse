import { ScrollView, Text } from "react-native";
import { TeamPartitions } from "../components/TeamPartitions";
import { useLocale } from "../i18n";
import { ui } from "../ui";

export function MyTeamsScreen() {
  const { t } = useLocale();
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.myTeams}</Text>
      <Text style={ui.muted}>{t.obTeamsLead}</Text>
      <TeamPartitions />
    </ScrollView>
  );
}
