"use server";

// 画面からの操作（品目の追加／「買った」記録）。
// クライアント側でfetchを書かず、フォーム送信からサーバー側で直接DBを更新する。

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getSupabase } from "@/lib/supabase";
import { PRESETS } from "@/lib/presets";
import { todayInJst } from "@/lib/due";

/** F-01 プリセットから品目を登録する */
export async function addItems(formData: FormData) {
  await requireAuth();

  const names = formData.getAll("name").map(String);
  const rows = names
    .map((name) => PRESETS.find((p) => p.name === name))
    .filter((p): p is (typeof PRESETS)[number] => Boolean(p))
    .map((p) => ({
      name: p.name,
      cycle_days: p.cycleDays,
      place: p.place,
      // 登録した日を「最後に買った日」の起点にする
      last_purchased_at: todayInJst(),
    }));

  if (rows.length > 0) {
    const { error } = await getSupabase().from("items").insert(rows);
    if (error) {
      throw new Error(`品目の登録に失敗しました: ${error.message}`);
    }
  }

  revalidatePath("/");
  redirect("/");
}

/** F-02 「買った」を1タップで記録する */
export async function markPurchased(formData: FormData) {
  await requireAuth();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await getSupabase()
    .from("items")
    .update({ last_purchased_at: todayInJst() })
    .eq("id", id);

  if (error) {
    throw new Error(`記録に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
}

/** 登録した品目を消す */
export async function removeItem(formData: FormData) {
  await requireAuth();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await getSupabase().from("items").delete().eq("id", id);
  if (error) {
    throw new Error(`削除に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
}
