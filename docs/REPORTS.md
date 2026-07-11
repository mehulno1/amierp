# Reports Module

Operational and management reporting across procurement, inventory, sales and receivables.
Every report is brand-scoped, renders charts (Recharts) + a sortable drill-down table, and
exports to Excel.

## Access

- Hub: `/reports` — a grid of report cards grouped by section.
- Individual report: `/reports/:slug`.
- Sidebar has a collapsible **Reports** submenu listing the reports available to the user's role.
- Roles: `super_admin`, `admin`, `accounts` see everything; `requisition_admin` additionally
  sees the procurement/inventory reports. Role gating is enforced in `ReportRouter` and the
  route definitions in `App.tsx`.

## Report catalog

| Slug | Report | What it shows |
|------|--------|---------------|
| `open-purchase-orders` | Open Purchase Orders | Confirmed/partially-received POs, ordered vs received qty, pending value, age |
| `procurement-spend` | Procurement Spend | PO value by month / vendor / machine-area (date-ranged) |
| `vendor-performance` | Vendor Performance | PO count, spend, avg lead time, on-time % per vendor |
| `requisition-sla` | Requisition Cycle Time | Approval turnaround, procurement lead, overdue indents by priority |
| `reorder` | Low Stock / Reorder | Items below minimum available stock with suggested reorder qty |
| `inventory-valuation` | Inventory Valuation & Aging | Stock value and age by item type |
| `stock-movement` | Stock Movement Ledger | Inventory transactions + fastest-moving items (date-ranged) |
| `fulfillment` | Order Fulfillment | Open orders, delivery progress, overdue shipments |
| `sales-register` | Sales Register | Revenue by month / client / product, domestic vs export (date-ranged) |
| `dispatch-register` | Dispatch Register | Delivery challans with courier/AWB/LR/vehicle (date-ranged) |
| `receivables` | Receivables / Outstanding | Unpaid order balances with aging buckets |
| `sales-funnel` | Sales Funnel | Enquiry → offer → order conversion by source (date-ranged) |
| `expiring-offers` | Expiring Offers | Sent quotations expiring within 30 days |

## Backend

- Controller: `backend/src/controllers/reportsController.ts` — one handler per report.
- Routes: `backend/src/routes/reports.ts`, mounted at `/api/reports` in `server.ts`.
- Auth: `authenticateToken` + `requireBrandContext` (same as the dashboard). Brand scope is the
  `x-brand-id` header when set, else all of the user's brands.
- All aggregation is pushed into SQL (`GROUP BY` / `SUM` / `DATEDIFF`); responses are
  `{ success, data }` with pre-shaped chart series, table rows and totals. Date-ranged reports
  accept `from` / `to` (`YYYY-MM-DD`) query params, defaulting to the last 12 months.

**No schema changes.** Reports are read-only over existing tables (`purchase_orders`,
`po_receipts`, `requisitions`, `inventory_items`, `inventory_transactions`, `new_orders`,
`order_financials`, `order_deliveries`, `enquiries`, `offers`, …).

### Data caveats (surfaced in-UI)

- **Inventory valuation** has no unit-cost column, so spare/raw/packing items are valued at
  their last purchase rate and finished goods at a same-named product variant's selling price
  (proxy); items with no derivable cost are listed as uncosted and excluded from totals.
- **Vendor on-time %** is computed only where a selected vendor quotation carries quoted
  `delivery_days`; otherwise lead time is reported without an on-time figure.

## Frontend

- Pages under `frontend/src/pages/reports/`, one component per report.
- `registry.ts` maps slug → { title, description, section, icon, component, roles }; consumed by
  the hub (`pages/Reports.tsx`), the router (`ReportRouter.tsx`) and the sidebar.
- Shared helpers in `pages/reports/_shared/`:
  - `ReportShell` — page header, date-range picker, export button, caveat banner.
  - `Charts` — themed Recharts wrappers (`BarCard`, `LineCard`, `DonutCard`).
  - `SortableTable` — column-driven table reusing `useSortable` / `SortIcon`.
  - `chartTheme` — palette from the design tokens + ₹/number formatters + `last12Months()`.
  - `exportSheet` — XLSX single/multi-sheet helpers.
- API client: `reportsApi` in `frontend/src/services/api.ts`.

> **Recharts is pinned to v2 (`^2.15.4`) — do not upgrade to v3.** recharts 3 pulls
> es-toolkit's CommonJS build, which Vite's esbuild dep-optimizer miscompiles into a
> self-referential `require_isUnsafeProperty()` that blanks the entire app on load (recharts is
> in the main module graph via `ReportRouter`). v2 is lodash-based and React 19 compatible.

## Demo data

`backend/scripts/seedDemoReports.js` populates brand 1 with ~9 months of coherent demo data so
every report renders with realistic charts during development:

```bash
cd backend && node scripts/seedDemoReports.js
```

It is **idempotent** — every row it creates is marked with a `DEMO` prefix and the script clears
those (in FK-dependency order) before re-seeding. It never touches non-DEMO data. Do **not** run
it against production.

## Deployment notes

- Backend runs from compiled `dist/` via pm2 (`npm run start`). `npm run build` (tsc) emits JS
  despite repo-wide type-error noise (`noEmitOnError` is off).
- Frontend is a static Vite build served by nginx; `/api/*` is proxied to the backend.
- Reports require no migrations or seed on an environment whose schema already includes
  `po_receipts`, `order_deliveries`, `requisitions.approved_at`,
  `purchase_order_items.spare_part_id` and `inventory_transactions.stock_after`.
