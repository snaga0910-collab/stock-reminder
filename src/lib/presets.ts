// プリセット品目（requirements.md の表をそのまま定数化）
// 標準周期を最初から持たせることで、ユーザーに周期を入力させない。

export type Preset = {
  name: string;
  cycleDays: number;
  place: string;
};

export const PRESETS: Preset[] = [
  { name: "トイレットペーパー", cycleDays: 30, place: "スーパー / コストコ" },
  { name: "ティッシュ", cycleDays: 45, place: "スーパー / コストコ" },
  { name: "洗濯洗剤", cycleDays: 60, place: "コストコ / ネット" },
  { name: "シャンプー・リンス", cycleDays: 90, place: "コストコ / ネット" },
  { name: "ボディソープ", cycleDays: 90, place: "コストコ / ネット" },
  { name: "ゴミ袋", cycleDays: 60, place: "スーパー" },
  { name: "歯ブラシ", cycleDays: 30, place: "スーパー" },
  { name: "歯磨き粉", cycleDays: 60, place: "スーパー" },
  { name: "醤油", cycleDays: 60, place: "スーパー" },
  { name: "コンソメ顆粒", cycleDays: 90, place: "スーパー" },
];
