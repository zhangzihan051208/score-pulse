import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { ui } from "../ui";

export function LoginScreen({ navigation }: NativeStackScreenProps<RootStackParamList, "Login">) {
  const { t } = useLocale();
  const session = useSession();
  const [name, setName] = useState(session.name ?? "");
  const [bio, setBio] = useState(session.bio);
  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.signIn}</Text>
      <Text style={ui.muted}>{t.saved}</Text>
      <TextInput value={name} onChangeText={setName} placeholder={t.namePh} placeholderTextColor="#A89886" style={ui.input} />
      <TextInput value={bio} onChangeText={setBio} placeholder={t.bioPh} placeholderTextColor="#A89886" style={ui.input} />
      <Pressable
        style={ui.primaryBtn}
        onPress={() => {
          session.signIn(name, bio);
          navigation.goBack();
        }}
      >
        <Text style={ui.primaryBtnText}>{t.signIn}</Text>
      </Pressable>
      {session.name ? (
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
