# FlyteDeck — Transition Registry

Canonical transition inventory. Every element in this registry has been audited and normalized to the canonical motion system in `src/lib/motion.ts`.

**Legend**: ✅ canonical | 🔧 fixed | ➕ added

---

## Route-Level Transitions

| Route | Trigger | Duration | Easing | Library | Status |
|-------|---------|----------|--------|---------|--------|
| `/app/*` (all admin routes) | mount | 300ms | ease-out | CSS `page-enter` | ➕ added |

---

## Modal / Overlay Lifecycles

| Component | Trigger | Duration | Easing | Library | Status |
|-----------|---------|----------|--------|---------|--------|
| `ReservationModal` | mount | 200ms backdrop / 200ms content | ease-out | CSS `modal-backdrop-in` + `modal-content-in` | 🔧 fixed (was: none) |
| `BookingModal` | mount | 200ms backdrop / 200ms content | ease-out | CSS animation | 🔧 fixed (was: none) |
| `DealFormModal` | mount | 200ms backdrop / 200ms content | ease-out | CSS animation | 🔧 fixed (was: none) |
| `ContactForm` | mount | 200ms backdrop / 200ms content | ease-out | CSS animation | 🔧 fixed (was: none) |

---

## Sidebar / Drawer

| Component | Trigger | Duration | Easing | Library | Status |
|-----------|---------|----------|--------|---------|--------|
| `AdminSidebar` — drawer slide | mobile toggle | `duration-normal` (200ms) | `ease-in-out` | Tailwind transition | 🔧 fixed (was: hardcoded 200ms) |
| `AdminSidebar` — mobile overlay | open | 200ms | ease-out | CSS `fade-in` | ➕ added (was: none) |
| `AdminSidebar` — nav link hover | hover | `duration-fast` (150ms) | default | Tailwind transition | 🔧 fixed (was: hardcoded 150ms) |

---

## Portal / Journey Components (Framer Motion)

| Component | Trigger | Duration | Easing | Library | Status |
|-----------|---------|----------|--------|---------|--------|
| `PhaseSection` | scroll-in-view | `fmTransition.decorative` (500ms) | canonical out easing | Framer Motion | 🔧 fixed (was: 0.7s inline easing) |
| `JourneyContent` hero | mount | `fmTransition.slow` (300ms) | canonical out easing | Framer Motion | 🔧 fixed (was: 0.8s inline easing) |
| `AddOnSelector` — checkbox | toggle | `fmTransition.spring` | spring 500/30 | Framer Motion | 🔧 fixed (was: inline spring config) |
| `AddOnSelector` — price | toggle | `fmTransition.spring` | spring 500/30 | Framer Motion | 🔧 fixed (was: inline spring config) |
| `AddOnSelector` — container | toggle | `duration-slow` (300ms) | default | Tailwind transition | 🔧 fixed (was: `transition-all duration-300`) |
| `InvestmentSummaryBar` — desktop | mount | `fmTransition.slow` (300ms) | canonical out easing | Framer Motion | 🔧 fixed (was: 0.6s inline easing) |
| `InvestmentSummaryBar` — mobile | mount | `fmTransition.springGentle` | spring 200/25 | Framer Motion | 🔧 fixed (was: inline spring config) |
| `InvestmentSummaryBar` — counter | value change | `fmTransition.counter` | spring 120/20 | Framer Motion | 🔧 fixed (was: inline config) |
| `InvestmentSummaryBar` — CTAs | hover/active | `duration-slow` (300ms) | default | Tailwind transition | 🔧 fixed (was: `transition-all duration-300`) |
| `JourneyTimeline` — phase buttons | click | `duration-slow` (300ms) | default | Tailwind transition | 🔧 fixed (was: `transition-all duration-300`) |
| `PhaseSection` — image zoom | hover | `duration-decorative` (500ms) | default | Tailwind transition | 🔧 fixed (was: hardcoded `duration-500`) |

---

## Loading / Skeleton States

| Component | Trigger | Duration | Easing | Library | Status |
|-----------|---------|----------|--------|---------|--------|
| `proposals/loading.tsx` | route pending | Tailwind default `animate-pulse` | ease-in-out | Tailwind | ✅ canonical |
| `clients/loading.tsx` | route pending | Tailwind default `animate-pulse` | ease-in-out | Tailwind | ✅ canonical |
| `pipeline/loading.tsx` | route pending | Tailwind default `animate-pulse` | ease-in-out | Tailwind | ✅ canonical |
| `invoices/loading.tsx` | route pending | Tailwind default `animate-pulse` | ease-in-out | Tailwind | ✅ canonical |
| `settings/loading.tsx` | route pending | Tailwind default `animate-pulse` | ease-in-out | Tailwind | ✅ canonical |
| `settings/profile` spinner | data loading | Tailwind default `animate-pulse` | ease-in-out | Tailwind | ✅ canonical |
| `StripeConnectSetup` spinner | loading | Tailwind default `animate-spin` | linear (spinner OK) | Tailwind | ✅ canonical |
| `QRScanner` scan spinner | loading | Tailwind default `animate-spin` | linear (spinner OK) | Tailwind | ✅ canonical |

