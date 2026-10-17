# Full token security for Jassu Cheats

## Scope
Keep existing accounts, passwords, store data and the current sign-in service. Make no changes to the live app until this plan is approved. No new account service or data migration.

## What you will get
- Successful login creates a verified session token.
- Each session expires **exactly 12 hours after the original login**, even if the user stays active or refreshes the page.
- Logout revokes that session on the server. Copies of its token stop working for subsequent protected requests, not merely disappear from the browser.
- Every account, order, checkout, license-key and admin request requires an active, unexpired session. Admin requests also require a verified admin role.
- Expired sessions clear private account information from the page and require signing in again.
- Preserve the existing appearance, animations and fixed account card.

### Necessary public exceptions
Login, registration, password recovery and sign-in callbacks must be reachable without an existing token. Keep published product browsing public, with only safe product fields returned; download links and keys stay protected. This is not a claim that every network request requires login: public storefront requests and authentication entry points are explicit exceptions. If a future payment callback is present, it must verify the payment provider rather than accept a customer's login token as payment proof.

## Access required before implementation
The app currently talks directly to an existing external account/database service. Its actual security policies, stored procedures and authentication settings are not available in this project.

Connect **that same existing project** through **Settings → General → External Supabase → Connect**. This must not create a replacement account database. If management access remains unavailable after connection, the required database changes must be applied by the service owner before enforcement can be completed. Do not substitute browser-only expiry or claim full protection without those changes.

## Implementation steps
1. **Inspect existing security.** Read the real table definitions, grants, row policies, authentication settings and `complete_order` procedure. Confirm existing providers and preserve accounts. Back up affected definitions before applying changes.
2. **Add trusted session tracking.** Record the authenticated session's identity, original login time, fixed expiry and revocation state in the existing database. Derive identity and timing from the verified provider session, never from a user ID or timestamp sent by the browser. Registration of the same session must be idempotent; an expired or revoked session cannot register itself again.
3. **Enforce token checks everywhere.** Validate token authenticity and provider session identity, then check the session registry on every protected server operation and database policy. Audit all sibling paths: profiles, orders, order items, license keys, coupons, settings, products/versions, stored procedures and any storage/download access. Direct database requests must obey the same deadline and revocation rules so bypassing the website cannot bypass security.
4. **Secure existing store operations.** Move protected application calls behind authenticated server functions. Use the caller's identity for order ownership and retrieve admin permissions from trusted records. Reject requests for another customer's orders or keys. Recalculate checkout values from trusted product/coupon data; a browser-supplied success state must not mark an order paid or issue a key. Preserve existing payment behavior only where it is safely authorized; do not add a payment provider in this task.
5. **Wire login, refresh and logout.** Complete trusted session registration before loading private data. Refresh short-lived access tokens only inside the original 12-hour window; refresh must never extend that window. Logout first performs durable revocation, then cancels requests and clears private cached data and local credentials. Surface a revocation failure rather than falsely claiming the server token is invalidated. Synchronize sign-out across tabs and recheck on page focus. Keep the server check authoritative if a browser timer is delayed.
6. **Roll out safely.** Require existing sessions to sign in once under the new policy rather than grant old tokens a fresh 12-hour window. Apply policy changes and application changes in a coordinated rollout. Verify existing account access before reporting completion.

## Technical design
- Retain the existing authentication provider's signed access tokens; do not invent a custom JWT signing system or expose signing keys.
- Tie the session registry to the provider's verified session identifier. Use the original provider session creation time as the absolute deadline anchor, after confirming its availability in the existing project.
- Store durable session records in PostgreSQL. Browser storage and server memory are not authorization sources.
- Session creation/revocation helpers must be narrowly authorized. No direct client insert/update access to session timing or revocation fields. Avoid policies whose broad `OR` conditions accidentally bypass the active-session check.
- Every new public-schema table needs explicit grants and row-level security in the same migration. Review elevated stored procedures, fixed search paths and execution grants for bypasses.
- Use TanStack Start server functions, shared authenticated middleware and bearer attachment for private application calls. Preserve existing CSRF and error middleware. Use the user's database permissions for normal operations, not an administrator client.
- Keep public routes public; place signed-in screens under the shared authenticated layout while preserving visible URLs. Every private endpoint checks authorization independently of page protection.
- Return private responses with `Cache-Control: no-store`; do not log tokens, passwords or session credentials. Apply conservative rate limits to newly exposed authentication/session operations.
- Confirm storage and download behavior against the actual service. Already-downloaded files cannot be revoked; long-lived signed download URLs must not silently bypass the requested session guarantees.
- Record structural decisions in `AGENTS.md` during implementation, not in project preference memory.

## Verification
Add and run focused tests for each security rule:
- Missing, malformed and invalid tokens are rejected by protected calls.
- A session works immediately before 12 hours and fails **at** 12 hours.
- Token refresh, reload and repeated registration cannot extend the deadline.
- Logout rejects reuse of both the old access token and its refreshed descendants for that session.
- A revoked or expired session cannot recreate its session record.
- Another customer's order/key is inaccessible; non-admins cannot perform admin operations.
- Direct database and stored-procedure calls cannot bypass expiry or revocation.
- Browser-supplied totals, identities and payment success cannot grant unauthorized value or keys.

Exercise login → protected account read → refresh → logout → rejected token reuse against the existing service using an authorized test account, without requesting passwords in chat. Check multi-tab cleanup and expiry handling. If external service access prevents signed-in checks, label those checks unverified rather than claim completion.

## Not included
Account migration, a new payment integration, a redesign or a token-management dashboard. Implementation is blocked on approval and access to the current service's security configuration.