// LINEとのやり取りをまとめたところ。
// 送信（Push / Reply）と、LINEから届いた通信が本物かの検証を扱う。

import { createHmac, timingSafeEqual } from "crypto";
import type { Item } from "./supabase";
import { daysLeft, daysSince, nextDueDate, formatJpDate } from "./due";

const PUSH_URL = "https://api.line.me/v2/bot/message/push";
const REPLY_URL = "https://api.line.me/v2/bot/message/reply";

function token(): string {
  const t = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!t) throw new Error("LINE_CHANNEL_ACCESS_TOKEN が設定されていません");
  return t;
}

/**
 * LINEから届いた通信が本物かを確認する。
 * チャネルシークレットで署名を作り直し、送られてきた署名と一致するか比べる。
 */
export function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  // 長さが違うと比較関数が例外になるため先に確認する
  return a.length === b.length && timingSafeEqual(a, b);
}

/** 「そろそろ買うもの」を、その場で「買った」と押せるボタン付きで組み立てる */
export function buildDueMessage(items: Item[]) {
  const rows = items.map((item) => {
    const left = daysLeft(item.last_purchased_at, item.cycle_days);
    const when = left < 0 ? `${-left}日超過` : left === 0 ? "今日まで" : `あと${left}日`;
    const due = formatJpDate(nextDueDate(item.last_purchased_at, item.cycle_days));
    const meta = [`${when}（${due}）`, item.place].filter(Boolean).join(" ・ ");

    return {
      type: "box",
      layout: "horizontal",
      alignItems: "center",
      spacing: "sm",
      margin: "md",
      contents: [
        {
          type: "box",
          layout: "vertical",
          flex: 5,
          contents: [
            { type: "text", text: item.name, size: "sm", weight: "bold", wrap: true },
            { type: "text", text: meta, size: "xxs", color: "#94a3b8", wrap: true },
          ],
        },
        {
          type: "button",
          style: "primary",
          color: "#e11d48",
          height: "sm",
          flex: 3,
          action: {
            type: "postback",
            label: "買った",
            data: `bought:${item.id}`,
            displayText: `${item.name} を買った`,
          },
        },
      ],
    };
  });

  return {
    type: "flex",
    altText: `🛒 そろそろ買うもの（${items.length}件）`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#0284c7",
        paddingAll: "md",
        contents: [
          {
            type: "text",
            text: `🛒 そろそろ買うもの（${items.length}件）`,
            color: "#ffffff",
            weight: "bold",
            size: "sm",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "md",
        contents: [
          {
            type: "text",
            text: "買ったら、そのままボタンを押してください",
            size: "xxs",
            color: "#94a3b8",
            wrap: true,
          },
          ...rows,
        ],
      },
    },
  };
}

/** 指定した相手にメッセージを送る（定時通知） */
export async function pushMessage(to: string, message: unknown): Promise<void> {
  const res = await fetch(PUSH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ to, messages: [message] }),
  });
  if (!res.ok) {
    throw new Error(`LINEへの送信に失敗しました (${res.status}): ${await res.text()}`);
  }
}

/** 受け取った操作に対して返事をする */
export async function replyText(replyToken: string, text: string): Promise<void> {
  const res = await fetch(REPLY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
    body: JSON.stringify({ replyToken, messages: [{ type: "text", text }] }),
  });
  if (!res.ok) {
    // 返事に失敗しても記録自体は済んでいるため、処理は止めずに記録だけ残す
    console.error(`LINEへの返信に失敗 (${res.status}): ${await res.text()}`);
  }
}

/** 買った直後の返事の文面 */
export function boughtReply(name: string, nextDue: string): string {
  return `✅ 「${name}」を買ったことを記録しました。\n次の予定日は ${formatJpDate(nextDue)} です。`;
}

export { daysSince };
