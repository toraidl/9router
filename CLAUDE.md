# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
```bash
npm run dev        # Next.js dev server on :20128 (webpack)
npm run dev:bun    # Same with Bun runtime
```

**Production:**
```bash
npm run build      # Build standalone output
npm run start      # Start production server
npm run start:bun  # Start via Bun (uses .next/standalone/server.js)
```

**Tests:**
```bash
cd tests && npm test    # Run unit tests (vitest)
```

**Environment:** Copy `.env.example` to `.env`. Required: `JWT_SECRET`, `INITIAL_PASSWORD`, `DATA_DIR`.

## Architecture

**Core request flow:**
1. Client → `/v1/chat/completions` (OpenAI format)
2. `src/sse/handlers/chat.js` → validates, extracts credentials
3. `open-sse/handlers/chatCore.js` → handles routing, RTK compression, combo fallback
4. `open-sse/translator/` → format conversion (OpenAI ↔ Claude ↔ Gemini ↔ Cursor etc)
5. Provider call via `open-sse/services/`
6. Response streamed via SSE

**Key directories:**
- `src/app/api/v1/` - Next.js API routes (chat, models, usage, settings, combos)
- `src/lib/` - App-side logic: DB repos, OAuth services, network proxy, tunnel management
- `src/mitm/` - Man-in-the-middle proxy for subscription interception (cert install, DNS routing)
- `open-sse/` - Core streaming logic (translator, RTK filters, provider configs, executors)
- `src/shared/` - UI components and hooks

**Database:** SQLite with auto-migration. Schema in `src/lib/db/schema.js`. Repo pattern in `src/lib/db/repos/`. Data at `${DATA_DIR}/db/data.sqlite`.

**OAuth providers:** Services in `src/lib/oauth/services/` (claude, codex, github, cursor, kiro, antigravity, iflow, gemini-cli, qwen). Token auto-refresh handled.

**RTK (Rust Token Killer):** Token compression pipeline in `open-sse/rtk/`. Auto-detects tool outputs (git-diff, grep, ls, tree) and compresses before sending to LLM. Saves 20-40% input tokens.

**Combo fallback:** Model aliases like `premium-coding` resolve to fallback lists. Handled in `open-sse/services/combo.js`. Accounts marked unavailable when quota exceeded.

**MITM proxy:** HTTPS interception on port 443 for subscription providers. Requires cert install + DNS redirect. Windows/macOS only. Configurable via dashboard.

**Cloud sync:** Config sharing via `/api/sync/cloud`. Server vars: `BASE_URL` (internal), `CLOUD_URL` (sync endpoint).

**Translator:** Bidirectional format conversion. Entry: `open-sse/translator/index.js`. Supports: OpenAI, Claude, Gemini, Cursor, Kiro, Vertex, Antigravity, Ollama, OpenAI Responses.

**Format detection:** `detectFormatByEndpoint()` in `open-sse/translator/formats.js`. Auto-detects from headers/body.

**Usage tracking:** Async logging to `usageHistory` table. Costs calculated via `src/lib/db/repos/pricingRepo.js`. Display-only (9Router never bills).

**Settings:** JWT auth for dashboard. Cookie-based. API keys optional (`REQUIRE_API_KEY=true` enforces).