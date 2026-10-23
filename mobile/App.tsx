import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { AdSlot } from "./src/components/AdSlot";
import { LocaleProvider, useLocale } from "./src/i18n";
import type { RootStackParamList, TabParamList } from "./src/navigation";
import { BoardsScreen } from "./src/screens/BoardsScreen";
import { EventScreen } from "./src/screens/EventScreen";
import { FeedScreen } from "./src/screens/FeedScreen";
import { GuideScreen } from "./src/screens/GuideScreen";
import { HomeScreen } from "./src/screens/HomeScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
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
import { colors } from "./src/ui";

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

function AppHeader() {
  const { t, toggle } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <View style={styles.topRow}>
        <View style={styles.brand}>
          <Image source={require("./assets/brand-mark.jpg")} style={styles.mark} />
          <Text style={styles.brandText}>{t.brand}</Text>
        </View>
        <View style={styles.tools}>
          <Pressable onPress={() => navigation.navigate("Guide")} hitSlop={8}>
            <Text style={styles.tool}>{t.guide}</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Feed")} hitSlop={8}>
            <Text style={styles.tool}>{t.feed}</Text>
          </Pressable>
          <Pressable onPress={toggle} style={styles.lang}>
            <Text style={styles.langText}>{t.language}</Text>
          </Pressable>
        </View>
      </View>
      <Pressable style={styles.search} onPress={() => navigation.navigate("Search", {})} accessibilityRole="search">
        <Text style={styles.searchIcon}>⌕</Text>
        <Text style={styles.searchText}>{t.searchPh}</Text>
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
        header: () => <AppHeader />,
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
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false, gestureEnabled: false }} />
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
      <StatusBar style="light" />
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
  header: { backgroundColor: colors.header, paddingHorizontal: 14, paddingBottom: 12, gap: 10 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  brand: { flexDirection: "row", alignItems: "center", gap: 8 },
  mark: { width: 26, height: 26, borderRadius: 7 },
  brandText: { color: "#fff", fontWeight: "800", fontSize: 18, letterSpacing: 1 },
  tools: { flexDirection: "row", alignItems: "center", gap: 12 },
  tool: { color: "#fff", fontWeight: "700", fontSize: 14 },
  lang: { backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  langText: { color: "#000", fontWeight: "700", fontSize: 12 },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFCF7",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchIcon: { color: "#7A6A5A", fontSize: 16, fontWeight: "700" },
  searchText: { color: "#7A6A5A", fontSize: 14 },
});
