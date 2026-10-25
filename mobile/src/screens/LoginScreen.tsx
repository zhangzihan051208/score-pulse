import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { colors, ui } from "../ui";

export function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Login">) {
  const { t } = useLocale();
  const session = useSession();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState(session.email ?? "");
  const [password, setPassword] = useState("");
  const [name, setName] = useState(session.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(null);
    const result =
      mode === "signUp"
        ? await session.signUpCloud(email.trim(), password, name.trim())
        : await session.signInCloud(email.trim(), password);
    setBusy(false);
    if (result === "confirm") {
      setError(t.checkEmail);
      return;
    }
    if (result !== "ok") {
      setError(result);
      return;
    }
    if (!session.onboarded && mode === "signUp") navigation.replace("Onboarding");
    else navigation.goBack();
  }

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{mode === "signUp" ? t.createAccount : t.signIn}</Text>
      <Text style={ui.muted}>{t.cloudLead}</Text>
      {mode === "signUp" ? (
        <TextInput value={name} onChangeText={setName} placeholder={t.namePh} placeholderTextColor="#A89886" style={ui.input} />
      ) : null}
      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder={t.emailPh}
        placeholderTextColor="#A89886"
        autoCapitalize="none"
        keyboardType="email-address"
        style={ui.input}
      />
      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder={t.passwordPh}
        placeholderTextColor="#A89886"
        secureTextEntry
        style={ui.input}
      />
      <Pressable style={ui.primaryBtn} disabled={busy} onPress={() => void submit()}>
        <Text style={ui.primaryBtnText}>{busy ? "…" : mode === "signUp" ? t.createAccount : t.signIn}</Text>
      </Pressable>
      {error ? <Text style={{ color: colors.primary }}>{error}</Text> : null}
      <Pressable onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}>
        <Text style={ui.muted}>{mode === "signIn" ? t.needAccount : t.haveAccount}</Text>
      </Pressable>
      {session.email ? (
        <Pressable
          onPress={() => {
            session.signOut();
            navigation.goBack();
          }}
        >
          <Text style={ui.muted}>{t.signOut}</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}
