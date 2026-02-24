# Kwalis Website

Pre-launch landing page for [kwalis.ai](https://kwalis.ai).

## Stack

- **Framework:** Astro (static output) — `src/` contains pages, layouts, components
- **Hosting:** Cloudflare Workers with static assets (not Pages)
- **API:** `worker.ts` handles `/api/signup` and serves static files from `dist/`
- **Database:** Cloudflare D1 (`kwalis-signups`) stores email signups
- **Bot protection:** Cloudflare Turnstile (managed, visually hidden)
- **Domain:** kwalis.ai (Cloudflare DNS, same account)

## Project Structure

```
src/
  pages/index.astro          — Landing page (content + styles)
  layouts/BaseLayout.astro   — HTML shell, meta tags, global styles, Turnstile script
  components/EmailSignup.astro — Email form with Turnstile integration
worker.ts                    — Cloudflare Worker entry point (signup API + asset serving)
wrangler.toml                — Cloudflare config (D1 binding, routes, assets)
```

## Commands

```bash
npm run dev              # Local dev server (http://localhost:4321)
npm run build            # Build static site to dist/
npm run build && npx wrangler deploy   # Build and deploy to production
```

## Deployment

Deployment is via `npx wrangler deploy` (not Pages). The Worker serves both static assets and the `/api/signup` endpoint. Every push to `main` should trigger a CI build (build command: `npm run build`, deploy command: `npx wrangler deploy`).

The git hash is baked into the footer at build time for version tracking.

## Cloudflare Resources

- **Account:** admin@kwalis.ai
- **Worker:** kwalis-website
- **D1 Database:** kwalis-signups (ID: `464e9790-b9ef-460d-a480-235d9484fa07`)
- **Turnstile site key:** `0x4AAAAAAChl2EluFWwGeDcU`
- **Turnstile secret:** stored as Worker secret `TURNSTILE_SECRET` (set via `echo "KEY" | npx wrangler secret put TURNSTILE_SECRET`)

To query signups:
```bash
npx wrangler d1 execute kwalis-signups --remote --command "SELECT * FROM signups"
```

## MCP Servers

This project uses the **Cloudflare MCP server** for managing Workers, D1, KV, and other Cloudflare resources directly from Claude Code. If Cloudflare MCP tools are not available in the current session, ask the user to install the Cloudflare MCP server from the Claude marketplace (Settings > MCP Servers).

## Kwalis Context

See `../kwalis-foundations/CLAUDE.md` for full foundational context. The website content reflects:
- The six core principles
- The problem framing (meaning, not scale)
- Communication rule: never lead with category theory, lead with the problem

## Notes

- Astro runs in static output mode — no SSR, no `@astrojs/cloudflare` adapter
- The `wrangler.toml` uses `[assets]` binding (Workers model), not `pages_build_output_dir` (Pages model)
- Turnstile widget is rendered on page load but hidden via CSS; token is ready when user submits
- `is:global` is required for `:root` CSS variables in Astro (scoped styles don't apply to `:root`)
