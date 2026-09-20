// 合言葉（パスコード）による簡易的な入室管理。
// 公開URLは誰でも開けるため、合言葉を知らない人が使えないようにする。
// 合言葉そのものはクッキーに入れず、ハッシュ（不可逆の変換値）だけを入れる。

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHash } from "crypto";

const COOKIE_NAME = "sr_auth";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180日

function expectedToken(): string {
  const passcode = process.env.APP_PASSCODE;
  if (!passcode) {
    throw new Error(
      "APP_PASSCODE が設定されていません。.env.local に合言葉を入力してください。",
    );
  }
  return createHash("sha256").update(passcode).digest("hex");
}

/** 入室済みか */
export async function isAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value === expectedToken();
}

/** 入室していなければ合言葉の画面に飛ばす */
export async function requireAuth(): Promise<void> {
  if (!(await isAuthed())) {
    redirect("/login");
  }
}

/** 合言葉が合っていればクッキーを発行する */
export async function signIn(passcode: string): Promise<boolean> {
  if (passcode !== process.env.APP_PASSCODE) {
    return false;
  }
  const store = await cookies();
  store.set(COOKIE_NAME, expectedToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return true;
}
