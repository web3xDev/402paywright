<div align="center">

# ⚡ Paywright

### The Postman for x402.

Test and inspect any x402 endpoint end to end — send a request, decode the 402 payment challenge, pay in USDC, and inspect the settled response.

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

- **Full x402 flow** — probe the `402`, decode the payment requirements (scheme, network, amount, pay-to, asset), pay with a connected wallet, and get the unlocked response.
- **Works on any endpoint** — requests go through a same-origin, SSRF-guarded proxy, so CORS never gets in the way.
- **Settlement receipt** — see the on-chain transaction, with a one-click link to the block explorer.
- **Wallet-native** — connect any wallet (Reown AppKit), with a live USDC balance and a pre-flight check before you pay.
- **Inspect everything** — tabbed response (body / headers / receipt) and the raw payment challenge.

## Run locally

```bash
git clone <this-repo>
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
- Payment signing happens client-side; the proxy only forwards the HTTP hop.

---

<div align="center">

Built on the [x402 protocol](https://x402.org)

</div>
