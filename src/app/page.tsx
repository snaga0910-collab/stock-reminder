import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getSupabase, type Item } from "@/lib/supabase";
import { daysLeft, isSoon, LEAD_DAYS } from "@/lib/due";
import { markPurchased, removeItem } from "./actions";

// 常に最新のデータを表示する（キャッシュされた古い一覧を見せない）
export const dynamic = "force-dynamic";

export default async function Home() {
  await requireAuth();

  const { data, error } = await getSupabase()
    .from("items")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-10">
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          データの読み込みに失敗しました: {error.message}
        </p>
      </main>
    );
  }

  const items = (data ?? []) as Item[];
  const withDays = items
    .map((item) => ({ item, left: daysLeft(item.last_purchased_at, item.cycle_days) }))
    .sort((a, b) => a.left - b.left);

  const soon = withDays.filter(({ item }) => isSoon(item.last_purchased_at, item.cycle_days));
  const later = withDays.filter(({ item }) => !isSoon(item.last_purchased_at, item.cycle_days));

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-5 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          🛒 そろそろリマインダー
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          買ったら1タップ。期日が近づくとLINEに届きます
        </p>
      </header>

      {items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 py-12 text-center dark:border-slate-800">
          <p className="text-4xl">📝</p>
          <p className="mt-3 font-medium text-slate-600 dark:text-slate-300">
            まだ品目がありません
          </p>
          <p className="mt-1 text-sm text-slate-400">
            下のボタンから、よく買うものを登録しましょう
          </p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
              🛒 そろそろ買う（{soon.length}）
            </h2>
            {soon.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-400 dark:bg-slate-900">
                いまは買うものはありません
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {soon.map(({ item, left }) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-3 dark:border-rose-900/60 dark:bg-rose-950/30"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                        {item.name}
                      </p>
                      <p className="text-xs text-rose-700 dark:text-rose-300">
                        {left < 0
                          ? `${-left}日 過ぎています`
                          : left === 0
                            ? "今日が予定日"
                            : `あと${left}日`}
                        {item.place ? ` ・ ${item.place}` : ""}
                      </p>
                    </div>
                    <form action={markPurchased}>
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="shrink-0 rounded-xl bg-rose-600 px-4 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-rose-700 active:scale-95"
                      >
                        買った
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {later.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-500 dark:text-slate-400">
                ✅ まだ大丈夫（{later.length}）
              </h2>
              <ul className="flex flex-col gap-2">
                {later.map(({ item, left }) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-slate-800 dark:text-slate-200">{item.name}</p>
                      <p className="text-xs text-slate-400">
                        あと{left}日{item.place ? ` ・ ${item.place}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <form action={markPurchased}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        >
                          買った
                        </button>
                      </form>
                      <form action={removeItem}>
                        <input type="hidden" name="id" value={item.id} />
                        <button
                          type="submit"
                          aria-label={`${item.name}を削除`}
                          className="rounded-xl px-2 py-2 text-slate-300 transition hover:text-rose-600 active:scale-95"
                        >
                          🗑
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <Link
        href="/add"
        className="rounded-xl bg-sky-600 px-5 py-3 text-center font-medium text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
      >
        ＋ 品目を追加
      </Link>

      <p className="text-center text-xs text-slate-400">
        予定日の{LEAD_DAYS}日前から「そろそろ買う」に並びます
      </p>
    </main>
  );
}
