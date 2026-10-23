import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { TeamPartitions } from "../components/TeamPartitions";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { colors, ui } from "../ui";

const STEPS = ["welcome", "teams", "ratings", "zones"] as const;
type Step = (typeof STEPS)[number];

export function OnboardingScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Onboarding">) {
  const { t } = useLocale();
  const session = useSession();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>("welcome");
  const index = STEPS.indexOf(step);

  function finish() {
    session.completeOnboarding();
    navigation.reset({ index: 0, routes: [{ name: "Tabs" }] });
  }

  const welcome = [t.obWelcome1, t.obWelcome2, t.obWelcome3];
  const ratings = [t.obRate1, t.obRate2, t.obRate3, t.obRate4];
  const zones = [t.obZone1, t.obZone2, t.obZone3, t.obZone4];

  return (
    <View style={[ui.page, { paddingTop: insets.top }]}>
      <View style={styles.head}>
        <Text style={styles.kicker}>{t.obKicker}</Text>
        <Text style={styles.title}>{t.obTitle}</Text>
        <View style={styles.bars}>
          {STEPS.map((name, i) => (
            <View key={name} style={[styles.bar, i <= index && styles.barOn]} />
          ))}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.body}>
        {step === "welcome" ? (
          <View style={{ gap: 10 }}>
            <Text style={styles.lead}>{t.obWelcomeLead}</Text>
            {welcome.map((line) => (
              <View key={line} style={styles.bullet}>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {step === "teams" ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.lead}>{t.obTeamsLead}</Text>
            <TeamPartitions />
          </View>
        ) : null}

        {step === "ratings" ? (
          <View style={{ gap: 10 }}>
            <Text style={ui.title}>{t.obRatingsTitle}</Text>
            {ratings.map((line) => (
              <View key={line} style={styles.bullet}>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
            <Text style={styles.lead}>{t.obRatingsSee}</Text>
            <Pressable onPress={() => navigation.navigate("Guide")}>
              <Text style={styles.link}>{t.guide} →</Text>
            </Pressable>
          </View>
        ) : null}

        {step === "zones" ? (
          <View style={{ gap: 10 }}>
            <Text style={ui.title}>{t.obZonesTitle}</Text>
            {zones.map((line) => (
              <View key={line} style={styles.bullet}>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.bulletText}>{line}</Text>
              </View>
            ))}
            <View style={styles.linkRow}>
              <Pressable onPress={() => navigation.navigate("Tabs", { screen: "Zones" })}>
                <Text style={styles.link}>{t.zones} →</Text>
              </Pressable>
              <Pressable onPress={() => navigation.navigate("ZoneCreate")}>
                <Text style={styles.link}>{t.createZone} →</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <View style={{ flex: 1 }}>
          {step === "teams" ? (
            <Pressable onPress={() => setStep("ratings")}>
              <Text style={styles.skip}>{t.obSkip}</Text>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.actions}>
          {index > 0 ? (
            <Pressable style={ui.outlineBtn} onPress={() => setStep(STEPS[index - 1]!)}>
              <Text style={ui.outlineBtnText}>{t.obBack}</Text>
            </Pressable>
          ) : null}
          {step !== "zones" ? (
            <Pressable style={ui.primaryBtn} onPress={() => setStep(STEPS[index + 1]!)}>
              <Text style={ui.primaryBtnText}>{t.obNext}</Text>
            </Pressable>
          ) : (
            <Pressable style={ui.primaryBtn} onPress={finish}>
              <Text style={ui.primaryBtnText}>{t.obFinish}</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12, gap: 4, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.line },
  kicker: { color: colors.muted, fontSize: 11, fontWeight: "800", letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 22, fontWeight: "800" },
  bars: { flexDirection: "row", gap: 6, marginTop: 8 },
  bar: { flex: 1, height: 4, borderRadius: 99, backgroundColor: colors.chip },
  barOn: { backgroundColor: colors.primary },
  body: { padding: 16, paddingBottom: 24, gap: 12 },
  lead: { color: colors.muted, fontSize: 14, lineHeight: 22 },
  bullet: { flexDirection: "row", gap: 8 },
  dot: { color: colors.primary, fontWeight: "800", lineHeight: 22 },
  bulletText: { flex: 1, color: colors.ink, fontSize: 14, lineHeight: 22 },
  link: { color: colors.primary, fontWeight: "800", fontSize: 14 },
  linkRow: { flexDirection: "row", gap: 16 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.card,
  },
  skip: { color: colors.muted, fontSize: 13 },
  actions: { flexDirection: "row", gap: 8 },
});
