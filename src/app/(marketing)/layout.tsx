import JsonLd from '@/components/marketing/JsonLd';
import MarketingNav from '@/components/marketing/MarketingNav';
import MarketingFooter from '@/components/marketing/MarketingFooter';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'FlyteDeck',
  url: 'https://flytedeck.io',
  description:
    'FlyteDeck is the all-in-one platform for experiential production companies. Build interactive proposals, manage clients, track budgets, schedule resources, and run your entire operation — from pitch to wrap.',
};

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col font-[family-name:var(--font-inter)]">
      <JsonLd data={organizationJsonLd} />
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
