# Dockerfile Production Image Strategy

**Author:** Marathe (DevOps)
**Date:** 2026-03-18
**Issue:** #11
**PR:** #60

## Decision

Multi-stage Dockerfile using `node:22-slim` (Debian-based, not Alpine) for both build and production stages. Production stage installs all workspace production deps via `npm ci --omit=dev` and copies built artifacts only.

## Rationale

- **node:22-slim over Alpine:** npm workspaces + native modules (e.g., @colyseus packages) are more reliable on Debian. Alpine's musl libc causes sporadic build failures with native addons.
- **Full workspace production deps:** `npm ci --omit=dev` installs production deps for all workspaces (including client's react/pixi.js). This adds ~100MB but avoids fragile selective workspace installs. Acceptable tradeoff for CI reliability.
- **curl for HEALTHCHECK:** Installed in production image (~5MB) since node:22-slim doesn't include curl/wget. Required for Dockerfile HEALTHCHECK and compatible with Azure Container Apps health probes.

## Follow-up Required

- **Server static file serving:** The server does not serve `client/dist/` as static files. A follow-up task must add Express static middleware so the production container can serve the client bundle. Without this, the client needs a separate deployment (e.g., CDN/nginx sidecar).

## Impact

- Compatible with existing deploy workflows (`deploy-uat.yml`, `deploy-prod.yml`) which build and push to ACR.
- HEALTHCHECK aligns with Azure Container Apps liveness probe expectations.
