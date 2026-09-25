import type { MetadataRoute } from "next";

// F-11 ホーム画面に追加して、アプリとして起動できるようにする設定。
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "そろそろリマインダー",
    short_name: "そろそろ",
    description: "日用品の買い忘れを防ぐリマインダー。買ったら1タップ、期日が近づくとLINEに届きます。",
    start_url: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0284c7",
    lang: "ja",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
