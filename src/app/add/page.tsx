import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getSupabase, type Item } from "@/lib/supabase";
import { PRESETS } from "@/lib/presets";
import { SubmitButton } from "@/components/submit-button";
import { addItems, addCustomItem } from "../actions";

export const dynamic = "force-dynamic";

export default async function AddPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAuth();
  const { error } = await searchParams;

  const { data } = await getSupabase().from("items").select("name").is("deleted_at", null);
  const registered = new Set(((data ?? []) as Pick<Item, "name">[]).map((r) => r.name));
  const selectable = PRESETS.filter((p) => !registered.has(p.name));

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-8">
      <header>
        <Link href="/" className="text-sm text-sky-600 hover:underline dark:text-sky-400">
          ← もどる
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">品目を追加</h1>
      </header>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
          {error === "name"
            ? "品目名を入力してください"
            : "買う間隔は1〜3650日の数字で入力してください"}
        </p>
      )}

      {/* 自分で入力して追加（F-06 / F-07） */}
      <section className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">自分で入力する</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          一覧にないものは、ここから登録できます
        </p>

        <form action={addCustomItem} className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600 dark:text-slate-300">品目名</span>
            <input
              type="text"
              name="name"
              required
              maxLength={40}
              placeholder="例：猫砂、コンタクト、プロテイン"
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
              defaultValue={30}
              inputMode="numeric"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <span className="text-xs text-slate-400">
              だいたいで大丈夫です。あとから変えられます
            </span>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600 dark:text-slate-300">
              どこで買う？（任意）
            </span>
            <input
              type="text"
              name="place"
              maxLength={60}
              placeholder="例：ドンキが安い、楽天市場が安い"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <span className="text-xs text-slate-400">
              通知にも表示されるので、買う場所の判断に使えます
            </span>
          </label>

          <SubmitButton
            pendingLabel="登録中…"
            className="rounded-xl bg-sky-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
          >
            この内容で追加する
          </SubmitButton>
        </form>
      </section>

      {/* プリセットから選ぶ（F-01） */}
      {selectable.length > 0 && (
        <section>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">
            よくあるものから選ぶ
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            買う間隔は自動で入ります
          </p>

          <form action={addItems} className="mt-3 flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
              {selectable.map((p) => (
                <li key={p.name}>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800">
                    <input
                      type="checkbox"
                      name="name"
                      value={p.name}
                      className="h-5 w-5 shrink-0 accent-sky-600"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-slate-800 dark:text-slate-200">
                        {p.name}
                      </span>
                      <span className="block text-xs text-slate-400">
                        約{p.cycleDays}日ごと ・ {p.place}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>

            <SubmitButton
              pendingLabel="追加中…"
              className="rounded-xl border border-sky-600 px-5 py-3 font-medium text-sky-700 transition hover:bg-sky-50 active:scale-95 dark:text-sky-300 dark:hover:bg-slate-800"
            >
              選んだものを追加する
            </SubmitButton>
          </form>
        </section>
      )}

      <p className="text-center text-xs text-slate-400">
        追加した日を「最後に買った日」として数え始めます
      </p>
    </main>
  );
}
