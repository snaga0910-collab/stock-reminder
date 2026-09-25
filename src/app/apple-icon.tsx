import { ImageResponse } from "next/og";

// iPhoneのホーム画面に追加したときのアイコン
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 110,
        }}
      >
        🛒
      </div>
    ),
    size,
  );
}
