import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { PARTITIONS, clubsForPartition, type Partition } from "../favorites";
import { useLocale } from "../i18n";
import { useSession } from "../store";
import { colors, ui } from "../ui";

export function TeamPartitions() {
  const { locale, t } = useLocale();
  const session = useSession();
  const [open, setOpen] = useState<Record<string, boolean>>({});

  function isOpen(key: string) {
    if (key in open) return open[key];
    const pair = session.favorites[key];
    return Boolean(pair?.primary || pair?.secondary);
  }

  function toggle(key: string) {
    const next = !isOpen(key);
    setOpen((current) => ({ ...current, [key]: next }));
    if (!next) session.clearPartition(key);
  }

  return (
    <View style={{ gap: 10 }}>
      {PARTITIONS.map((partition) => (
        <PartitionCard
          key={partition.key}
          partition={partition}
          title={locale === "zh" ? partition.zh : partition.en}
          open={isOpen(partition.key)}
          onToggle={() => toggle(partition.key)}
          primaryId={session.favorites[partition.key]?.primary}
          secondaryId={session.favorites[partition.key]?.secondary}
          onPick={(slot, id) => session.setFavorite(partition.key, slot, id)}
          skipped={t.obLeagueSkipped}
          primary={t.primary}
          secondary={t.secondary}
        />
      ))}
    </View>
  );
}

function PartitionCard({
  partition,
  title,
  open,
  onToggle,
  primaryId,
  secondaryId,
  onPick,
  skipped,
  primary,
  secondary,
}: {
  partition: Partition;
  title: string;
  open: boolean;
  onToggle: () => void;
  primaryId?: string;
  secondaryId?: string;
  onPick: (slot: "primary" | "secondary", id?: string) => void;
  skipped: string;
  primary: string;
  secondary: string;
}) {
  const clubs = clubsForPartition(partition);
  return (
    <View style={ui.card}>
      <Pressable onPress={onToggle} style={styles.head} accessibilityRole="checkbox" accessibilityState={{ checked: open }}>
        <View style={[styles.box, open && styles.boxOn]}>
          {open ? <Text style={styles.tick}>✓</Text> : null}
        </View>
        <Text style={ui.title}>{title}</Text>
      </Pressable>
      {open ? (
        <View style={{ gap: 8 }}>
          {clubs.map((club) => {
            const isPrimary = primaryId === club.id;
            const isSecondary = secondaryId === club.id;
            return (
              <View key={club.id} style={styles.club}>
                <Text style={styles.clubName} numberOfLines={1}>
                  {club.name}
                </Text>
                <Pressable
                  onPress={() => onPick("primary", isPrimary ? undefined : club.id)}
                  style={[styles.slot, isPrimary && styles.slotOn]}
                >
                  <Text style={[styles.slotText, isPrimary && styles.slotTextOn]}>{primary}</Text>
                </Pressable>
                <Pressable
                  onPress={() => onPick("secondary", isSecondary ? undefined : club.id)}
                  style={[styles.slot, isSecondary && styles.slotOn]}
                >
                  <Text style={[styles.slotText, isSecondary && styles.slotTextOn]}>{secondary}</Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      ) : (
        <Text style={ui.muted}>{skipped}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#CDBBA8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  boxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  tick: { color: "#fff", fontSize: 13, fontWeight: "800" },
  club: { flexDirection: "row", alignItems: "center", gap: 8 },
  clubName: { flex: 1, color: colors.ink, fontSize: 14, fontWeight: "600" },
  slot: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: colors.chip,
  },
  slotOn: { backgroundColor: colors.primary },
  slotText: { color: colors.ink, fontSize: 12, fontWeight: "700" },
  slotTextOn: { color: "#fff" },
});
