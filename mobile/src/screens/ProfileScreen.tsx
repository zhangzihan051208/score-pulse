import { Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { ui } from "../ui";

export function ProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t, toggle } = useLocale();
  const session = useSession();
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{session.name || t.guest}</Text>
      {session.bio ? <Text style={ui.muted}>{session.bio}</Text> : null}
      <Text style={ui.muted}>
        {t.quota} {session.vip ? "VIP" : session.fullLeft()}
      </Text>
      <View style={{ gap: 8 }}>
        {(
          [
            [session.name ? t.signOut : t.signIn, "Login"],
            [t.myTeams, "MyTeams"],
            [t.vip, "Vip"],
            [t.history, "Feed"],
            [t.guide, "Guide"],
            [t.privacy, "Privacy"],
          ] as const
        ).map(([label, route]) => (
          <Pressable key={route + label} style={ui.card} onPress={() => navigation.navigate(route)}>
            <Text style={ui.title}>{label}</Text>
          </Pressable>
        ))}
        <Pressable style={ui.card} onPress={toggle}>
          <Text style={ui.title}>{t.language}</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
