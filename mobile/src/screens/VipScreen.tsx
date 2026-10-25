import { useState } from "react";
import { Pressable, ScrollView, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { billingKind, buyMonthly, restoreMonthly } from "../billing";
import { useLocale } from "../i18n";
import type { RootStackParamList } from "../navigation";
import { useSession } from "../store";
import { ui } from "../ui";

function noteFor(code: string, t: ReturnType<typeof useLocale>["t"]) {
  if (code === "stripe_not_configured") return t.vipStripeMissing;
  if (code === "google_not_configured") return t.vipGoogleMissing;
  if (code === "vip_until_missing") return t.vipSchemaMissing;
  if (code === "canceled") return t.vipCanceled;
  if (code === "sign_in") return t.vipNeedSignIn;
  if (code === "store_unavailable" || code === "wrong_product") return t.vipStoreMissing;
  if (code === "none") return t.vipNone;
  return t.vipBuyFailed;
}

export function VipScreen() {
  const { t } = useLocale();
  const session = useSession();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function buy() {
    if (!session.accessToken) {
      navigation.navigate("Login");
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const code = await buyMonthly(session.accessToken);
      if (code === "redirect") return;
      if (!code) {
        session.setVip(true);
        setNote(t.vipActive);
      } else setNote(noteFor(code, t));
    } catch {
      setNote(t.vipBuyFailed);
    } finally {
      setBusy(false);
    }
  }

  async function restore() {
    if (!session.accessToken) {
      navigation.navigate("Login");
      return;
    }
    setBusy(true);
    setNote(null);
    try {
      const code = await restoreMonthly(session.accessToken);
      if (!code) {
        session.setVip(true);
        setNote(t.vipActive);
      } else setNote(noteFor(code, t));
    } catch {
      setNote(t.vipBuyFailed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={ui.page} contentContainerStyle={ui.content}>
      <Text style={ui.h1}>{t.vip}</Text>
      <Text style={ui.muted}>{t.vipLead}</Text>
      <Text style={ui.title}>{t.vipPrice}</Text>
      <Text style={ui.title}>
        {t.quota} {session.vip ? "VIP" : session.fullLeft()}
      </Text>
      {session.vip ? <Text style={ui.muted}>{t.vipActive}</Text> : null}
      {billingKind === "store" ? (
        <>
          <Text style={ui.muted}>App Store · com.grandstand.tribune.vip.monthly</Text>
          <Text style={ui.muted}>Google Play · grandstand_vip_monthly</Text>
        </>
      ) : null}
      {session.vip ? null : (
        <Pressable style={ui.primaryBtn} disabled={busy} onPress={() => void buy()}>
          <Text style={ui.primaryBtnText}>{busy ? t.vipBuying : t.vipBuy}</Text>
        </Pressable>
      )}
      {billingKind === "store" ? (
        <Pressable style={ui.outlineBtn} disabled={busy} onPress={() => void restore()}>
          <Text style={ui.outlineBtnText}>{busy ? t.vipRestoring : t.vipRestore}</Text>
        </Pressable>
      ) : null}
      {note ? <Text style={ui.muted}>{note}</Text> : null}
    </ScrollView>
  );
}
