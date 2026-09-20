// 次に買う日の計算。
// 次回予定日はDBに持たず、ここで「最後に買った日 + 標準周期」から毎回計算する。

/** 予定日の何日前から「そろそろ買う」に出すか */
export const LEAD_DAYS = 3;

/**
 * 今日の日付（日本時間）を "YYYY-MM-DD" で返す。
 * Vercelのサーバーは世界標準時で動くため、日本時間に直してから日付を出す。
 */
export function todayInJst(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** "YYYY-MM-DD" を、時差の影響を受けない形で数値に変換する */
function toUtcTime(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

/** "YYYY-MM-DD" に日数を足した "YYYY-MM-DD" を返す */
export function addDays(dateStr: string, days: number): string {
  const t = toUtcTime(dateStr) + days * 86400000;
  return new Date(t).toISOString().slice(0, 10);
}

/** 次に買う予定日 */
export function nextDueDate(lastPurchasedAt: string, cycleDays: number): string {
  return addDays(lastPurchasedAt, cycleDays);
}

/** 予定日まであと何日か（マイナスなら過ぎている） */
export function daysLeft(lastPurchasedAt: string, cycleDays: number): number {
  const due = nextDueDate(lastPurchasedAt, cycleDays);
  return Math.round((toUtcTime(due) - toUtcTime(todayInJst())) / 86400000);
}

/** 「そろそろ買う」に出すか（予定日の3日前から） */
export function isSoon(lastPurchasedAt: string, cycleDays: number): boolean {
  return daysLeft(lastPurchasedAt, cycleDays) <= LEAD_DAYS;
}

/** 最後に買ってから何日経ったか（通知文で使う） */
export function daysSince(lastPurchasedAt: string): number {
  return Math.round(
    (toUtcTime(todayInJst()) - toUtcTime(lastPurchasedAt)) / 86400000,
  );
}
