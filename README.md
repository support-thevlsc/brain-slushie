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

Do not commit Cloudflare, OpenAI, tunnel, Zapier, Notion, or Entra secrets. Public files may include endpoint names, route classes, and policy intent only.

Response-header policy is published as sanitized metadata only and is exposed by the Worker at `GET /security/headers`.
