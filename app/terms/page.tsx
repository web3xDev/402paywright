import type { Metadata } from "next";
import { LegalShell } from "@/components/LegalShell";

export const metadata: Metadata = {
  title: "Terms of Service — Paywright",
  description: "The terms for using Paywright.",
};

export default function TermsPage() {
  return (
    <LegalShell title="Terms of Service" updated="July 12, 2026">
      <p>
        By using Paywright, you agree to these terms. Paywright is a free,
        open-source developer tool provided as-is. This is a plain-language
        summary, not legal advice.
      </p>

      <h2>What Paywright is</h2>
      <p>
        A tool to send requests to x402 endpoints, decode the 402 payment
        challenge, pay in testnet USDC, and inspect the settled response. It runs
        on the Base Sepolia testnet.
      </p>

      <h2>No warranty</h2>
      <p>
        Paywright is provided &quot;as is&quot; and &quot;as available,&quot;
        without warranties of any kind. We do not guarantee that it will be
        uninterrupted or error-free, or that any request or payment will succeed.
      </p>

      <h2>Your responsibility</h2>
      <p>
        You are responsible for the requests you send, the endpoints you interact
        with, and your wallet and keys. Only connect wallets and sign
        transactions you understand, and do not send sensitive credentials
        through the tool.
      </p>

      <h2>Acceptable use</h2>
      <p>Do not use Paywright to:</p>
      <ul>
        <li>
          attack, overload, or gain unauthorized access to any system
        </li>
        <li>proxy traffic for unlawful purposes</li>
        <li>violate any law or the rights of others</li>
      </ul>
      <p>We may rate-limit or block abusive use.</p>

      <h2>Not financial advice</h2>
      <p>
        Paywright is a testing tool, not financial, investment, or legal advice.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Paywright and its author are not
        liable for any loss or damage arising from your use of the tool,
        including failed, blocked, or incorrect transactions, or issues with
        third-party services.
      </p>

      <h2>Third-party services</h2>
      <p>
        Paywright depends on wallets, facilitators, RPC providers, block
        explorers, and hosting operated by others. We are not responsible for
        their availability or actions.
      </p>

      <h2>Open source</h2>
      <p>
        Paywright&apos;s source is available under the AGPL-3.0 license. Your use
        of the source code is governed by that license.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. Continued use of Paywright means you accept
        the current version.
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
