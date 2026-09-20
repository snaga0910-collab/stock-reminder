import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  async function submit(formData: FormData) {
    "use server";
    const ok = await signIn(String(formData.get("passcode") ?? ""));
    redirect(ok ? "/" : "/login?error=1");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-5 py-10">
      <div className="text-center">
        <p className="text-5xl">🛒</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-100">
          そろそろリマインダー
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          合言葉を入力してください
        </p>
      </div>

      <form action={submit} className="flex flex-col gap-3">
        <input
          type="password"
          name="passcode"
          required
          autoFocus
          aria-label="合言葉"
          placeholder="合言葉"
          className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-sky-600 px-5 py-3 font-medium text-white shadow-sm transition hover:bg-sky-700 active:scale-95"
        >
          入る
        </button>
      </form>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300">
          合言葉が違います
        </p>
      )}
    </main>
  );
}
