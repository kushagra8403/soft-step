# Soft Steps

One-page shop for Soft Steps (rugs, doormats and bath mats, Vadodara). Plain HTML/CSS/JS, English | ગુજરાતી | हिन्दी.

Live site: https://claude.ai/artifact/CspLRioTiMjWF3nz8qj3WH — planned: https://softsteps-home.netlify.app

**Start with [HANDOFF.md](HANDOFF.md)**: folder map, rules, current state and the remaining tasks.

- `site-live-v30/` — exactly what is published (v30)
- `work-admin/` — newer working copy: stock/price catalog layer + owner admin (`admin.js`)
- `i18n/` — translations and the build tool
- `build_netlify.py` — builds a Netlify-ready folder
- `account.js`, `netlify/functions/`, `supabase/schema.sql`, `SETUP-ACCOUNTS.md` — optional customer sign-in, saved orders, order emails and the owner's order list (setup steps in `SETUP-ACCOUNTS.md`)
- `qa.cjs`, `audit/`, `libs/` — Playwright test harness
- `design2/` — colour research and the specs for the new effects
