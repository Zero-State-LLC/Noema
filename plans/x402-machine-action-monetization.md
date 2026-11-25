# Plan: x402 micropayments for machine-player actions

Status: PROPOSED (draft for review). Author: prabu-openclaw (Prabu), 2026-11-25.

## Purpose

Gate **machine-originated world actions** behind [x402](https://x402.org)
micropayments (HTTP `402 Payment Required`) using Cloudflare's native support
and the Coinbase public facilitator, so that:

1. NOEMA — explicitly "a persistent MUD for humans and machines" — becomes the
   first known world where machine players pay per action in agent-native
   money, with no accounts or API keys.
2. Paid actions create a natural throttle on agent spam and a running
   economic signal of which world activity agents value.
3. Zero State has a second live property in the Cloudflare x402 monetization
   program (applied via Daniel) beyond the JChain proposal
   (`Zero-State-LLC/JChain` docs/plans/x402-monetization.md, PR #337).

## Non-goals (v1)

- No monetization of human players in any form.
- No `upto` (metered) pricing; fixed `exact` USDC amounts only.
- No change to world simulation semantics, tempo, or genesis process.
- No custody of player funds; the facilitator verifies and broadcasts, funds
  settle peer-to-merchant.

## Protocol summary (verified 2026-11-25 against Cloudflare docs)

1. Client (agent) calls a paid endpoint.
2. Gateway returns `402` + `PAYMENT-REQUIRED` header (Base64: amount, token,
   network, merchant address).
3. Client signs an `exact`-scheme payment (EIP-3009 `transferWithAuthorization`,
   USDC) and retries with `PAYMENT-SIGNATURE`.
4. Facilitator (`https://x402.org/facilitator`, Coinbase) `POST /verify` +
   `POST /settle`; never holds funds.
5. Gateway forwards the action to the World DO and returns the result with a
   `PAYMENT-RESPONSE` settlement header.

SDKs: `x402-hono` (or equivalent middleware in the gateway's routing style),
`@x402/evm`. Networks: start `base-sepolia`, ship `base`.

## Integration surface (verified from `workers/noema/`)

Architecture: `noema-gateway` Worker (`src/index.ts`) routes to a World
Durable Object via `routeToWorld` → `https://do/command`; static assets fall
through for splash/play pages. Action semantics live in `actions.ts` /
`world-actions.ts`.

v1 paid surface — **writes by machine principals only**:

| Surface | v1 price (mainnet) | Notes |
| --- | --- | --- |
| World action/command from a machine principal | $0.002/action | Uniform price v1; per-verb pricing is a v2 design question |
| (Optional) world join / agent registration | $0.01 | One-time economic handshake |

Free forever in v1: reads, observation/watch endpoints (`/do/watch*`,
`watch-map`, streams), digests, health, human play paths, and all admin.

**Principal discrimination is the crux.** Payment applies only to actions
attributed to machine principals under the existing auth model. If the
gateway cannot classify a principal as machine-or-human, it must treat the
action as human (free) — never the reverse; humans must never be 402'd.

## Settlement wallet

Same merchant address as JChain (Zero State EVM address on Base; CDP Smart
Wallet recommended per the standing x402 decision). `payTo` as a public
gateway var per environment. Receiving requires no secrets. Manual sweeps in
v1; document in the runbook set.

## Phases

1. **Phase 0 — testnet e2e**: middleware in `noema-gateway`; `X402_ENABLED`
   var default `false`; full round-trip on `base-sepolia` with Circle-faucet
   test USDC inside the existing acceptance/rollback wrangler environments.
2. **Phase 1 — staging world**: replay a recorded action sequence; verify DO
   idempotency interlock (a retried settled payment must not double-charge or
   double-execute the action — reconcile with the gateway's existing
   idempotency/replay handling before enabling).
3. **Phase 2 — enable on a live world**: single world, machine principals
   opt-in; publish agent integration notes (price discovery + `@x402/fetch`
   example) alongside existing machine-client docs.
4. **Phase 3 — v2 candidates**: per-verb pricing, `upto` metering for
   token-consuming endpoints, paid persistence slots, economics readout for
   the science layer (paid-action throughput as a measured variable — decide
   deliberately whether payment data enters study analytics; default: it does
   not).

## Security & correctness requirements

- Fail closed: facilitator outage ⇒ paid action endpoints return `503` +
  `Retry-After`; never fall back to free execution silently.
- Gateway-verified settlement only; the DO never sees payment headers.
- Price/network/merchant from signed config, never client input.
- Action idempotency: settlement proof bound to the action idempotency key;
  replay returns the original result without a second charge or second world
  effect. This is the highest-risk interaction in the plan.
- Humans can never receive a `402` under any classification path.
- No wallet-derived personal data in logs; log settle tx hash only.
- `402` responses must not leak world internals or admin state.

## Observability & metrics

Trace attributes: `x402.enabled`, price, verify/settle latency, tx hash.
Dashboard: paid actions/day, revenue (USDC), 402→2xx conversion, facilitator
error rate. Alert when facilitator errors exceed 1% over 10 minutes.

## Tests

- Unit: classification gate (machine vs human vs unknown) — unknown ⇒ free.
- Contract: 402 header encodes config-derived price/network/merchant.
- Integration (existing vitest + wrangler plugin): 402 → signed retry → action
  executed exactly once; tampered signature rejected; expired authorization
  rejected; facilitator down ⇒ 503 and no world effect.
- Replay: settled payment resent ⇒ cached result, one charge, one world effect.

## Open questions

1. Per-verb pricing vs uniform v1 (uniform assumed here).
2. Does the merchant/waiver policy differ for research machine principals?
3. Should paid throughput enter study analytics at all (experimenter effect
   of monetization on agent behavior is itself interesting)?
4. Facilitator redundancy beyond the Coinbase public endpoint.
5. Align with JChain: shared merchant address, shared runbook section, one
   Zero State x402 integration guide referenced by both repos.

## References

- Cloudflare x402 docs: developers.cloudflare.com/agents/tools/payments/x402/
- x402 spec (`exact` scheme): github.com/x402-foundation/x402
- Coinbase facilitator: x402.org/facilitator
- base-sepolia test USDC: faucet.circle.com
- Sibling proposal: Zero-State-LLC/JChain `docs/plans/x402-monetization.md`
