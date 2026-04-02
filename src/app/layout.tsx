import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://flytedeck.io'),
  title: {
    default: 'FlyteDeck — The Operating System for Experiential Production',
    template: '%s | FlyteDeck',
  },
  description:
    'FlyteDeck is the all-in-one platform for experiential production companies. Build interactive proposals, manage clients, track budgets, schedule resources, and run your entire operation — from pitch to wrap.',
  keywords: [
    'experiential production',
    'event production software',
    'proposal builder',
    'experiential marketing',
    'brand activation',
    'live events',
    'trade show management',
    'creative production',
    'event budgeting',
    'production management',
    'client portal',
    'interactive proposals',
    'experiential agency',
    'event planning software',
    'production operations',
  ],
  openGraph: {
    title: 'FlyteDeck — The Operating System for Experiential Production',
    description:
      'FlyteDeck is the all-in-one platform for experiential production companies. Build interactive proposals, manage clients, track budgets, schedule resources, and run your entire operation — from pitch to wrap.',
    siteName: 'FlyteDeck',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FlyteDeck — The Operating System for Experiential Production',
    description:
      'FlyteDeck is the all-in-one platform for experiential production companies. Build interactive proposals, manage clients, track budgets, schedule resources, and run your entire operation — from pitch to wrap.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full flex flex-col antialiased">{children}</body>
    </html>
  );
}
