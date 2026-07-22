# Homuncul and Kagent ordered rollout

## Canonical identities

- Owner: `christian@thevlsc.com`
- Homuncul: `homuncul.ai@thevlsc.com`
- Kagent: `kagent@thevlsc.com`
- ChatVLSC: `chat@thevlsc.com`

Email principals identify actors. Worker routes are HTTPS services:

- `https://homuncul.thevlsc.com`
- `https://kagent.thevlsc.com`

## Deployment order

1. Merge the validated source and workflow changes.
2. Create Cloudflare Access applications for both service routes.
3. Add least-privilege service policies for the canonical principals.
4. Configure GitHub environments `homuncul-staging` and `kagent-staging` with scoped Cloudflare credentials.
5. Deploy Homuncul staging and verify `/health`, `/v1/policy`, and proposal evaluation.
6. Deploy Kagent staging and verify `/health`, `/v1/whoami`, and governance evaluation.
7. Configure `OWNER_NOTIFICATION_WEBHOOK` only in Cloudflare secret storage; never commit it.
8. Run a synthetic risk-8 disagreement and verify owner escalation.
9. Configure protected production environments with required reviewers.
10. Deploy Homuncul production before Kagent production.
11. Apply Cloudflare Access to both production routes before allowing configuration intents.

## Governance

Changes scored 8 through 10 require reviews from Homuncul, ChatVLSC, and Kagent. Unanimous approval makes the proposal eligible for the protected deployment workflow. Any rejection, abstention, or disagreement requires owner escalation with a concise summary, proposals, and blockage.

## Current safety boundary

Both Workers are proposal and advisory services. They do not directly mutate Cloudflare account settings. Actual mutations must occur through a reviewed deployment workflow using scoped credentials and an auditable governance record.
