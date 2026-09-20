// Supabaseクライアント（サーバー専用）。
// RLSは有効かつポリシー無しにしてあるため、読み書きは秘密キーを持つサーバー側からのみ行う。
// このファイルをクライアントコンポーネントから import しないこと（秘密キーが漏れるため）。

import { createClient } from "@supabase/supabase-js";

export type Item = {
  id: string;
  name: string;
  cycle_days: number;
  place: string | null;
  last_purchased_at: string; // "YYYY-MM-DD"
  created_at: string;
};

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;

  if (!url || !key) {
    throw new Error(
      "Supabaseの設定がありません。.env.local の NEXT_PUBLIC_SUPABASE_URL と SUPABASE_SECRET_KEY を確認してください。",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
