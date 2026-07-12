import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Privacy Policy — Paywright",
  description: "What data Paywright does and does not handle.",
};

export default function PrivacyPage() {
  return (
    <LegalShell title="Privacy Policy" updated="July 12, 2026">
      <p>
        Paywright is a free, open-source developer tool for testing x402
        endpoints on testnet. This page explains, in plain language, what data
        it does and does not handle. It is a summary for transparency, not legal
        advice.
      </p>

      <h2>No accounts or personal data</h2>
      <p>
        Paywright has no sign-up and no login. It does not ask for your name,
        email, or any personal information, and it does not create a profile
        about you.
      </p>

      <h2>Your wallet</h2>
      <p>
        When you connect a wallet (through Reown AppKit / WalletConnect), your
        public address is used in your browser to read your USDC balance and to
        sign payments. We do not store your address. Paywright never has access
        to your private keys or seed phrase, and never asks for them.
      </p>

      <h2>The request proxy</h2>
      <p>
        To get around browser CORS restrictions, the requests you send are
        forwarded through Paywright&apos;s server to the target endpoint. The
        URL, headers, and body you enter pass through the server only to make
        that request, and the response is returned to you. We do not store this
        content in a database. As with any web server, our host (Vercel) may
        keep short-lived platform logs containing standard request metadata such
        as IP address. <strong>Do not send secrets through the proxy</strong>{" "}
        that you would not want transmitted to the target endpoint or briefly
        logged.
      </p>

      <h2>Local storage</h2>
      <p>
        Your recent requests are saved in your browser&apos;s localStorage, on
        your device only. They are never sent to us. You can clear them at any
        time with the &quot;clear&quot; action or by clearing your browser
        storage.
      </p>

      <h2>Third-party services</h2>
      <p>Paywright relies on services that have their own privacy practices:</p>
      <ul>
        <li>Reown / WalletConnect, for wallet connection</li>
        <li>
          The public x402 facilitator and RPC providers, for on-chain reads and
          settlement
        </li>
        <li>Block explorers, for the links to transactions and addresses</li>
        <li>Vercel, for hosting</li>
      </ul>
      <p>Your use of those services is subject to their own policies.</p>

      <h2>Analytics</h2>
      <p>
        Paywright does not run its own custom analytics or tracking cookies, but
        some usage data is collected by the services it runs on:
      </p>
      <ul>
        <li>
          Reown, our wallet-connection provider, processes wallet connection
          events for usage analytics.
        </li>
        <li>
          Vercel, our host, keeps standard server logs (such as IP address and
          request metadata), as any web host does.
        </li>
      </ul>
      <p>
        This data is handled under those providers&apos; own privacy policies.
        We use it only to understand usage and keep Paywright running. If we add
        anything else, we will update this page.
      </p>

      <h2>Testnet</h2>
      <p>
        Paywright operates on the Base Sepolia testnet and does not handle real
        funds.
      </p>

      <h2>Changes</h2>
      <p>
        We may update this policy. The &quot;last updated&quot; date above
        reflects the current version.
      </p>

      <h2>Contact</h2>
      <p>
        Questions? Reach out via{" "}
        <a href="https://github.com/web3xDev" target="_blank" rel="noreferrer">
          GitHub
        </a>
        .
      </p>
    </LegalShell>
  );
}
