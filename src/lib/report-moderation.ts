import { moderateWithAi } from "@/lib/ai-moderation";
import { moderateUserContent } from "@/lib/content-moderation";
import { createServiceClient } from "@/lib/supabase/server";

/** Hide a reported comment when rules or the model reject it. Leave the report open if the model cannot be reached. */
export async function settleReport(input: {
  reportId: string;
  commentId: string | null;
  excerpt: string | null;
}): Promise<void> {
  const admin = createServiceClient();
  if (!admin) return;

  let text = input.excerpt?.trim() ?? "";
  if (input.commentId) {
    const { data } = await admin
      .from("comments")
      .select("body")
      .eq("id", input.commentId)
      .maybeSingle();
    const body = typeof data?.body === "string" ? data.body.trim() : "";
    if (body && body !== "—") text = body;
  }
  if (!text) return;

  const local = moderateUserContent(text);
  let block = !local.pass;
  if (!block) {
    const ai = await moderateWithAi(text);
    if (!ai) return;
    block = !ai.pass;
  }

  if (block) {
    if (input.commentId) {
      await admin
        .from("comments")
        .update({ hidden: true, moderation_status: "rejected" })
        .eq("id", input.commentId);
    }
    await admin.from("reports").update({ status: "hidden" }).eq("id", input.reportId);
    return;
  }

  await admin.from("reports").update({ status: "dismissed" }).eq("id", input.reportId);
}
