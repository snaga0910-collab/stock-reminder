// F-05 定時通知。
// Vercel Cron から毎日1回呼ばれ、期日が近い品目があるときだけLINEに送る。
// 対象が0件のときは送信しない（無駄な通知で慣れてしまうのを防ぐ）。

import { getSupabase, type Item } from "@/lib/supabase";
import { isSoon } from "@/lib/due";
import { buildDueMessage, pushMessage } from "@/lib/line";

/** 外部から勝手に叩かれないよう、合言葉（CRON_SECRET）を確認する */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const to = process.env.LINE_USER_ID;
  if (!to) {
    return Response.json({ error: "LINE_USER_ID が設定されていません" }, { status: 500 });
  }

  const { data, error } = await getSupabase()
    .from("items")
    .select("*")
    .is("deleted_at", null);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const due = ((data ?? []) as Item[])
    .filter((item) => isSoon(item.last_purchased_at, item.cycle_days))
    // 急ぎ（超過しているもの）を上に並べる
    .sort((a, b) => a.last_purchased_at.localeCompare(b.last_purchased_at));

  if (due.length === 0) {
    return Response.json({ sent: false, due: 0, reason: "買うものはありません" });
  }

  await pushMessage(to, buildDueMessage(due));

  return Response.json({ sent: true, due: due.length, items: due.map((i) => i.name) });
}
