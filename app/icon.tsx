import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

// The "402" brand mark on the orange accent — matches the header logo.
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
          background: "#ff6c37",
          color: "#1a0e08",
          fontSize: 30,
          fontWeight: 800,
          fontFamily: "monospace",
        }}
      >
        402
      </div>
    ),
    { ...size },
  );
}