---

## Hover / Micro-Interactions

| Pattern | Count | Duration | Easing | Library | Status |
|---------|-------|----------|--------|---------|--------|
| `transition-colors` (button hover) | ~450+ | Tailwind default (150ms) | default | Tailwind | ✅ canonical |
| `transition-opacity` (reveal) | ~3 | Tailwind default (150ms) | default | Tailwind | ✅ canonical |
| `transition-transform` (icon rotate, image zoom) | ~2 | Tailwind default (150ms) | default | Tailwind | ✅ canonical |
| `transition-shadow` (card hover) | 0 (via targeted list) | n/a | n/a | Tailwind | ✅ canonical |

---

## Card Hover Effects (Fixed `transition-all` → targeted)

| Component | Old | New | Status |
|-----------|-----|-----|--------|
| `ProposalCard` | `transition-all duration-200` | `transition-[color,bg,border,opacity,shadow,transform] duration-normal` | 🔧 fixed |
| `people/page` cards | `transition-all duration-200` | `transition-[color,bg,border,opacity,shadow,transform] duration-normal` | 🔧 fixed |
| `budgets/page` cards | `transition-all duration-200` | `transition-[color,bg,border,opacity,shadow,transform] duration-normal` | 🔧 fixed |
| `security/page` cards | `transition-all duration-200` | `transition-[color,bg,border,opacity,shadow,transform] duration-normal` | 🔧 fixed |
| Portal proposal cards | `transition-all duration-200` | `transition-[color,bg,border,opacity,shadow] duration-normal` | 🔧 fixed |
| Portal files page cards | `transition-all` | `transition-[color,bg,border,opacity,shadow]` | 🔧 fixed |
| Marketing compare cards | `transition-all` | `transition-[color,bg,border,opacity,shadow]` | 🔧 fixed |
| Marketing use-cases cards | `transition-all` | `transition-[color,bg,border,opacity,shadow]` | 🔧 fixed |

---

## Progress Bars (Fixed `transition-all` → targeted)

| Component | Old | New | Status |
|-----------|-----|-----|--------|
| `budgets/page` progress | `transition-all` | `transition-[width,opacity]` | 🔧 fixed |
| `crew/onboarding` progress | `transition-all` | `transition-[width,opacity]` | 🔧 fixed |
| `OnboardingChecklist` | `transition-all` | `transition-[width,opacity]` | 🔧 fixed |
| `PackingList` progress | `transition-all` | `transition-[width,opacity]` | 🔧 fixed |
| `MarginChart` bars | `transition-all` | `transition-[width,opacity]` | 🔧 fixed |
| `BurnChart` bars | `transition-all` | `transition-[width,height,opacity]` | 🔧 fixed |
| `reports/pipeline` bars | `transition-all` | `transition-[width,height,opacity]` | 🔧 fixed |
| Portal progress bars | `transition-all` | `transition-[width,opacity]` | 🔧 fixed |

---

## Settings Toggle Switches (Fixed hardcoded duration)

| Component | Old | New | Status |
|-----------|-----|-----|--------|
| `appearance/page` toggle | `duration-200` | `duration-normal` | 🔧 fixed |
| `email-templates/page` toggle | `duration-200` | `duration-normal` | 🔧 fixed |

---

## Other Components

| Component | Trigger | Duration | Easing | Library | Status |
|-----------|---------|----------|--------|---------|--------|
| `PWAInstallPrompt` | mount | 300ms | ease-out | CSS `slide-up-toast` | ➕ added (was: none) |
| `PortalHeader` mobile menu | toggle | `duration-normal` (200ms) | ease-in-out | Tailwind transition | 🔧 fixed (was: `transition-all duration-200` + max-h layout) |
| `PermissionMatrix` pulse | saving | Tailwind `animate-pulse` | ease-in-out | Tailwind | ✅ canonical |

---

## Timer-Based "Animations"

| Component | Usage | Animation Hack? | Status |
|-----------|-------|-----------------|--------|
| `reports/builder` | `setTimeout` for data simulation | No — data delay | ✅ Not a motion concern |
| `webhooks/route` | `setTimeout` for request timeout | No — abort controller | ✅ Not a motion concern |
| `automations/run/route` | `setTimeout` for request timeout | No — abort controller | ✅ Not a motion concern |
| `VenueStep` | `setTimeout(, 150)` blur dismiss | Borderline — dropdown close | ✅ Acceptable (fast duration == 150ms) |
| `automations-config/page` | `setTimeout(, 500)` save delay | No — UX delay | ✅ Not a motion concern |
| `calendar-sync/page` | `setTimeout(, 2000)` copy feedback | No — toast delay | ✅ Not a motion concern |
| `data-privacy/page` | `setTimeout(, 500)` save delay | No — UX delay | ✅ Not a motion concern |
| `QRScanner` | `requestAnimationFrame` | No — video frame processing | ✅ Not a motion concern |

---

## Accessibility

| Feature | Status |
|---------|--------|
| `prefers-reduced-motion` CSS override | ➕ added (globals.css) |
| `useReducedMotion()` hook | ➕ added |
| Framer Motion reduced-motion support | ➕ added (PhaseSection) |
