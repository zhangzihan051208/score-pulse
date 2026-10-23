import { Image, StyleSheet, Text, View } from "react-native";
import { portraits } from "../portraits";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const letters = (parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : name.slice(0, 2)).toUpperCase();
  return letters;
}

export function Avatar({
  name,
  photo,
  kitNumber,
  size = 48,
}: {
  name: string;
  photo?: string;
  kitNumber?: string;
  size?: number;
}) {
  const source = photo ? portraits[photo] : undefined;
  return (
    <View style={{ width: size, height: size }}>
      {source ? (
        <Image source={source} style={[styles.photo, { width: size, height: size, borderRadius: 14 }]} />
      ) : (
        <View style={[styles.fallback, { width: size, height: size, borderRadius: 14 }]}>
          <Text style={styles.letters}>{initials(name)}</Text>
        </View>
      )}
      {kitNumber ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{kitNumber}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { backgroundColor: "#141414" },
  fallback: { backgroundColor: "#141414", alignItems: "center", justifyContent: "center" },
  letters: { color: "#fff", fontWeight: "700", fontSize: 14 },
  badge: {
    position: "absolute",
    right: -4,
    bottom: -4,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: "#E4572E",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
