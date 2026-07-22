# Cloudflare service recommendations

Start with Workers Paid if production traffic or background work will exceed Free-plan limits. Keep Workers AI behind AI Gateway so provider usage can be observed and budgeted. Configure spend limits by application or agent, and use sanitized custom metadata rather than personal email addresses.

Recommended initial services:

- Workers and Wrangler environments for isolated staging and production deployments.
- Cloudflare Access for human and service authentication.
- AI Gateway for model observability, caching where appropriate, and spend controls.
- Workers AI only for advisory optimization; production mutations stay behind governance.
- R2 for scoped agent knowledge and deployment artifacts.
- D1 or Durable Objects when persistent proposal state, consensus records, or coordination is implemented.
- Analytics Engine when telemetry volume justifies dedicated operational metrics.
- Queues when configuration work becomes asynchronous or retryable.

Do not adopt Workers for Platforms initially unless the system grows into many independently deployed member Workers or approaches normal Worker-count limits. Do not enable automatic account mutations from Cloudy recommendations; Cloudy is advisory and beta, and recommendations must enter the same risk-scored proposal workflow.
