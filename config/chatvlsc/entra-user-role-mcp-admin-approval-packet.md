# VLSC User Role MCP Entra Admin Approval Packet

Status: approved to patch the existing app registration; pending a clean Microsoft Graph credential or Entra app-registration write connector. No Microsoft Entra mutation has been applied from this packet.

## Source Plan

- Human review plan: `config/entra-user-role-mcp.plan.json`
- Executable Graph config: `config/entra-user-role-mcp.graph.json`
- Safe executor: `scripts/apply-entra-user-role-mcp.ps1`
- Current write status: `config/entra-chatvlsc-write-status.json`

## Target

- App registration display name in executable config: `ChatVLSC`
- Intended MCP/API role surface: VLSC user role and permission lookup for MCP-backed agent workflows
- Application object ID currently configured: `9c392dd7-7e0b-49a8-be0e-1269358f6f59`
- Application client ID currently configured: `520e42c6-398f-4521-aa62-b3b95092637d`
- API URI: `https://api.thevlsc.com/user_role/v1`
- Display/auth URL: `https://mcp.thevlsc.com/user_role/auth`

## Required Admin Capability

The applying identity must have Microsoft Graph `Application.ReadWrite.All` or an equivalent Entra role such as Application Administrator or Cloud Application Administrator.

## What Would Be Created

Nothing is created by default.

The executor only creates a new Entra application if it is run with `-CreateIfMissing`. That should be treated as a separate explicit approval, because the current executable config targets the existing `ChatVLSC` app registration.

## What Would Be Patched

If approved, the executor patches the target app registration with:

- Description for the VLSC MCP user-role surface
- `AzureADMyOrg` sign-in audience
- Identifier URIs for the MCP/API surface
- Homepage, redirect URI, logout, marketing, privacy, support, and terms URLs
- Optional `email` and `preferred_username` claims on ID and access tokens
- Four app roles: `Owner`, `Admin`, `Agent`, `Viewer`
- Three delegated OAuth scopes: `UserRole.Read`, `Consent.Read`, `Consent.Record`
- API requested access token version `2`
- Tags: `vlsc`, `mcp`, `user-role`, `codex-configured`

The default script behavior merges existing identifier URIs, redirect URIs, optional claims, app roles, and OAuth scopes instead of replacing whole collections.

## Optional Logo Upload

Logo upload is skipped by default. It only runs if the executor is called with `-UploadLogo`, using `public/assets/chatvlsc-logo-512.png`.

## Current Blocker

A previous Graph write attempt returned `403 Authorization_RequestDenied`, and the repo status records that no successful Entra write has been applied. The remaining blocker is admin approval plus an applying identity with the required Graph application-write permission.

## Validation Command

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\apply-entra-user-role-mcp.ps1 -ValidateOnly
```

Expected validation shape:

- `ok: true`
- `displayName: ChatVLSC`
- `createIfMissing: false`
- `uploadLogo: false`
- `roleCount: 4`
- `scopeCount: 3`
- `requiredPermission: Application.ReadWrite.All`

## Approval Decision

Approved on `2026-07-08T09:29:32-05:00`: patch the existing `ChatVLSC` Entra app registration object `9c392dd7-7e0b-49a8-be0e-1269358f6f59` as the VLSC User Role MCP app.

If that is not the correct application, provide the correct Entra application object ID to patch. Do not create a new app registration unless `-CreateIfMissing` is separately approved.
