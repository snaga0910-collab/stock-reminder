import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getSupabase, type Item } from "@/lib/supabase";
import { daysLeft, isSoon, LEAD_DAYS, nextDueDate, formatJpDate } from "@/lib/due";
import { SubmitButton } from "@/components/submit-button";
import { markPurchased, removeItem, restoreItem } from "./actions";

export const dynamic = "force-dynamic";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ undo?: string; name?: string; done?: string; saved?: string }>;
}) {
  await requireAuth();
  const { undo, name: undoName, done, saved } = await searchParams;

  const { data, error } = await getSupabase()
    .from("items")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <main className="mx-auto w-full max-w-md px-5 py-10">
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          データを読み込めませんでした。時間をおいて再度お試しください。
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
  const nextUp = withDays[0];

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 py-8">
      <header className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          🛒 そろそろリマインダー
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          買ったら1タップ。期日が近づくとLINEに届きます
        </p>
      </header>

      {/* 操作の手応え・取り消し */}
      {done && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          ✅ 「{done}」を買ったことを記録しました
        </p>
      )}
      {saved && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          ✅ 変更を保存しました
        </p>
      )}
      {undo && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-300 bg-slate-800 px-4 py-3 text-sm text-white">
          <span className="min-w-0 truncate">🗑 「{undoName}」を削除しました</span>
          <form action={restoreItem}>
            <input type="hidden" name="id" value={undo} />
            <SubmitButton
              pendingLabel="戻しています…"
              className="shrink-0 rounded-lg bg-white px-3 py-1.5 font-medium text-slate-900 transition hover:bg-slate-100 active:scale-95"
            >
              元に戻す
            </SubmitButton>
          </form>
        </div>
      )}

      {/* 全体サマリー */}
      {items.length > 0 && (
        <section className="grid grid-cols-3 gap-2 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 p-4 text-white">
          <div className="text-center">
            <p className="text-xs text-sky-100">登録</p>
            <p className="text-xl font-bold">{items.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-sky-100">そろそろ</p>
            <p className="text-xl font-bold">{soon.length}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-sky-100">次の予定</p>
            <p className="text-sm font-bold leading-7">
              {nextUp
                ? formatJpDate(
                    nextDueDate(nextUp.item.last_purchased_at, nextUp.item.cycle_days),
                  )
                : "—"}
            </p>
          </div>
        </section>
      )}

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
              <p className="rounded-xl bg-slate-50 px-4 py-4 text-center text-sm text-slate-400 dark:bg-slate-900">
                いまは買うものはありません 🎉
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {soon.map(({ item, left }) => (
                  <ItemRow key={item.id} item={item} left={left} urgent />
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
                  <ItemRow key={item.id} item={item} left={left} />
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

function ItemRow({ item, left, urgent }: { item: Item; left: number; urgent?: boolean }) {
  const due = formatJpDate(nextDueDate(item.last_purchased_at, item.cycle_days));
  const when =
    left < 0 ? `${-left}日 過ぎています` : left === 0 ? "今日が予定日" : `あと${left}日`;

  return (
    <li
      className={`rounded-xl border p-3 ${
        urgent
          ? "border-rose-200 bg-rose-50 dark:border-rose-900/60 dark:bg-rose-950/30"
          : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">{item.name}</p>
          <p
            className={`text-xs ${urgent ? "text-rose-700 dark:text-rose-300" : "text-slate-400"}`}
          >
            {when} ・ {due}
          </p>
          {item.place && (
            <p className="mt-0.5 truncate text-xs text-slate-400">📍 {item.place}</p>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <form action={markPurchased}>
            <input type="hidden" name="id" value={item.id} />
            <SubmitButton
              pendingLabel="記録中…"
              className={`rounded-xl px-4 py-3 text-sm font-medium shadow-sm transition active:scale-95 ${
                urgent
                  ? "bg-rose-600 text-white hover:bg-rose-700"
                  : "border border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              }`}
            >
              買った
            </SubmitButton>
          </form>

          <Link
            href={`/edit/${item.id}`}
            aria-label={`${item.name}を編集`}
            className="rounded-xl px-2 py-2 text-slate-400 transition hover:text-sky-600"
          >
            ✏️
          </Link>

          <form action={removeItem}>
            <input type="hidden" name="id" value={item.id} />
            <SubmitButton
              pendingLabel="…"
              aria-label={`${item.name}を削除`}
              className="rounded-xl px-2 py-2 text-slate-300 transition hover:text-rose-600 active:scale-95"
            >
              🗑
            </SubmitButton>
          </form>
        </div>
      </div>
    </li>
  );
}
