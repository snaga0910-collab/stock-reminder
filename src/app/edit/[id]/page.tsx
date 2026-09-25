import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/auth";
import { getSupabase, type Item } from "@/lib/supabase";
import { SubmitButton } from "@/components/submit-button";
import { updateItem } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAuth();
  const { id } = await params;
  const { error } = await searchParams;

  const { data } = await getSupabase()
    .from("items")
    .select("*")
    .eq("id", id)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) notFound();
  const item = data as Item;

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 py-8">
      <header>
        <Link href="/" className="text-sm text-sky-600 hover:underline dark:text-sky-400">
          ← もどる
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">品目を編集</h1>
      </header>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
          {error === "name"
            ? "品目名を入力してください"
            : error === "date"
              ? "日付の形式が正しくありません"
              : "買う間隔は1〜3650日の数字で入力してください"}
        </p>
      )}

      <form action={updateItem} className="flex flex-col gap-3">
        <input type="hidden" name="id" value={item.id} />

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-600 dark:text-slate-300">品目名</span>
          <input
            type="text"
            name="name"
            required
            maxLength={40}
            defaultValue={item.name}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-600 dark:text-slate-300">買う間隔（日）</span>
          <input
            type="number"
            name="cycle_days"
            required
            min={1}
            max={3650}
            defaultValue={item.cycle_days}
            inputMode="numeric"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <span className="text-xs text-slate-400">
            減りが早い・遅いと感じたら、ここで調整できます
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-600 dark:text-slate-300">どこで買う？（任意）</span>
          <input
            type="text"
            name="place"
            maxLength={60}
            defaultValue={item.place ?? ""}
            placeholder="例：ドンキが安い、イオンが大容量"
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm text-slate-600 dark:text-slate-300">最後に買った日</span>
          <input
            type="date"
            name="last_purchased_at"
            required
            defaultValue={item.last_purchased_at}
            className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          />
          <span className="text-xs text-slate-400">
            登録前に買っていた場合は、その日に直すと予定日が正しくなります
          </span>
        </label>

        <SubmitButton
          pendingLabel="保存中…"
          className="rounded-xl bg-sky-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
        >
          保存する
        </SubmitButton>
      </form>
    </main>
  );
}
