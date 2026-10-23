import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AdSlot } from "./src/components/AdSlot";
import { LocaleProvider, useLocale } from "./src/i18n";
import type { RootStackParamList, TabParamList } from "./src/navigation";
import { BoardsScreen } from "./src/screens/BoardsScreen";
import { EventScreen } from "./src/screens/EventScreen";
import { FeedScreen } from "./src/screens/FeedScreen";
import { GuideScreen } from "./src/screens/GuideScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { MatchupScreen } from "./src/screens/MatchupScreen";
import { MyTeamsScreen } from "./src/screens/MyTeamsScreen";
import { PlayerScreen } from "./src/screens/PlayerScreen";
import { PrivacyScreen } from "./src/screens/PrivacyScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { RankingsScreen } from "./src/screens/RankingsScreen";
import { RateScreen } from "./src/screens/RateScreen";
import { SearchScreen } from "./src/screens/SearchScreen";
import { TeamScreen } from "./src/screens/TeamScreen";
import { VipScreen } from "./src/screens/VipScreen";
import { ZoneCreateScreen } from "./src/screens/ZoneCreateScreen";
import { ZoneItemScreen } from "./src/screens/ZoneItemScreen";
import { ZoneScreen } from "./src/screens/ZoneScreen";
import { ZonesScreen } from "./src/screens/ZonesScreen";
import { SessionProvider } from "./src/store";

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#F6F1E8",
    card: "#12110F",
    text: "#FFFFFF",
    primary: "#E4572E",
    border: "#12110F",
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: "#12110F" },
  headerTintColor: "#fff",
  headerTitleStyle: { fontWeight: "700" as const },
  contentStyle: { backgroundColor: "#F6F1E8" },
};

function HeaderTools() {
  const { t, toggle } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <View style={styles.tools}>
      <Pressable onPress={() => navigation.navigate("Search", {})}>
        <Text style={styles.tool}>{t.find}</Text>
      </Pressable>
      <Pressable onPress={toggle} style={styles.lang}>
        <Text style={styles.langText}>{t.language}</Text>
      </Pressable>
    </View>
  );
}

function Tabs() {
  const { t } = useLocale();
  return (
    <Tab.Navigator
      safeAreaInsets={{ bottom: 0 }}
      screenOptions={{
        ...screenOptions,
        headerRight: () => <HeaderTools />,
        tabBarIcon: () => null,
        tabBarIconStyle: { display: "none" },
        tabBarStyle: { backgroundColor: "#12110F", borderTopColor: "#12110F" },
        tabBarActiveTintColor: "#E4572E",
        tabBarInactiveTintColor: "rgba(255,255,255,0.55)",
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t.brand, tabBarLabel: t.navHome }} />
      <Tab.Screen name="Boards" component={BoardsScreen} options={{ title: t.rankings, tabBarLabel: t.rankings }} />
      <Tab.Screen name="Zones" component={ZonesScreen} options={{ title: t.zones, tabBarLabel: t.zones }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t.profile, tabBarLabel: t.profile }} />
    </Tab.Navigator>
  );
}

function Root() {
  const { t } = useLocale();
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={screenOptions}>
        <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
        <Stack.Screen name="Rankings" component={RankingsScreen} options={{ title: t.rankings }} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{ title: "" }} />
        <Stack.Screen name="Team" component={TeamScreen} options={{ title: "" }} />
        <Stack.Screen name="Event" component={EventScreen} options={{ title: t.fixtures }} />
        <Stack.Screen name="Rate" component={RateScreen} options={{ title: t.rate }} />
        <Stack.Screen name="Matchup" component={MatchupScreen} options={{ title: t.compare }} />
        <Stack.Screen name="Search" component={SearchScreen} options={{ title: t.find }} />
        <Stack.Screen name="Zone" component={ZoneScreen} options={{ title: t.zones }} />
        <Stack.Screen name="ZoneCreate" component={ZoneCreateScreen} options={{ title: t.createZone }} />
        <Stack.Screen name="ZoneItem" component={ZoneItemScreen} options={{ title: t.rate }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: t.signIn }} />
        <Stack.Screen name="Vip" component={VipScreen} options={{ title: t.vip }} />
        <Stack.Screen name="MyTeams" component={MyTeamsScreen} options={{ title: t.myTeams }} />
        <Stack.Screen name="Guide" component={GuideScreen} options={{ title: t.guide }} />
        <Stack.Screen name="Feed" component={FeedScreen} options={{ title: t.feed }} />
        <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: t.privacy }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <View style={styles.frame}>
        <View style={styles.column}>
          <LocaleProvider>
            <SessionProvider>
              <View style={styles.column}>
                <Root />
                <AdSlot dock />
              </View>
            </SessionProvider>
          </LocaleProvider>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#E7DDD0", alignItems: "center" },
  column: { flex: 1, width: "100%", maxWidth: 480 },
  tools: { flexDirection: "row", alignItems: "center", gap: 8, marginRight: 12 },
  tool: { color: "#fff", fontWeight: "700", fontSize: 13 },
  lang: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  langText: { color: "#000", fontWeight: "700", fontSize: 12 },
});
