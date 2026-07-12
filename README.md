<div align="center">

# ⚡ Paywright

### The Postman for x402.

Test and inspect any x402 endpoint end to end: send a request, decode the 402 payment challenge, pay in USDC, and inspect the settled response.

[![License: AGPL v3](https://img.shields.io/badge/license-AGPL--3.0-blue.svg)](LICENSE) &nbsp; **Live:** [paywright.xyz](https://paywright.xyz) &nbsp; Built on [x402](https://x402.org)

<br/>

<!-- 📹 DEMO: replace the line below with a GIF or MP4, e.g. ![Paywright demo](docs/demo.gif) -->
_▶️ Demo video coming soon._

</div>

---

## Why

`curl` and Postman stop at the `402`. They can't sign the payment and complete the request, so there's no easy way to actually test an x402-gated endpoint from a UI.

**Paywright runs the whole loop:**

```
GET /endpoint  →  402 Payment Required  →  sign (EIP-3009)  →  200 OK + data
                  (decode requirements)     (gasless)          (+ settlement receipt)
```

## Features

- **Full x402 flow.** Probe the `402`, decode the payment requirements (scheme, network, amount, pay-to, asset), pay with a connected wallet, and get the unlocked response.
- **Works on any endpoint.** Requests go through a same-origin, SSRF-guarded, rate-limited proxy, so CORS never gets in the way.
- **Settlement receipt.** See the on-chain transaction, with one-click links to the block explorer for the tx and the pay-to / asset addresses.
- **Wallet-native.** Connect any wallet (Reown AppKit), with a live USDC balance and a pre-flight check before you pay.
- **Inspect everything.** Tabbed response (body / headers / receipt), the raw payment challenge, and hover-to-reveal full addresses.
- **Copy, share, export.** Copy any value, share a request as a link (`?url=...`), or export it as a cURL command or a `fetch` snippet.
- **Request history.** Recent endpoints saved locally, one click to rerun.

## Run locally

```bash
git clone https://github.com/web3xDev/paywright.git
cd paywright
npm install
```

Add a Reown project id (free at [dashboard.reown.com](https://dashboard.reown.com)):

```bash
# .env.local
NEXT_PUBLIC_PROJECT_ID=your_project_id
```

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000), connect a wallet with **Base Sepolia** testnet USDC (grab some from the [Circle faucet](https://faucet.circle.com/)), paste an x402 endpoint, and hit **Send**.

## Stack

`Next.js` · `TypeScript` · `Tailwind` · `wagmi` / `viem` · `Reown AppKit` · `@x402/fetch`

## Notes

- Runs on **Base Sepolia** (the network the public [x402.org](https://x402.org) facilitator settles on). Multichain is on the roadmap.
- Payment signing happens client-side. The proxy only forwards the HTTP hop, never touches keys, and is guarded against SSRF and abuse.

## License

[AGPL-3.0](LICENSE). You're free to use, study, modify, and self-host it. If you run a modified version as a network service, you must share your source under the same license.

---

<div align="center">

Built on the [x402 protocol](https://x402.org) by [web3xDev](https://github.com/web3xDev)

</div>
