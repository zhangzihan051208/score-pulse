import { ScrollView, Text, View } from "react-native";
import { useLocale } from "../i18n";
import { ui } from "../ui";

const sections = {
  zh: [
    ["球员评分", "进入比赛帖，按位置打五个维度。总分按该位置的权重合成，不是五个分数的简单平均。评分记在这台设备上，可在动态里回看。非 VIP 每天 5 次五维详评，仅总分不限。VIP 不限次，均分权重 ×2。"],
    ["主队", "在个人主页的「我的主队」里按联赛勾选，再设主队和副队。首页会把这些队的比赛放到前面。"],
    ["评分专区", "和比赛帖分开的榜，例如夜市小吃。自己定 3 到 5 个评分项，再往上架条目。带联系方式或导流的评论会先待审核。"],
  ],
  en: [
    ["Player grades", "Open a match and grade five axes for that role. The total uses the role's weights. Ratings stay on this device and show up in the feed. Without VIP you get 5 full grades a day. VIP is unlimited and counts double."],
    ["Your clubs", "On your profile, open My clubs, check a league, then set a primary and a secondary. Home lifts their matches."],
    ["Zones", "Boards apart from matches, like a night-market snack list. You choose 3 to 5 axes, then add items. Notes that look like a pitch wait for review."],
  ],
} as const;

export function GuideScreen() {
  const { locale, t } = useLocale();
  const rows = sections[locale];
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.guideTitle}</Text>
      <Text style={ui.muted}>{t.guideLead}</Text>
      {rows.map(([title, body]) => (
        <View key={title} style={ui.card}>
          <Text style={ui.title}>{title}</Text>
          <Text style={ui.muted}>{body}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
