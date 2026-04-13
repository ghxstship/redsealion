/**
 * FlyteDeck — Canonical Motion Token System
 *
 * SSOT for all UI motion across the application.
 * Every transition duration, easing, and animation preset MUST reference
 * values defined here. Zero magic numbers in component files.
 *
 * Tailwind v4 mirrors: see globals.css @theme inline block for CSS equivalents.
 */

// ─── Duration tokens (ms) ───────────────────────────────────────────
const duration = {
  instant: 100,   // Micro-interactions: toggle, checkbox, icon swap
  fast: 150,      // Tooltips, dropdowns, hover states
  normal: 200,    // Modals, drawers, cards, most UI
  slow: 300,      // Page transitions, full-screen overlays
  decorative: 500, // Onboarding, empty states, celebratory moments
} as const;

// ─── Easing tokens (cubic-bezier) ───────────────────────────────────
const ease = {
  default: 'cubic-bezier(0.25, 0.1, 0.25, 1)',     // General purpose
  in: 'cubic-bezier(0.4, 0, 1, 1)',                  // Elements exiting
  out: 'cubic-bezier(0, 0, 0.2, 1)',                  // Elements entering
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',              // Repositioning
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',       // Playful / emphasis
  bounce: 'cubic-bezier(0.68, -0.55, 0.27, 1.55)',   // Celebratory only
} as const;

// ─── Easing as arrays (for Framer Motion) ───────────────────────────
const easeArray = {
  default: [0.25, 0.1, 0.25, 1],
  in: [0.4, 0, 1, 1],
  out: [0, 0, 0.2, 1],
  inOut: [0.4, 0, 0.2, 1],
  spring: [0.34, 1.56, 0.64, 1],
  bounce: [0.68, -0.55, 0.27, 1.55],
} as const;

// ─── Semantic presets (declarative) ─────────────────────────────────
const preset = {
  fadeIn:       { opacity: [0, 1],           duration: duration.normal, ease: ease.out },
  fadeOut:      { opacity: [1, 0],           duration: duration.fast,   ease: ease.in },
  slideUp:     { y: [8, 0],     opacity: [0, 1], duration: duration.normal, ease: ease.out },
  slideDown:   { y: [-8, 0],    opacity: [0, 1], duration: duration.normal, ease: ease.out },
  scaleIn:     { scale: [0.95, 1], opacity: [0, 1], duration: duration.normal, ease: ease.out },
  scaleOut:    { scale: [1, 0.95], opacity: [1, 0], duration: duration.fast,   ease: ease.in },
  modalEnter:  { scale: [0.95, 1], opacity: [0, 1], duration: duration.normal, ease: ease.out },
  modalExit:   { scale: [1, 0.98], opacity: [1, 0], duration: duration.fast,   ease: ease.in },
  drawerEnter: { x: ['100%', '0%'], duration: duration.slow, ease: ease.out },
  drawerExit:  { x: ['0%', '100%'], duration: duration.normal, ease: ease.in },
  collapse:    { height: ['auto', 0], opacity: [1, 0], duration: duration.normal, ease: ease.inOut },
  expand:      { height: [0, 'auto'], opacity: [0, 1], duration: duration.normal, ease: ease.inOut },
  skeleton:    { opacity: [0.4, 1, 0.4], duration: 1500, ease: ease.inOut, loop: true },
  pageEnter:   { opacity: [0, 1], y: [4, 0], duration: duration.slow, ease: ease.out },
  pageExit:    { opacity: [1, 0], duration: duration.fast, ease: ease.in },
} as const;

// ─── Framer Motion transition helpers ───────────────────────────────
// Use these in Framer Motion `transition` props instead of inline values.

/** Standard enter transition for Framer Motion */
export const fmTransition = {
  enter: {
    duration: duration.normal / 1000,
    ease: easeArray.out,
  },
  exit: {
    duration: duration.fast / 1000,
    ease: easeArray.in,
  },
  slow: {
    duration: duration.slow / 1000,
    ease: easeArray.out,
  },
  decorative: {
    duration: duration.decorative / 1000,
    ease: easeArray.out,
  },
  page: {
    duration: duration.slow / 1000,
    ease: easeArray.out,
  },
  /** Spring config matching the canonical spring easing feel */
  spring: {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
  },
  /** Soft spring for larger elements */
  springGentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
  },
  /** Animated numbers / counters */
  counter: {
    stiffness: 120,
    damping: 20,
  },
} as const;

// ─── Aggregate export ───────────────────────────────────────────────
const motion = {
  duration,
  ease,
  easeArray,
  preset,
  fm: fmTransition,
} as const;
