import type { Metadata } from 'next';
import './globals.css';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';

const fontVariables = '--font-inter --font-jetbrains-mono';

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
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'FlyteDeck',
  },
  other: {
    'apple-touch-icon': '/icons/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="apple-touch-icon" href="/icons/icon.svg" />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
