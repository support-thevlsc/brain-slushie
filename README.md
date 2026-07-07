# brain-slushie
Business Ideas

## ChatVLSC Config

Sanitized ChatVLSC route and MCP configuration lives under `config/chatvlsc/`.

- `mcp-endpoints.json`
- `cloudflare-mcp.config.json`
- `secure-api-route-map.json`
- `dns-record-map.json`
- `response-security-policy.json`
- `christian-identity-access.public.json`
- `entra-chatvlsc-write-status.json`
- `staged-configuration-verification.config.json`
- `chatgpt-app-readiness.config.json`
- `cloudflare-secret-storage.plan.json`
- `mcp-connection-readiness.json`
- `mcp-protocol-validation.json`

Do not commit Cloudflare, OpenAI, tunnel, Zapier, Notion, or Entra secrets. Public files may include endpoint names, route classes, and policy intent only.

Cloudflare secret storage is planned in `config/chatvlsc/cloudflare-secret-storage.plan.json`. Current Cloudflare token candidates from `Keys.zip` authenticate account lookup but are denied for Worker secrets and Secrets Store operations, so no secret values are stored in this repository.

MCP connection readiness is tracked in `config/chatvlsc/mcp-connection-readiness.json`. Local Worker protocol validation is tracked in `config/chatvlsc/mcp-protocol-validation.json`: `initialize`, `tools/list`, and sample `tools/call` requests pass locally for current and alpha paths using the Cloudflare workspace harness `scripts/test-chatvlsc-mcp-protocol.ps1`. Production endpoints remain gated by Cloudflare Access; Zapier MCP is configured locally and requires Zapier authorization before tool use.

Response-header policy is published as sanitized metadata only and is exposed by the Worker at `GET /security/headers`.

Public homepage routing is published as sanitized DNS metadata: `www.thevlsc.com` is a proxied CNAME to `thevlsc.com`, with `www.thevlsc.com/*` served by the dedicated homepage Worker.

Staged verification and ChatGPT app readiness are documented without secrets:

- Staged configuration endpoint: `https://mcp.thevlsc.com/v1/configuration/staged`
- ChatGPT app readiness endpoint: `https://mcp.thevlsc.com/v1/chatgpt/app/readiness`
- MCP server URL for Developer Mode review: `https://mcp.thevlsc.com/v1/`
