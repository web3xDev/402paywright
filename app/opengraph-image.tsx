import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Paywright — the Postman for x402";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#16151a",
          color: "#ececf1",
          padding: "72px",
          justifyContent: "space-between",
          fontFamily: "sans-serif",
        }}
      >
        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 66,
              height: 46,
              borderRadius: 10,
              background: "#ff6c37",
              color: "#1a0e08",
              fontSize: 28,
              fontWeight: 800,
              fontFamily: "monospace",
            }}
          >
            402
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700 }}>
            Paywright
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              display: "flex",
              gap: 20,
              fontSize: 76,
              fontWeight: 800,
              letterSpacing: -2,
            }}
          >
            <div style={{ display: "flex" }}>The Postman for</div>
            <div style={{ display: "flex", color: "#ff6c37" }}>x402</div>
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "#9a9aa7" }}>
            Send a request, decode the 402 challenge, pay in USDC, inspect the
            settled response.
          </div>
        </div>

        {/* mock request bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "14px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#1d1c22",
              color: "#3ecf8e",
              fontSize: 26,
              fontFamily: "monospace",
              fontWeight: 700,
            }}
          >
            GET
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flex: 1,
              padding: "14px 20px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#1d1c22",
              color: "#9a9aa7",
              fontSize: 26,
              fontFamily: "monospace",
            }}
          >
            https://api.example.com/paid-endpoint
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              padding: "14px 30px",
              borderRadius: 10,
              background: "#ff6c37",
              color: "#1a0e08",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            Send
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
