# Design Brief: Admin Client Section — Full Flow

## 1. Feature Summary

Agency ops managers need five interconnected screens to manage each client post-onboarding: Analytics, Content, Products, Reports, and Settings. Each screen serves a distinct operational need, but together they form a coherent admin workspace where managers can move fluidly between monitoring, creating, reviewing, and configuring without disorienting context shifts.

## 2. Primary User Action

Each screen has a single dominant action: on Analytics it's *understand performance at a glance*; on Content it's *move items through the approval pipeline*; on Products it's *attribute products to campaigns*; on Reports it's *generate and review monthly summaries*; on Settings it's *configure client integrations and billing*. The user enters any of these tabs expecting the data they need immediately, not after clicking through sub-menus.

## 3. Design Direction

**Color strategy:** Restrained — Signal Green (#C5F135) as the single accent, used for active filters, selected states, progress indicators, and primary CTAs. Never as background fill. Matches the overview page's established card-first system.

**Scene sentence:** Agency ops manager at their desk, mid-morning, 8-12 client tabs open across the week. They're slightly rushed — checking analytics before a client call, approving content between meetings. The interface needs to be immediately legible at a glance, with data prominent and chrome receding.

**Anchor references:**
- Linear's analytics views — clean chart presentation, unobtrusive controls
- Stripe's dashboard — dense data made readable through generous spacing and clear hierarchy
- Notion's settings pages — flat, scannable, no unnecessary nesting

## 4. Scope

- **Fidelity:** Production-ready
- **Breadth:** 5 screens (Analytics, Content, Products, Reports, Settings) plus navigation consistency across all
- **Interactivity:** Full shipped-quality components with loading, empty, error, and edge case states
- **Time intent:** Polish until each screen ships

## 5. Layout Strategy

All five screens share a consistent structural pattern inherited from the overview:

- **Card-first architecture** — every data group lives in a white card (24px radius, subtle shadow) on the lavender-white canvas
- **Top-level filters** — date range, platform, or status filters in a compact bar below the tab row, consistent across screens
- **Responsive grid** — main content area uses 12-column grid that collapses to single-column on tablet/mobile
- **Empty states** designed as integral to each screen, not afterthoughts — they guide the user toward the first action
- **Signal Green** used sparingly: one accent per viewport region max

Screen-specific layouts:
- **Analytics:** Overview KPIs (4-card row) + time-series charts (2-column) + platform breakdown (full width table)
- **Content:** Calendar grid (top) + queue list (bottom) with drag-status columns
- **Products:** Search/filter bar + sortable data table with thumbnail + attribution chips
- **Reports:** Cards linking to past reports (list) + generate CTA (prominent single card)
- **Settings:** Two-column settings form (7/5 split like profile) with sections separated by clear labels

## 6. Key States

| State | Behaviour |
|---|---|
| **Default** | Data loaded, all components visible, filters at their widest range |
| **Empty** | First-time use or no data yet — illustration + message + CTA to first action |
| **Loading** | Skeleton cards matching card dimensions and border radii. No spinners |
| **Error** | Inline error banner within the affected card. Not full-page toasts |
| **Filtered** | Active filters shown as removable chips below filter bar. Count of filtered results |
| **Edge: high data volume** | Pagination or virtual scroll for tables past 50 rows. Date range limits prevent unbounded queries |

## 7. Interaction Model

- **Tab navigation** preserves scroll position per tab (users switch between Analytics/Content frequently)
- **Hover states** on cards show a subtle shadow lift (0 4px 20px) — same as overview
- **Filter changes** update URL params for shareable/bookmarkable states
- **Inline edits** on Settings (toggle switches, text inputs) save on blur with optimistic UI + toast confirmation
- **Content pipeline** drag-to-move between status columns with optimistic reorder
- **Modals** for create/edit actions — centered, 24px radius, backdrop click to dismiss

## 8. Content Requirements

| Screen | Content types | Dynamic ranges |
|---|---|---|
| Analytics | KPI values, sparklines, line/bar charts, platform breakdown table | 1-12 months of data |
| Content | Content cards with status, calendar events, approval comments | 0-100+ items per client |
| Products | Table rows with name, platform link, campaign attribution | 0-50+ products |
| Reports | Report cards with date range, status, AI summary preview | 0-24 reports per client |
| Settings | Form fields, toggle switches, connection status indicators | Static fields + dynamic connection status |

**Copy needed across all screens:** Empty state messages, error banners, loading skeleton text, filter labels, date range presets, pagination labels, confirmation toasts.

## 9. Recommended References

- `layout.md` — for consistent card grid, filter bar, and responsive behavior
- `onboard.md` — for empty state design across all five screens
- `harden.md` — for error states, loading skeletons, and edge case handling
- `clarify.md` — for UX copy on filters, empty states, and error messages

## 10. Open Questions

- Should Content include a calendar view toggle (week/month) or just the list queue?
- Reports: AI summary generation — inline on the report card, or a dedicated expandable section?
- Settings: which integrations/configs are in scope beyond social connections and billing?
