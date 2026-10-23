import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { LocaleProvider, useLocale } from "./src/i18n";
import type { RootStackParamList } from "./src/navigation";
import { HomeScreen } from "./src/screens/HomeScreen";
import { PlayerScreen } from "./src/screens/PlayerScreen";
import { PrivacyScreen } from "./src/screens/PrivacyScreen";
import { RankingsScreen } from "./src/screens/RankingsScreen";
import { TeamScreen } from "./src/screens/TeamScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

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

function Root() {
  const { t } = useLocale();
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: "#12110F" },
          headerTintColor: "#fff",
          headerTitleStyle: { fontWeight: "700" },
          contentStyle: { backgroundColor: "#F6F1E8" },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: t.brand }} />
        <Stack.Screen name="Rankings" component={RankingsScreen} options={{ title: t.rankings }} />
        <Stack.Screen name="Player" component={PlayerScreen} options={{ title: "" }} />
        <Stack.Screen name="Team" component={TeamScreen} options={{ title: "" }} />
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
            <Root />
          </LocaleProvider>
        </View>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: "#E7DDD0", alignItems: "center" },
  column: { flex: 1, width: "100%", maxWidth: 480 },
});
