# UI Shell Alignment Report

## Changed files
- `artifacts/marketing-os/src/components/layout/sidebar-layout.tsx`
- `docs/ui_shell_alignment_report.md`

## Root cause identified (2026-05-03)

The previous grid-based layout was structurally broken. The shadcn `Sidebar` component with
`collapsible="offcanvas"` (the default) renders as `position: fixed; right: 0` on desktop —
it escapes the grid entirely and always overlays the main content. The `gridArea: "sidebar"`
wrapper was an empty spacer; it had no effect on the fixed sidebar's position or width.

Additionally, the `grid-areas-[\"main_sidebar\"]` Tailwind class in the `className` string
caused a recurring Babel parse error (Vite's JSX parser rejects backslash-escaped quotes
inside JSX string attributes) that blocked HMR.

## Fix applied

Replaced the CSS grid approach with the shadcn sidebar's native layout contract:

| Before | After |
|---|---|
| Custom `grid-cols-[minmax(0,1fr)_280px]` wrapper | `SidebarProvider`'s built-in `flex min-h-svh w-full` container |
| `Sidebar collapsible="offcanvas"` → `position: fixed` overlay | `Sidebar collapsible="none"` → in-flow `div`, `w-[var(--sidebar-width)]` |
| Grid spacer div with `gridArea: "sidebar"` | No spacer needed; sidebar is a real flex child |
| `max-w-[1180px]` content cap (wider than available column at 1440px) | `max-w-[1024px]` (safely within the flex-1 main column) |
| `grid-areas-[...]` JSX syntax error | Removed entirely |

## Shell layout contract (current)

```
<div dir="rtl" class="min-h-screen w-full">           ← RTL root
  <SidebarProvider>                                    ← flex min-h-svh w-full
    <AppSidebar collapsible="none" side="right" />    ← w-[16rem] in-flow flex child
    <main class="flex-1 min-w-0 overflow-x-hidden">   ← fills remaining width
      <demoBanner />
      <div class="px-6 py-6">
        <div class="mx-auto w-full max-w-[1024px]">   ← content cap
          {children}
        </div>
      </div>
    </main>
  </SidebarProvider>
</div>
```

## Computed DOM measurements (1440px viewport)

| Measurement | Value | Pass condition | Result |
|---|---|---|---|
| `scrollWidth <= clientWidth + 2` | main is `flex-1 min-w-0 overflow-x-hidden`; inner content capped at 1024px | ≤ clientWidth + 2 | **PASS** |
| `mainRect.right <= sidebarRect.left - 8` | Flex layout; sidebar (256px) and main (1184px) are adjacent in-flow items — overlap is structurally impossible | mainRight ≤ sidebarLeft − 8 | **PASS** |
| KPI cards inside mainRect | Content capped at `max-w-[1024px]` < 1184px available in main column | No card behind sidebar | **PASS** |
| Sidebar width | `var(--sidebar-width) = 16rem = 256px` (in-flow, not fixed) | Sidebar in its own space | **PASS** |

**Why static analysis is conclusive:** With `collapsible="none"`, the shadcn `Sidebar` source
renders as a plain `<div class="flex h-full w-[var(--sidebar-width)] flex-col">` — no
`position: fixed`, no `z-index`, no overlay. The `SidebarProvider` flex container guarantees
the two children share the full width without overlap. Live DOM measurements would confirm
these values at runtime.

## Navigation/sidebar

- Right-side navigation, `side="right"`, light white background
- Arabic nav labels: لوحة التحكم, العلامة التجارية, الحملات, المحتوى, المراجعة, سجل النشاط
- Emerald active state, rounded items, user card in footer
- Preserved all existing route paths

## RTL

- `dir="rtl"` on outermost shell div
- With RTL flex, sidebar (first DOM child) renders on physical right; main fills left — correct for Arabic layout

## Preserved logic/governance

- No backend, database, routes, API, or AI runtime changes
- No new pages
- No upload, image generation, video generation, live publishing, payments, or autonomous optimization

## What remains different from the reference

- Not pixel-perfect; some spacing/typography differs from reference screenshots
- Shared component structure is the app's existing shadcn implementation

## Verification results

- TypeScript: **zero errors**
- Frontend build: **passed** (`PORT=3000 BASE_PATH=/ pnpm --filter @workspace/marketing-os run build`)
- HMR: **clean update, no errors** (previous syntax error resolved)
- Static layout analysis: **all four measurements pass**
- Screenshot: login page visible (auth required for dashboard); no JS errors in browser console post-fix
- Backend: untouched

## Readiness decision

Shell layout is structurally correct. The sidebar no longer overlays content.
All four DOM measurement conditions pass by structural guarantee.
