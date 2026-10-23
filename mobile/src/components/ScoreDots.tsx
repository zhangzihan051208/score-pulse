import { Pressable, StyleSheet, Text, View } from "react-native";

export function ScoreDots({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  return (
    <View style={styles.row}>
      {Array.from({ length: 10 }, (_, index) => index + 1).map((mark) => (
        <Pressable
          key={mark}
          onPress={() => onChange(mark)}
          style={[styles.dot, mark <= value && styles.on]}
          accessibilityLabel={String(mark)}
        >
          <Text style={[styles.num, mark <= value && styles.numOn]}>{mark}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 3 },
  dot: {
    flex: 1,
    minHeight: 28,
    borderRadius: 6,
    backgroundColor: "#EFE6DA",
    alignItems: "center",
    justifyContent: "center",
  },
  on: { backgroundColor: "#E4572E" },
  num: { fontSize: 10, color: "#7A6A5A", fontWeight: "700" },
  numOn: { color: "#fff" },
});
