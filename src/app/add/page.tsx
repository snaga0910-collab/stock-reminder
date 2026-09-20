import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getSupabase, type Item } from "@/lib/supabase";
import { PRESETS } from "@/lib/presets";
import { addItems } from "../actions";

export const dynamic = "force-dynamic";

export default async function AddPage() {
  await requireAuth();

  // すでに登録済みの品目は選べないようにする
  const { data } = await getSupabase().from("items").select("name");
  const registered = new Set(((data ?? []) as Pick<Item, "name">[]).map((r) => r.name));

  const selectable = PRESETS.filter((p) => !registered.has(p.name));

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-5 px-5 py-8">
      <header>
        <Link href="/" className="text-sm text-sky-600 hover:underline dark:text-sky-400">
          ← もどる
        </Link>
        <h1 className="mt-2 text-xl font-bold text-slate-900 dark:text-slate-100">
          品目を追加
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          よく買うものを選ぶだけ。買う間隔は自動で入ります
        </p>
      </header>

      {selectable.length === 0 ? (
        <p className="rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500 dark:bg-slate-900">
          すべての品目が登録済みです
        </p>
      ) : (
        <form action={addItems} className="flex flex-col gap-3">
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

          <button
            type="submit"
            className="rounded-xl bg-sky-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
          >
            追加する
          </button>
          <p className="text-center text-xs text-slate-400">
            追加した日を「最後に買った日」として数え始めます
          </p>
        </form>
      )}
    </main>
  );
}
