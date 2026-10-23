import { StyleSheet, Text, View } from "react-native";
import Svg, { Polygon, Line, Circle } from "react-native-svg";

export function Radar({
  labels,
  values,
}: {
  labels: string[];
  values: number[];
}) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 78;
  const count = Math.max(labels.length, 1);

  function at(index: number, unit: number) {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
    return [cx + unit * radius * Math.cos(angle), cy + unit * radius * Math.sin(angle)];
  }

  const rings = [0.35, 0.7, 1];
  const data = values
    .map((value, index) => at(index, Math.max(0, Math.min(value, 10)) / 10).join(","))
    .join(" ");

  return (
    <View style={styles.wrap}>
      <Svg width={size} height={size}>
        {rings.map((ring) => (
          <Polygon
            key={ring}
            points={labels.map((_, index) => at(index, ring).join(",")).join(" ")}
            fill="none"
            stroke="#E6D9C8"
            strokeWidth={1}
          />
        ))}
        {labels.map((_, index) => {
          const [x, y] = at(index, 1);
          return <Line key={index} x1={cx} y1={cy} x2={x} y2={y} stroke="#E6D9C8" strokeWidth={1} />;
        })}
        <Polygon points={data} fill="rgba(228,87,46,0.22)" stroke="#E4572E" strokeWidth={2} />
        {values.map((value, index) => {
          const [x, y] = at(index, Math.max(0, Math.min(value, 10)) / 10);
          return <Circle key={index} cx={x} cy={y} r={3} fill="#E4572E" />;
        })}
      </Svg>
      <View style={styles.rows}>
        {labels.map((label, index) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label} numberOfLines={1}>
              {label}
            </Text>
            <Text style={styles.value}>{(values[index] ?? 0).toFixed(1)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 8 },
  rows: { alignSelf: "stretch", gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  label: { flex: 1, color: "#7A6A5A", fontSize: 13 },
  value: { color: "#2A2118", fontWeight: "700", fontVariant: ["tabular-nums"] },
});
