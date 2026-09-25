import { ImageResponse } from "next/og";

// アプリのアイコン（画像ファイルを持たず、ここで生成する）
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)",
          fontSize: 300,
        }}
      >
        🛒
      </div>
    ),
    size,
  );
}
