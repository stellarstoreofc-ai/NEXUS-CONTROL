# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Stellar Controle Financeiro** is a single-file financial tracker for the business's own accounts payable and expenses ("contas a pagar" / "contas que saíram"). It is a private internal tool (not a public SaaS) but is backed by Supabase for auth + storage so the same data is available from any device after logging in — no per-browser `localStorage` lock-in.

## Running / Previewing

Open `index.html` directly in a browser. No server, build step, or package manager. Requires network access to reach Supabase (both for auth and data).

## Deployment

Drag the whole folder into Netlify (app.netlify.com) — pure static HTML, no build command needed. The Supabase URL/anon key are hardcoded in `index.html` (see below) — no environment variables or build-time injection.

## Supabase setup (one-time, per project)

Run `supabase-setup.sql` in the Supabase SQL Editor to create the `financeiro_dados` table and its Row Level Security policies before first use. See `README.md` for the full first-run checklist (creating the login user, email confirmation).

**Never put the `service_role` key in this file or anywhere client-side** — only the `anon` key belongs in `index.html`. Security comes entirely from Supabase Auth + the RLS policies (`auth.uid() = user_id`) in `supabase-setup.sql`, not from hiding the anon key.

## Architecture

Single file (`index.html`) containing markup, `<style>`, and `<script>`. No frameworks; the only external dependency is `@supabase/supabase-js@2` loaded via CDN `<script>` tag.

The app has two top-level `.screen` divs toggled by `showScreen(id)`: **`screen-login`** (email/senha form, doubles as signup via the "Criar conta" toggle) and **`screen-app`** (the sidebar SPA described below). On load, `initAuth()` checks `sb.auth.getSession()` — an existing session (persisted by supabase-js in its own `localStorage` entry) skips straight to the app; otherwise the login screen shows. `afterLogin(user)` sets `currentUserId`, calls `carregarDados(user.id)` to pull this user's row, then shows the app.

The app is a sidebar SPA with four pages (`.page` sections, toggled by `showPage(name)`): **Contas**, **Relatório mensal**, **Despesas por categoria**, **Lembretes**. `showPage` swaps the visible `.page`, updates the sidebar active state and top bar title, and calls that page's own render function — there is no shared render loop across pages. On narrow viewports the sidebar becomes an off-canvas drawer (`.sidebar.open`, toggled by the `#btnMenu` hamburger button plus a `#sidebarBackdrop` click-to-close overlay) instead of a static column.

### Data layer (one Supabase row per user)

All four in-memory state arrays/objects (`data`, `faturamento`, `lembretes`, `lembretesStatus`) map to columns on a single row in the `financeiro_dados` table, keyed by `user_id` (the Supabase Auth user's id):

| Column | Shape | Used by |
|---|---|---|
| `contas` | array of `{ id, descricao, valor, vencimento, categoria, status: 'pendente'\|'pago', tipo: 'despesa'\|'receita', pagoEm }` | Contas, Relatório, Categorias |
| `faturamento` | object `{ 'YYYY-MM': number }` — manual monthly revenue entry | Relatório |
| `lembretes` | array of `{ id, dia: 1-31, descricao }` — recurring reminder definitions, seeded via `lembretesPadrao()` (salário 5, contabilidade 10, imposto 20) the first time a user's row is created | Lembretes |
| `lembretes_status` | object `{ 'YYYY-MM': { [lembreteId]: boolean } }` — per-month checklist state | Lembretes |

`carregarDados(userId)` fetches the row on login (`maybeSingle()`); if none exists yet it inserts a fresh default row. Every mutation calls one of `saveContas()`/`saveFaturamento()`/`saveLembretes()`/`saveLembretesStatus()` — all four are thin wrappers around a single **`persist()`** that `upsert`s the *entire* row (all four columns at once) rather than patching individual fields. This is simple but means concurrent edits from two open tabs/devices will clobber each other's most recent unsaved change — acceptable for a single-user internal tool, worth revisiting if multiple people start editing simultaneously.

Reminders are definitions, not dated events: the same `lembretes` list is checked off against a fresh key each calendar month (`currentYm()`), so checkboxes reset automatically without any migration logic.

`setSyncStatus('saving'|'ok'|'error')` drives the small dot+label in the top bar (`#syncDot`/`#syncText`) so a failed `persist()` (e.g. offline) is visible instead of silently losing the edit.

### Page-specific render functions

- **`renderContas()`** — filters `data` by the active tab (`currentFilter`) and search box, sorts by `vencimento`, rebuilds `#list`, then calls `renderSummaryContas()` for the four dashboard cards. Called after every conta mutation (add/edit/delete/mark-paid).
- **`isVencida(item)`** is the single source of truth for "overdue" (status `pendente` + `vencimento` before today) — used for badges and to exclude overdue items from the "a pagar" bucket (counted separately under "vencidas").
- **`renderRelatorio()`** reads the `<input type="month">` value (defaults to current month), sums receitas/despesas pagas whose `pagoEm` falls in that month, and combines with the manual `faturamento[ym]` value: `saldo = faturamento + entrou - saiu`. Editing faturamento toggles `#fatEditRow` inline rather than opening a modal. It also calls **`renderFaturamentoChart(ym)`**, which draws a 12-month rolling bar chart (pure CSS/divs, no chart library) of `faturamento` values ending at the current real month; clicking a bar jumps the month selector to that month and re-renders the whole report.
- **`renderCategorias()`** groups `despesa`-type contas by `categoria` (filtered by the todas/pago/pendente tab) and renders a proportional CSS bar per category, scaled against the largest category total.
- **`renderLembretes()`** sorts reminder definitions by `dia`, cross-references `lembretesStatus[currentYm()]` for checked state, and flags a reminder `vencido` when its `dia` has passed this month and it's still unchecked.

### Shared conventions

- Modal/form pairs (`openModal`/`closeModal` for contas, `openModalLembrete`/`closeModalLembrete` for lembretes) are reused for both create and edit; `editingId`/`editingLembreteId` track which mode is active.
- **Backup/restore** (`btnExport`/`btnImport`) bundles all four state stores into one `.json` (`{version:2, contas, faturamento, lembretes, lembretesStatus}`) and calls `persist()` once on import. Import also accepts a legacy v1 backup (bare array = contas only) for backwards compatibility. This remains a useful safety net even with cloud storage — keep all four stores in the export/import pair if you add a new one.

## Conventions

- Content is in Brazilian Portuguese.
- Currency formatted via `Intl`/`toLocaleString('pt-BR', {style:'currency', currency:'BRL'})` — always use `fmt()`, don't hand-roll formatting.
- Dates are stored as `YYYY-MM-DD` strings (native `<input type="date">` format) so they sort correctly with plain string comparison; `formatDate()` converts to `DD/MM/YYYY` only for display.
- CSS custom properties in `:root` mirror the token names used in the sibling `nexus-finance-completo` project (`--navy`, `--accent`, `--green`, `--red`, `--bg`) for visual consistency across Stellar/Nexus finance tools — keep them in sync if retheming either.
