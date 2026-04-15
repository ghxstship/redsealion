import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s — FlyteDeck',
    default: 'Authentication — FlyteDeck',
  },
  description: 'Sign in or create your FlyteDeck account.',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-secondary px-4 font-[family-name:var(--font-inter)]">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-border/50 via-bg-secondary to-background" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
