// F-10 LINEから「買った」を受け取る窓口。
// 通知のボタンを押すと、LINEがこのURLに知らせてくるので、購入日を記録して返事をする。

import { getSupabase, type Item } from "@/lib/supabase";
import { verifySignature, replyText, boughtReply } from "@/lib/line";
import { todayInJst, nextDueDate } from "@/lib/due";

type LineEvent = {
  type: string;
  replyToken?: string;
  postback?: { data?: string };
};

export async function POST(request: Request) {
  // 署名を確認し、LINE以外からの偽の通信を受け付けない
  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get("x-line-signature"))) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  let events: LineEvent[] = [];
  try {
    events = (JSON.parse(rawBody).events ?? []) as LineEvent[];
  } catch {
    return Response.json({ error: "Invalid body" }, { status: 400 });
  }

  for (const event of events) {
    if (event.type !== "postback") continue;

    const data = event.postback?.data ?? "";
    if (!data.startsWith("bought:")) continue;

    const id = data.slice("bought:".length);
    const today = todayInJst();

    const { data: updated, error } = await getSupabase()
      .from("items")
      .update({ last_purchased_at: today })
      .eq("id", id)
      .is("deleted_at", null)
      .select("name, cycle_days")
      .maybeSingle();

    if (!event.replyToken) continue;

    if (error || !updated) {
      await replyText(event.replyToken, "記録できませんでした。アプリから操作してください。");
      continue;
    }

    const item = updated as Pick<Item, "name" | "cycle_days">;
    await replyText(
      event.replyToken,
      boughtReply(item.name, nextDueDate(today, item.cycle_days)),
    );
  }

  // LINEには常に200を返す（失敗を返すと再送が繰り返されるため）
  return Response.json({ ok: true });
}
