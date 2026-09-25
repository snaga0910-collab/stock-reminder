"use server";

// 画面からの操作。クライアント側でfetchを書かず、フォーム送信からサーバー側で直接DBを更新する。

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
      last_purchased_at: todayInJst(),
    }));

  if (rows.length > 0) {
    const { error } = await getSupabase().from("items").insert(rows);
    if (error) throw new Error(`品目の登録に失敗しました: ${error.message}`);
  }

  revalidatePath("/");
  redirect("/");
}

/** F-06/F-07 自分で入力して品目を登録する（名前・周期・購入場所メモ） */
export async function addCustomItem(formData: FormData) {
  await requireAuth();

  const name = String(formData.get("name") ?? "").trim();
  const cycleDays = Number(formData.get("cycle_days"));
  const place = String(formData.get("place") ?? "").trim();

  if (!name) redirect("/add?error=name");
  if (!Number.isInteger(cycleDays) || cycleDays < 1 || cycleDays > 3650) {
    redirect("/add?error=cycle");
  }

  const { error } = await getSupabase().from("items").insert({
    name,
    cycle_days: cycleDays,
    place: place || null,
    last_purchased_at: todayInJst(),
  });
  if (error) throw new Error(`品目の登録に失敗しました: ${error.message}`);

  revalidatePath("/");
  redirect("/");
}

/** F-09 登録済みの品目を編集する */
export async function updateItem(formData: FormData) {
  await requireAuth();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const cycleDays = Number(formData.get("cycle_days"));
  const place = String(formData.get("place") ?? "").trim();
  const lastPurchasedAt = String(formData.get("last_purchased_at") ?? "").trim();

  if (!id) return;
  if (!name) redirect(`/edit/${id}?error=name`);
  if (!Number.isInteger(cycleDays) || cycleDays < 1 || cycleDays > 3650) {
    redirect(`/edit/${id}?error=cycle`);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lastPurchasedAt)) {
    redirect(`/edit/${id}?error=date`);
  }

  const { error } = await getSupabase()
    .from("items")
    .update({
      name,
      cycle_days: cycleDays,
      place: place || null,
      last_purchased_at: lastPurchasedAt,
    })
    .eq("id", id);
  if (error) throw new Error(`更新に失敗しました: ${error.message}`);

  revalidatePath("/");
  redirect("/?saved=1");
}

/** F-02 「買った」を1タップで記録する */
export async function markPurchased(formData: FormData) {
  await requireAuth();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data, error } = await getSupabase()
    .from("items")
    .update({ last_purchased_at: todayInJst() })
    .eq("id", id)
    .select("name")
    .single();

  if (error) throw new Error(`記録に失敗しました: ${error.message}`);

  revalidatePath("/");
  redirect(`/?done=${encodeURIComponent(data?.name ?? "")}`);
}

/** F-08 削除（論理削除。あとから元に戻せる） */
export async function removeItem(formData: FormData) {
  await requireAuth();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { data, error } = await getSupabase()
    .from("items")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .select("name")
    .single();

  if (error) throw new Error(`削除に失敗しました: ${error.message}`);

  revalidatePath("/");
  redirect(`/?undo=${id}&name=${encodeURIComponent(data?.name ?? "")}`);
}

/** F-08 削除の取り消し */
export async function restoreItem(formData: FormData) {
  await requireAuth();

  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { error } = await getSupabase()
    .from("items")
    .update({ deleted_at: null })
    .eq("id", id);

  if (error) throw new Error(`元に戻せませんでした: ${error.message}`);

  revalidatePath("/");
  redirect("/");
}
