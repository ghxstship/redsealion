'use client';

/**
 * PageTransition — CSS-only page enter animation.
 *
 * Uses the canonical `page-enter` animation defined in globals.css.
 * Respects prefers-reduced-motion at the CSS level (animation disabled).
 *
 * Wrap page content in this component to get consistent route transitions.
 */
export default function PageTransition({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="animate-page-enter">
      {children}
    </div>
  );
}
