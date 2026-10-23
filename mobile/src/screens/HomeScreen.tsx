import { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { sportLabel, team } from "../catalog";
import { esportsGames, eventsForTeam, hotPlayers, leagues, matchEvents, pairText } from "../events";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { colors, ui } from "../ui";

const SPORT_ORDER = ["nba", "soccer", "esports", "nfl", "f1", "tennis", "ufc"];

export function HomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { locale, t } = useLocale();
  const session = useSession();
  const [league, setLeague] = useState<string | null>(null);
  const live = matchEvents.filter((event) => event.status === "live");
  const favoriteNames = Object.entries(session.favorites).flatMap(([sport, slots]) =>
    [slots.primary, slots.secondary]
      .filter((id): id is string => Boolean(id))
      .map((id) => team(sport, id)?.name)
      .filter((name): name is string => Boolean(name)),
  );
  const favoriteEvents = matchEvents.filter((event) =>
    favoriteNames.some((name) => eventsForTeam(name).some((row) => row.slug === event.slug)),
  );
  const hot = hotPlayers(6);

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <View style={styles.hero}>
        <View style={ui.row}>
          <Image source={require("../../assets/brand-mark.jpg")} style={styles.mark} />
          <Text style={styles.kicker}>{t.brand}</Text>
        </View>
        <Text style={styles.heroTitle}>{t.homeTitle}</Text>
        <Text style={styles.heroLead}>{t.homeLead}</Text>
        <Text style={styles.tagline}>{t.tagline}</Text>
      </View>

      <Pressable style={styles.zoneStrip} onPress={() => navigation.navigate("Tabs", { screen: "Zones" })}>
        <View style={{ flex: 1 }}>
          <Text style={ui.title}>{t.zones}</Text>
          <Text style={ui.muted}>{t.zoneLead}</Text>
        </View>
        <Text style={styles.enter}>{t.enter}</Text>
      </Pressable>

      <View style={styles.links}>
        <Pressable style={styles.link} onPress={() => navigation.navigate("Guide")}>
          <Text style={styles.linkText}>{t.guide}</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => navigation.navigate("Feed")}>
          <Text style={styles.linkText}>{t.feed}</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => navigation.navigate("MyTeams")}>
          <Text style={styles.linkText}>{t.myTeams}</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => navigation.navigate("Search", {})}>
          <Text style={styles.linkText}>{t.find}</Text>
        </Pressable>
      </View>

      {favoriteEvents.length > 0 ? (
        <View style={ui.card}>
          <Text style={styles.section}>{t.myTeams}</Text>
          {favoriteEvents.map((event) => (
            <MatchLine key={event.slug} status={event.status} title={pairText(locale, event.title)} slug={event.slug} />
          ))}
        </View>
      ) : null}

      {live.length > 0 ? (
        <View>
          <Text style={styles.section}>{t.liveNow}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveRow}>
            {live.map((event) => (
              <Pressable key={event.slug} style={styles.liveChip} onPress={() => navigation.navigate("Event", { slug: event.slug })}>
                <Text style={styles.liveFlag}>{t.statusLive}</Text>
                <Text style={styles.liveTitle} numberOfLines={1}>
                  {pairText(locale, event.title)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {SPORT_ORDER.map((sport) => {
        const rows = matchEvents.filter(
          (event) => event.sport === sport && (sport !== "soccer" || !league || event.leagueSlug === league),
        );
        return (
          <View key={sport} style={ui.card}>
            <View style={styles.sportHead}>
              <Text style={ui.title}>
                {sportLabel(locale, sport)}
                {rows.length > 0 ? <Text style={ui.muted}>{`  ${rows.length} ${t.matches}`}</Text> : null}
              </Text>
              <Pressable onPress={() => navigation.navigate("Rankings", { sport })}>
                <Text style={styles.enter}>{t.enter}</Text>
              </Pressable>
            </View>
            {sport === "soccer" ? (
              <View style={styles.chips}>
                {leagues
                  .filter((item) => item.sport === "soccer")
                  .map((item) => (
                    <Pressable key={item.slug} onPress={() => setLeague((current) => (current === item.slug ? null : item.slug))}>
                      <Text style={[styles.league, league === item.slug && styles.leagueOn]}>
                        {locale === "zh" ? item.zh : item.en}
                      </Text>
                    </Pressable>
                  ))}
              </View>
            ) : null}
            {sport === "esports" ? (
              <View style={styles.chips}>
                {esportsGames.map((game) => (
                  <Pressable key={game.slug} onPress={() => navigation.navigate("Rankings", { sport: "esports" })}>
                    <Text style={styles.league}>{locale === "zh" ? game.zh : game.en}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {rows.length === 0 ? <Text style={ui.muted}>{t.noMatches}</Text> : null}
            {rows.map((event) => (
              <MatchLine
                key={event.slug}
                status={event.status}
                title={pairText(locale, event.title)}
                slug={event.slug}
                detail={`${pairText(locale, event.subtitle)} · ${event.players.length} ${t.playersOnPitch}`}
              />
            ))}
          </View>
        );
      })}

      <View style={ui.card}>
        <Text style={styles.section}>{t.hot}</Text>
        {hot.map(({ event, player, overall }) => (
          <Pressable
            key={`${event.slug}-${player.id}`}
            style={styles.match}
            onPress={() => navigation.navigate("Rate", { slug: event.slug, athleteId: player.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={ui.title}>{player.name}</Text>
              <Text style={ui.muted} numberOfLines={1}>
                {pairText(locale, event.title)}
              </Text>
            </View>
            <Text style={ui.score}>{overall.toFixed(1)}</Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

function MatchLine({
  slug,
  title,
  status,
  detail,
}: {
  slug: string;
  title: string;
  status: "live" | "upcoming" | "ended";
  detail?: string;
}) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useLocale();
  const label = status === "live" ? t.statusLive : status === "upcoming" ? t.statusUpcoming : t.statusEnded;
  return (
    <Pressable onPress={() => navigation.navigate("Event", { slug })} style={styles.match}>
      <Text style={[styles.flag, status === "live" && styles.flagLive]}>{label}</Text>
      <View style={{ flex: 1 }}>
        <Text style={ui.title}>{title}</Text>
        {detail ? <Text style={ui.muted}>{detail}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.header, borderRadius: 22, padding: 18, gap: 6 },
  mark: { width: 36, height: 36, borderRadius: 10 },
  kicker: { color: colors.primary, fontWeight: "800", letterSpacing: 2, fontSize: 12 },
  heroTitle: { color: "#fff", fontSize: 26, fontWeight: "800", marginTop: 8 },
  heroLead: { color: "rgba(255,255,255,0.78)", lineHeight: 22 },
  tagline: { color: "rgba(255,255,255,0.45)", fontSize: 12 },
  zoneStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FDE8DF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#F0C2B0",
  },
  links: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  link: {
    backgroundColor: colors.card,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  linkText: { color: colors.ink, fontWeight: "700", fontSize: 13 },
  section: { color: colors.muted, fontSize: 12, fontWeight: "800", letterSpacing: 1 },
  liveRow: { gap: 8, paddingVertical: 4 },
  liveChip: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 10,
    maxWidth: 220,
    gap: 4,
  },
  liveFlag: { color: colors.primary, fontSize: 11, fontWeight: "800" },
  liveTitle: { color: colors.ink, fontWeight: "700" },
  sportHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 8 },
  enter: { color: colors.primary, fontWeight: "800", fontSize: 13 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  league: {
    backgroundColor: colors.chip,
    color: colors.ink,
    overflow: "hidden",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 12,
    fontWeight: "700",
  },
  leagueOn: { backgroundColor: colors.primary, color: "#fff" },
  match: { flexDirection: "row", gap: 8, alignItems: "flex-start", paddingTop: 8 },
  flag: { color: colors.muted, fontSize: 11, fontWeight: "800", marginTop: 3, width: 46 },
  flagLive: { color: colors.primary },
});
