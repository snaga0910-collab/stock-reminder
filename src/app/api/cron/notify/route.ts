// F-05 定時通知。
// Vercel Cron から毎日1回呼ばれ、期日が近い品目があるときだけLINEに送る。
// 対象が0件のときは送信しない（無駄な通知で慣れてしまうのを防ぐ）。

import { getSupabase, type Item } from "@/lib/supabase";
import { isSoon, daysSince, daysLeft } from "@/lib/due";

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";

/** 外部から勝手に叩かれないよう、合言葉（CRON_SECRET）を確認する */
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

function buildMessage(items: Item[]): string {
  const lines = items.map((item) => {
    const left = daysLeft(item.last_purchased_at, item.cycle_days);
    const when = left < 0 ? `${-left}日超過` : left === 0 ? "今日まで" : `あと${left}日`;
    return `・${item.name}（${when} / 前回から${daysSince(item.last_purchased_at)}日）`;
  });

  return [`🛒 そろそろ買うもの（${items.length}件）`, "", ...lines].join("\n");
}

async function pushToLine(text: string): Promise<void> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  const to = process.env.LINE_USER_ID;

  if (!token || !to) {
    throw new Error("LINEの設定がありません（LINE_CHANNEL_ACCESS_TOKEN / LINE_USER_ID）");
  }

  const res = await fetch(LINE_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to, messages: [{ type: "text", text }] }),
  });

  if (!res.ok) {
    throw new Error(`LINEへの送信に失敗しました (${res.status}): ${await res.text()}`);
  }
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await getSupabase().from("items").select("*");
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  const due = ((data ?? []) as Item[]).filter((item) =>
    isSoon(item.last_purchased_at, item.cycle_days),
  );

  if (due.length === 0) {
    return Response.json({ sent: false, due: 0, reason: "買うものはありません" });
  }

  await pushToLine(buildMessage(due));

  return Response.json({ sent: true, due: due.length, items: due.map((i) => i.name) });
}
