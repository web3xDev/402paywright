import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { cookieToInitialState } from "wagmi";
import "./globals.css";
import { Providers } from "./providers";
import { wagmiConfig } from "@/lib/wagmi";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://paywright.xyz";
const TITLE = "Paywright — the Postman for x402";
const DESCRIPTION =
  "Paste an x402 endpoint, connect a wallet, and run the full 402 → sign → 200 flow. Decode payment requirements, pay in USDC, and inspect the settlement receipt.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESCRIPTION,
  // app/opengraph-image.tsx is auto-attached to og:image / twitter:image.
  openGraph: {
    type: "website",
    siteName: "Paywright",
    url: "/",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const initialState = cookieToInitialState(
    wagmiConfig,
    (await headers()).get("cookie"),
  );

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers initialState={initialState}>{children}</Providers>
      </body>
    </html>
  );
}
