@AGENTS.md

---

# Media Planner — Project Context

## What this app is

A centralized media planning tool built for an advertising agency. It replaces fragmented spreadsheets
with a single workspace for creating campaigns, building media plans (tactics), tracking budgets, and
generating Insertion Orders and creative spec sheets.

**Production:** https://media-planner-lovat.vercel.app
**Supabase project:** `gjzwbqrvgoaujdqrklth`
**Vercel:** project `prj_76QBdkuwyvx2VprvmjA3djJbPZIU` / team `team_Kc4ydhniOG2EVGfPYU5hNRjf`
**Repo:** https://github.com/nrt1701-lgtm/media-planner

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16.2.0 — App Router, Turbopack. **Read AGENTS.md before touching Next.js APIs.** |
| React | 19.2.4 |
| Auth + DB | Supabase (`@supabase/ssr`) — PostgreSQL + RLS + Auth |
| Client data | SWR (not React Query) |
| Validation | Zod v4 |
| UI components | shadcn/ui v4 + Radix UI — imported as namespace (see below) |
| Styling | Tailwind CSS v4 with OKLch color space |
| Charts | Recharts |
| PDF export | @react-pdf/renderer |
| Excel export | ExcelJS |
| Toasts | Sonner |
| Testing | Vitest |

---

## Brand Tokens

```
Teal (primary)  #1A8A7D   --brand-teal
Rust            #C45A2C   --brand-rust
Gold            #D4A34A   --brand-gold
Dusk            #7A94A8   --brand-dusk
Canyon          #4A3728   --brand-canyon
```

Fonts: **Chakra Petch** (headlines) + **IBM Plex Sans** (body) — loaded via `next/font/google`.

---

## App Structure

```
src/app/
├── (authenticated)/             # Route group — auth guard in layout.tsx (redirects to /login)
│   ├── layout.tsx               # createClient() → getUser() → redirect if null
│   ├── dashboard/               # Campaign list
│   ├── campaigns/[campaignId]/  # Planning workspace (CampaignWorkspace client component)
│   ├── ad-specs/                # Ad spec library
│   ├── utm-templates/           # UTM template editor
│   └── settings/                # Agency settings
├── login/                       # Public auth page
└── api/                         # All API routes — use createClient() from @/lib/supabase/server
```

All API routes follow: `await createClient()` → Supabase query → `Response.json(data)`.
Params are `Promise<{...}>` in Next.js 16 — always `await params`.

---

## Database Schema

16 migrations applied (`supabase/migrations/`). Core tables:

| Table | Purpose | Key columns |
|-------|---------|-------------|
| `clients` | Advertiser accounts | `name`, `client_code`, `industry`, `deleted_at` |
| `campaigns` | Campaign records | `client_id`, `name`, `budget`, `start_date`, `end_date`, `status`, `workamajig_code`, `expense_number` |
| `media_plans` | 1:1 with campaigns, auto-created | `campaign_id`, `audience_strategy` (JSONB), `notes`, `prepared_by` |
| `tactics` | Line items in a plan | `plan_id`, `channel`, `platform`, `placement`, `budget`, `rate_type`, `rate`, `est_impressions`, `audience_id` |
| `audiences` | Named audience segments | `campaign_id`, `name`, `audience_strategy` (JSONB), `sort_order` |
| `ad_spec_library` | Ad format specs | `channel`, `platform`, `name`, `dimensions`, `file_types`, `max_file_size_kb`, `notes` |
| `utm_templates` | Reusable UTM patterns | `name`, `template` (string with `{{variables}}`), `is_default` |
| `agency_settings` | Singleton config | `agency_name`, `io_terms`, `creative_lead_time_days`, `default_utm_template_id` |
| `channels` | Channel reference | `name` (10 defaults: Programmatic Display, Paid Social, etc.) |

Campaign status flow: `draft → planning → approved → active → completed`

Rate types (`RATE_TYPES` constant): `CPM`, `CPC`, `CPA`, `flat_rate`, `custom`

---

## Critical Patterns

### RLS
All tables use open authenticated access — no user-scoped rows:
```sql
FOR ALL TO authenticated USING (true) WITH CHECK (true)
```

### DB Functions — MUST use schema-qualified names
All functions have `SET search_path = ''`. Any table or function reference in a function body **must**
use the `public.` prefix or it will fail at runtime:
```sql
-- correct
INSERT INTO public.media_plans (campaign_id) VALUES (NEW.id);
-- breaks silently
INSERT INTO media_plans (campaign_id) VALUES (NEW.id);
```

### Campaign → MediaPlan is auto-created
The `auto_create_media_plan` trigger fires on every `campaigns` INSERT and creates the paired
`media_plans` row. Never manually insert into `media_plans`.

### Zod strips unknown keys
When a new column is added to the DB, the corresponding Zod validator in `src/lib/validators/`
**must** also be updated or the field is silently dropped on every PATCH/POST.

### SWR functional updaters (patchTactic)
`patchTactic` in `tactics-grid.tsx` uses `mutate((current) => ...)` functional form on both the
optimistic update and the server-confirm step. This prevents stale-closure race conditions when
two fields are patched in rapid succession (e.g. Tab through budget → rate).

### Inline cell Tab navigation
All editable tactic cells use:
- `forwardRef<CellHandle>` with `useImperativeHandle({ focus: () => ref.current?.focus() })`
- `triggerRef` on `SelectTrigger` (for select cells)
- `TAB_ORDER` array in `tactic-row.tsx` drives tab sequence
- New select cells must follow the pattern in `rate-type-select.tsx` / `channel-select.tsx` exactly

### Radix UI import style
```ts
// correct — namespace import
import { Dialog as DialogPrimitive } from "radix-ui"
// <DialogPrimitive.Root> <DialogPrimitive.Trigger> ...

// wrong — named imports from sub-packages
// import { DialogRoot } from "@radix-ui/react-dialog"
```

### Table name gotchas
Two tables have non-obvious names — always use these exact strings in `.from()`:
- Ad specs: `ad_spec_library` (not `ad_specs`)
- Agency config: `agency_settings` (not `settings`)

---

## Key Files

| File | Role |
|------|------|
| `src/components/tactics/tactic-row.tsx` | Inline tactic editor; `TAB_ORDER`, cell refs, `patchTactic` calls |
| `src/components/tactics/tactics-grid.tsx` | SWR data, CRUD helpers, `patchTactic` with functional updater |
| `src/components/campaigns/campaign-workspace.tsx` | Top-level workspace; tabs wiring |
| `src/components/audience/audience-list.tsx` | Audience tab; Plan Details + audience cards |
| `src/lib/validators/tactic.ts` | Zod schema for tactics (must match DB columns) |
| `src/lib/supabase/server.ts` | Server Supabase client (cookie-based auth) |
| `src/app/(authenticated)/layout.tsx` | Auth guard — redirects unauthenticated users |
| `src/lib/constants.ts` | `RATE_TYPES`, `CAMPAIGN_STATUSES`, other enums |
