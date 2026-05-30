# Handoff: Ami ERP Redesign — Direction A (Heritage Industrial)

## Overview

This package is the design reference for a full redesign of **amierp** (Ami Global's marketing site + ERP) in the **"Heritage Industrial"** visual direction (called *Direction A* in the source). It covers:

- Public marketing site — homepage, About, Contact, and a representative sub-company page.
- ERP application — login, dashboard overview, and four representative modules (Sales / Quotations, Purchase Requisitions, CRM enquiries, Inventory).

Same type and color system across both surfaces, with the ERP shifted to a denser, more utilitarian rhythm.

## About the Design Files

The files in `source/` are **design references**, not production code.

They are React-via-Babel prototypes rendered inside an HTML "design canvas" that lets multiple full-page mocks sit side-by-side at scale. The components there are intentionally flat: lots of inline styles, no design tokens layer, no routing, no real state, no real data. **Do not copy them verbatim into the codebase.**

The task is to **recreate these designs in the existing amierp codebase** using its established framework, component library, styling system, and conventions. Match the visual outcome — colors, type, spacing, layout, density, behavior — using the codebase's own idioms (its tokens, its design system primitives, its routing, its data layer). If amierp has no established frontend yet, pick a stack appropriate for the team (React + a token-driven CSS solution is a reasonable default) and build a small token + primitives layer first, then assemble screens.

When in doubt, **the HTML preview is the source of truth.** Open `source/Ami Global Redesign.html` in a browser (it self-loads JSX through in-browser Babel) — every screen in this handoff is rendered there.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, layout, and copy are intended to ship as-is. Recreate pixel-faithfully, then plug in real data.

Photography in the mocks is placeholder Unsplash/Pexels stock chosen to read as "iron & steel industrial" — replace with Ami's own plant, product, and process photography before launch.

---

## Design System

### Color tokens

| Token            | Hex / RGBA                  | Usage                                                                 |
| ---------------- | --------------------------- | --------------------------------------------------------------------- |
| `ink`            | `#0d1117`                   | Primary dark — nav, dark sections, ERP shell sidebar, body text on light. |
| `inkSoft`        | `#1a1410`                   | Warm dark — secondary dark panels, footer, card backgrounds on dark.  |
| `paper`          | `#f5f1ea`                   | Warm off-white — primary light background, body text on dark.         |
| `paperAlt`       | `#ece6d8`                   | Alt light — subtle section separators, ERP table row striping.        |
| `warm`           | `#d97247`                   | Copper accent — primary CTA fill, link hover, ERP accent.             |
| `warmDk`         | `#c25a30`                   | Copper deep — labels on light backgrounds, eyebrow/section numerals.  |
| `rule`           | `rgba(245,241,234,0.12)`    | Hairline rule on dark backgrounds.                                    |
| `ruleLt`         | `rgba(20,15,10,0.10)`       | Hairline rule on light backgrounds.                                   |
| `mute`           | `rgba(245,241,234,0.65)`    | Muted text on dark backgrounds.                                       |
| `muteLt`         | `rgba(20,15,10,0.55)`       | Muted text on light backgrounds.                                      |
| Success (chart)  | `#5fb56f`                   | Status dot for connected/healthy state.                               |

### Type system

Three families, all from the IBM Plex super-family:

- **IBM Plex Serif** — display headlines, leadership quote, product H3s, ERP screen titles.
  - Weights used: 300 (large display), 400 (H2/H3), 500 (small bold accents).
  - Headlines use `letter-spacing: -0.025em` to `-0.035em` depending on size. Italic is used for emphasis runs inside headlines, often in `warm` / `warmDk`.
- **IBM Plex Sans** — body copy, UI labels, button text, table data.
  - Weights: 300 (lead paragraphs), 400 (body), 500 (UI labels), 600 (buttons, key data), 700 (rare emphasis).
- **IBM Plex Mono** — small caps eyebrows, section numerals (`01 · The group`), data labels, certification strip, footer meta, status pills.
  - Weights: 400, 500, 600. Always uppercase, `letter-spacing: .18em` to `.22em`. Sizes 10–11px.

Load via Google Fonts: `family=IBM+Plex+Sans:wght@300;400;500;600;700&family=IBM+Plex+Serif:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600`.

#### Type ramp (marketing site)

| Role                            | Family            | Size   | Weight | Line-height | Letter-spacing |
| ------------------------------- | ----------------- | ------ | ------ | ----------- | -------------- |
| Hero headline                   | IBM Plex Serif    | 96 px  | 300    | 0.98        | -0.035em       |
| Section H2 (large)              | IBM Plex Serif    | 64 px  | 300    | 1.0         | -0.03em        |
| Section H2 (medium)             | IBM Plex Serif    | 52 px  | 300    | 1.05        | -0.025em       |
| Pull quote                      | IBM Plex Serif    | 56 px  | 300    | 1.1         | -0.025em       |
| CTA / banner heading            | IBM Plex Serif    | 44 px  | 400    | 1.05        | -0.02em        |
| Card H3 (company / industry)    | IBM Plex Serif    | 22 px  | 400    | 1.15        | -0.01em        |
| Lead paragraph                  | IBM Plex Sans     | 18 px  | 300    | 1.55        | normal         |
| Body                            | IBM Plex Sans     | 15 px  | 400    | 1.6–1.65    | normal         |
| Card description                | IBM Plex Sans     | 13 px  | 400    | 1.5–1.55    | normal         |
| Button                          | IBM Plex Sans     | 13 px  | 600    | —           | .06em, UPPER   |
| UI label / sub                  | IBM Plex Sans     | 12 px  | 500    | —           | .02em          |
| Section eyebrow / numeral       | IBM Plex Mono     | 11 px  | 400–500| —           | .22em, UPPER   |
| Card numeral / data label       | IBM Plex Mono     | 10 px  | 500    | —           | .18em, UPPER   |
| Footer meta / nav meta strip    | IBM Plex Mono     | 10 px  | 400    | —           | .16em, UPPER   |

#### Type ramp (ERP)

ERP uses the same families but tighter sizes for density.

| Role                            | Family            | Size   | Weight | Notes                           |
| ------------------------------- | ----------------- | ------ | ------ | ------------------------------- |
| Screen title                    | IBM Plex Serif    | 28–32  | 300–400| -0.02em                         |
| Section title                   | IBM Plex Serif    | 18     | 500    |                                 |
| Breadcrumb / nav item           | IBM Plex Sans     | 13     | 400–500|                                 |
| Sidebar item                    | IBM Plex Sans     | 13     | 400    | 500 when active                 |
| Table header                    | IBM Plex Mono     | 10     | 500    | .18em uppercase                 |
| Table cell                      | IBM Plex Sans     | 13     | 400    |                                 |
| Numeric / KPI value             | IBM Plex Serif    | 40–56  | 300    | tabular numerals                |
| Status pill                     | IBM Plex Mono     | 10     | 500    | .14em uppercase, 4 px radius    |

### Spacing & layout

- Marketing canvas width: **1440 px** content frame. Section gutters: **56 px** left/right. Vertical section padding typically `120px 56px` (top-light: 80–100, bottom-heavy: 120–160).
- Hero stacks heading + lead paragraph on a 12-column implicit grid; large display headlines hang off the left edge.
- Card grids: typical companies grid is 4 columns × 1 row, gap **1 px** with `background: ruleLt` and `border: 1px solid ruleLt` so the gap reads as a hairline divider, not whitespace. Cards inherit `background: paper`.
- ERP shell: fixed left sidebar **240 px**, top bar **56 px** tall, content area uses **24 px** outer padding and **16 px** inner gaps. Tables: **48 px** row height, **12 px** vertical padding, **20 px** horizontal padding, hairline `ruleLt` row borders.

### Border radius

- **0 px** for almost everything — sections, cards, photos, buttons (this is core to the heritage-industrial feel).
- **2 px** for inline pills, ERP status badges, small chips.
- **50%** for avatar circles and chart point markers.
- **4 px** corner radius on form inputs only when needed for affordance (most inline inputs are radius 0).

### Borders & rules

- Hairlines only (1 px), no thick strokes.
- On dark: `1px solid rgba(245,241,234,0.12)` (`rule`).
- On light: `1px solid rgba(20,15,10,0.10)` (`ruleLt`).

### Shadows

- No drop shadows on cards or buttons. Depth comes from color blocking + hairlines, not elevation.
- Optional 1 px inner top highlight on dark CTA buttons if a tactile feel is wanted: `inset 0 1px 0 rgba(255,255,255,.05)`.

### Iconography

- Strokes: 1.25–1.5 px, square caps, no rounded line joins.
- 14–18 px in body flow, 16–24 px in buttons.
- "Arrow-NE" link affordance (↗) is used consistently for cross-page links (`Visit company ↗`, `Read the spec sheet ↗`).
- Avoid emoji entirely.

### Photography treatment

- All imagery is duotone-friendly. Captions sit on a 40–60% black gradient overlay anchored to the bottom of the image.
- Aspect ratios used: `4/5` portrait (hero side image, sub-company hero), `4/3` (company cards), `3/4` (industry tiles), `16/9` (banners), `auto` (login full-bleed).
- A tiny IBM Plex Mono caption label (e.g., `· ami pipes · plant 02 · khopoli`) sits at the bottom-left of every photo in `warm` or `paper` depending on the surface.

### Buttons

| Variant                | Background | Text   | Border             | Padding         | Font                                  |
| ---------------------- | ---------- | ------ | ------------------ | --------------- | ------------------------------------- |
| Primary (on light)     | `ink`      | `warm` | none               | 20 px / 32 px   | Plex Sans 13/600, .06em, UPPERCASE    |
| Primary (on warm)      | `ink`      | `warm` | none               | 20 px / 32 px   | same                                  |
| Primary (on dark)      | `warm`     | `ink`  | none               | 20 px / 32 px   | same                                  |
| Secondary              | transparent| `paper`/`ink` | 1px `rule`/`ruleLt`| 14 px / 24 px | Plex Sans 12/500, .04em, UPPERCASE    |
| Inline link            | —          | inherit| none               | —               | weight 600 + arrow-NE icon            |

Hover: shift to the opposite color pair (e.g., primary-on-light → swap `ink ↔ warm`). Active: 1 px translateY. Focus: 2 px outline in `warm`.

### Inputs

- 1 px solid `ruleLt` on light / `rule` on dark.
- Height 40 px (marketing forms) / 36 px (ERP).
- 12 px horizontal padding, IBM Plex Sans 14 / 13.
- Placeholder: `muteLt` / `mute`.
- Focus: border becomes `warm`, no glow.

### Logos & wordmark

- Wordmark is `AMI` set in IBM Plex Serif Bold (700), `letter-spacing: -0.02em`, paired with a sub-label (`GROUP`, `ERP`, `PIPES`) in IBM Plex Mono Medium, ~42% of the AMI size, copper-accent color, `letter-spacing: .18em`.
- On dark surfaces: `AMI` is `paper`, sub is `warm`.
- On light surfaces: `AMI` is `ink`, sub is `warmDk`.

---

## Screens / Views

The HTML preview (`source/Ami Global Redesign.html`) shows every screen side-by-side. Below is the inventory and notes.

### Marketing site

#### 1. Homepage (`HomeA` in `direction-a.jsx`)

Full-page scroll, ~3600 px tall at 1440 wide. Sections in order:

1. **Nav** — sticky, two-tier on dark `ink`. Meta strip (ESTD · 1985, ISO compliance, location) on top in Mono caps. Main row: wordmark left, primary nav center (`Group`, `Companies`, `Capabilities`, `Industries`, `Contact`), inline ERP login on right (mini status dot + two inputs + Sign in →).
2. **Hero** — left column: copper eyebrow `Heavy engineering · since 1985`, 96 px serif headline with italic accent in `warm`, lead paragraph, two CTAs (`Request a quote`, `View capabilities`). Right column: tall 4/5 photo with caption tag.
3. **Logo / client strip** — 7 client/standard names in Mono caps, separated by hairlines.
4. **The group (companies)** — 4-column hairline-gap grid. Each card: numeral `01`, 4/3 photo, name in Plex Serif 22, copper sub-tag, description, `Visit company ↗`. **No Ami Bio Fuels** (out of operations).
5. **Capabilities** — 40/60 split. Left: eyebrow + headline + lead. Right: 2×2 stat grid (1.2M t capacity, 14 mm wall thickness, 38 export markets, 100% in-house NDT) in `Stat` style.
6. **Industries we supply** — dark `ink` section, 4-column grid of 3/4 photo tiles (Primary steelmaking, Oil & gas, Automotive & furniture, LPG distribution).
7. **Certifications strip** — `LogoStrip` of standards (ISO 9001, IS 3196 / 3601, API 5L, ASTM A106 / A53, BS EN 10210, JIS G 3454, PED 2014/68/EU).
8. **Leadership pull quote** — 56 px serif quote, founder portrait circle + name + title.
9. **CTA banner** — full-width `warm` band, headline + dark button.
10. **Footer** — five columns on `inkSoft`: brand blurb + four link columns (Companies, Products, Company, Contact).

#### 2. About (`AboutA` in `subpages-a.jsx`)

Hero with breadcrumb, then a 5-tile **history timeline** (1985 Founded → 2025 today), then a "What we make" block, leadership grid, plant locations. ~2400 px tall.

#### 3. Contact (`ContactA` in `subpages-a.jsx`)

Two-column: form left (Plex Sans inputs, 1 px rules, full-width textarea), contact info + plant addresses right. Footer reused.

#### 4. Sub-company page — Ami Pipes (`SubCoA` in `subpages-a.jsx`)

Breadcrumb (`Group › Companies › Ami Pipes Pvt. Ltd.`), large serif title with `Pvt. Ltd.` italicized in `warm`, lead paragraph, big 4/5 photo. Sections for product specs, plant info, contact. Treat as a template — Ami Enterprises, Ami Cylinders, Zatakia Commercial follow the same shape.

### ERP application

Shared shell `ErpShell` (see `erp-a.jsx`): left sidebar with company switcher pill, nav groups (Dashboard, Sales & Quotations, Requisitions, CRM, Inventory, Production, Finance, Settings), top bar with breadcrumb + screen title + actions, content body.

#### 5. Login (`LoginA`)

Split screen 1.1:1. Left: full-bleed steel-mill photo on `ink` with 55→85% black gradient overlay, wordmark (sub `ERP`) top-left, large serif marketing headline + KPI row (open orders / live RFQs / etc.) bottom-left. Right: centered login form on `paper` — wordmark, "Sign in to Ami ERP" Plex Serif 32, two inputs (email + password), copper primary button, "Forgot password" + "Talk to admin" links, version footer.

#### 6. Dashboard (`DashboardA`)

Breadcrumb `Ami Enterprises › Dashboard`. KPI strip (4 cards), order pipeline bar chart, recent quotations table, "Open requisitions" list, "Plant pulse" status block.

#### 7. Sales / Quotations (`SalesA`)

Filter bar (status pills + search + date range), table of quotations with columns: `Quote #`, `Customer`, `Items`, `Value`, `Status`, `Owner`, `Updated`. Status pills use `warm` (Pending), `success` (Won), `mute` (Draft), `inkSoft` (Lost). Right rail: quick-detail drawer.

#### 8. Requisitions (`RequisitionsA`)

Same shell. Kanban or stacked-list view of PRs by stage (Draft → Approval → PO Issued → Received). Each card: PR number, item summary, requested-by avatar, plant tag, value.

#### 9. CRM — Enquiry pipeline (`CrmA`)

Kanban-by-stage view of inbound enquiries (New / Qualifying / Quoted / Negotiation / Won / Lost), with stage value totals in the column headers in Plex Serif 28 light.

#### 10. Inventory — Finished goods (`InventoryA`)

Dense table — SKU, description, grade, OD × WT, stock at each plant, on-order, status, last updated. Plant columns are tabular numerals.

---

## Interactions & Behavior

- **Navigation:** sticky top nav, no hamburger at 1440. Sub-nav lives in the secondary meta strip. Below 900 px width, collapse to a drawer.
- **Hover states:** links shift from `mute` → `paper` (on dark) / `muteLt` → `ink` (on light) and gain a 1 px underline in `warm`. Buttons swap their fg/bg pair. Cards do not lift — they get a 1 px `warm` border on hover.
- **Focus:** 2 px outline in `warm` with 2 px offset, always visible (do not remove for mouse).
- **Form validation:** inline messages in Plex Sans 12, color `warmDk`, anchored below the field with a 1 px left border in `warmDk`. No icons.
- **Status:** dot indicator (8 px, `5fb56f` for healthy, `warm` for warning, `warmDk` for error, `muteLt` for idle) precedes the label.
- **Tables:** sortable headers, sticky first column for wide tables, row hover background = `paperAlt`. Selection: 1 px left border in `warm` + 2 px inset bg tint.
- **Empty states:** no illustrations. A Plex Serif 22 light headline + one-line Plex Sans 13 description + one secondary button, centered on a `paperAlt` panel.
- **Animations:** keep motion functional. Use 160 ms ease-out for hover/focus, 240 ms ease-in-out for panel open/close, 320 ms for route transitions. No spring physics, no parallax.

---

## State Management

The mocks are stateless. For the real build:

- **Auth:** the login screen submits to amierp's existing auth. The header inline ERP login on the marketing site is a convenience link to the same flow.
- **Company context:** the ERP sidebar shows a company switcher (`Ami Enterprises` etc.) — this is the active tenant context that scopes every list/query downstream.
- **Module data:** each module is a standard CRUD list view + detail panel. Server-side pagination on tables, debounced search, filter chips reflected in the URL query string.
- **Real-time:** the dashboard "Plant pulse" block expects a polling or websocket subscription to plant telemetry; if there is no such backend yet, render the last cached value with the last-updated timestamp.

---

## Design Tokens (export-ready)

```ts
export const tokens = {
  color: {
    ink: '#0d1117',
    inkSoft: '#1a1410',
    paper: '#f5f1ea',
    paperAlt: '#ece6d8',
    warm: '#d97247',
    warmDk: '#c25a30',
    rule: 'rgba(245,241,234,0.12)',
    ruleLt: 'rgba(20,15,10,0.10)',
    mute: 'rgba(245,241,234,0.65)',
    muteLt: 'rgba(20,15,10,0.55)',
    success: '#5fb56f',
  },
  font: {
    serif: '"IBM Plex Serif", Georgia, serif',
    sans: '"IBM Plex Sans", -apple-system, system-ui, sans-serif',
    mono: '"IBM Plex Mono", ui-monospace, "SF Mono", monospace',
  },
  radius: { none: 0, sm: 2, md: 4, pill: 999, circle: '50%' },
  rule: { dark: '1px solid rgba(245,241,234,0.12)', light: '1px solid rgba(20,15,10,0.10)' },
  space: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 56, 64, 80, 96, 120, 160],
  ease: { out: 'cubic-bezier(0.16, 1, 0.3, 1)', inOut: 'cubic-bezier(0.65, 0, 0.35, 1)' },
};
```

---

## Assets

- **Type:** IBM Plex (Serif / Sans / Mono) — open source, OFL. Self-host or use Google Fonts.
- **Photography in mocks:** Unsplash + Pexels stock chosen to read iron/steel. **Replace before launch** with Ami's own plant/product photography. Suggested shot list:
  - Plant exteriors at golden hour for hero (Khopoli / Wada).
  - Worker portraits with PPE for "people of Ami" sections.
  - Process shots: oxygen lancing in use at a steel mill, ERW tube line, cylinder hydro-test rig.
  - Product close-ups: cross-section of a finished pipe, stamped certification mark, stacked cylinder pallet.
  - Raw material yard for Zatakia Commercial.
- **Icons:** use any 1.25–1.5 px stroke set with square caps. Tabler Icons or Phosphor (regular weight) both work; pick one and stick to it.
- **No emoji.**

---

## Files

In `source/`:

| File                          | What it contains                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------- |
| `Ami Global Redesign.html`    | The viewable index — open in a browser to see every screen rendered side-by-side on a canvas.    |
| `direction-a.jsx`             | Homepage A: nav, hero, companies grid, capabilities, industries, certifications, leadership, CTA, footer. |
| `subpages-a.jsx`              | Marketing sub-pages: About / Contact / Sub-company (Ami Pipes as the template).                   |
| `erp-a.jsx`                   | ERP shell + Login + Dashboard + Sales/Quotations + Requisitions + CRM + Inventory.                |
| `shared.jsx`                  | Shared primitives — `Wordmark`, `InlineLogin`, `LogoStrip`, `Stat`, `Rule`, `Icon`, `TechGrid`, `Photo`, plus the `PHOTOS` URL map. |
| `design-canvas.jsx`           | Pan/zoom canvas host — needed for the HTML preview, not for the real build.                       |

### How to view locally

```sh
cd source/
# any static server will do
python3 -m http.server 8080
# open http://localhost:8080/Ami%20Global%20Redesign.html
```

The page loads React + Babel from a CDN and compiles the JSX in the browser. No build step.

---

## Suggested order of implementation

1. **Token + primitives layer first.** Wire up the color tokens, type styles, button/input/badge primitives, and the `Wordmark` in the real codebase. Verify them on a token preview page.
2. **`ErpShell` + Login.** Get the auth flow and base shell right — every other ERP screen consumes it.
3. **Dashboard.** Hooks up real telemetry and forces you to confirm KPI / chart / table primitives.
4. **One CRUD module end-to-end** (suggest: Sales / Quotations). Once one module's list + filters + detail drawer is solid, the others repeat the pattern.
5. **Marketing site.** Homepage, then About, then Contact, then sub-company pages from the same template. The marketing site can ship in parallel — it shares the token layer but doesn't depend on the ERP shell.
6. **Photography swap.** Replace stock imagery with Ami's own shots once available.

---

## Open questions to confirm with the Ami team

- Final list of group companies (handoff assumes four — Ami Enterprises, Ami Pipes, Ami Cylinders, Zatakia Commercial — with Ami Bio Fuels removed).
- ERP modules in scope for v1 vs later (Production and Finance shells are sketched but not designed in detail).
- Authentication model (SSO via Microsoft / Google, or username/password).
- Multi-language requirements (currently English-only mock).
- Logo treatment — the wordmark in these mocks is a typeset placeholder. Confirm whether to keep the typeset mark or commission a custom logotype.
