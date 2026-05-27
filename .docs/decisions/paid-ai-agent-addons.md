# Decision: Paid AI Agent Add-ons

## Status
Accepted

## Context

Specialized Translation Dataset Agents allow up to three active context agents per user by default. The product needs a decision on whether paid add-ons should be introduced now.

## Options

1. Keep maximum three active agents free/default and do not implement billing yet.
2. RevenueCat entitlements for mobile subscriptions.
3. Stripe Billing/Checkout for web/backend packages.

## Decision

Keep **`maxAgentsPerUser = 3`** as the default and do **not** implement paid add-ons in the MVP.

RevenueCat and Stripe remain deferred billing candidates. Extra paid agents require a future billing decision with entitlement source of truth, refund/cancel behavior, backend quota enforcement, and store-review constraints.

## Consequences

- Dataset-agent implementation must enforce three active agents per user.
- UI may mention that extra agents are not available yet, but must not expose purchase flows.
- Backend quota and RLS rules should be written so a future paid entitlement can raise the limit without changing user-owned dataset semantics.
- Billing, top-ups, add-ons, subscriptions, checkout, webhooks, and receipt validation remain out of scope.

## Tasks Unblocked

- Max-three-agent enforcement planning.
- Dataset-agent quota tests.
- Non-billing unavailable state copy.
- Future entitlement extension point planning.
