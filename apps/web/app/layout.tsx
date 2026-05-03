import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { Inter, JetBrains_Mono } from 'next/font/google';
import type { ReactNode } from 'react';
import { SiteHeader } from '../components/SiteHeader';
import { SiteFooter } from '../components/SiteFooter';
import { JsonLd } from '../components/JsonLd';
import { organizationJsonLd, websiteJsonLd } from '../lib/jsonld';
import { SITE, SITE_URL } from '../lib/site';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE.legalName} — ${SITE.tagline}`,
    template: `%s — ${SITE.legalName}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  authors: [{ name: SITE.name, url: SITE_URL }],
  creator: SITE.name,
  publisher: SITE.legalName,
  keywords: [
    'AI agents',
    'Claude Code skills',
    'MCP servers',
    'AGENTS.md',
    '.cursorrules',
    'agent registry',
    'developer tools',
    'cross-tool AI',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE.legalName,
    title: `${SITE.legalName} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: 'summary_large_image',
    site: SITE.twitter,
    creator: SITE.twitter,
    title: `${SITE.legalName} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=window.matchMedia('(prefers-color-scheme: dark)');var h=document.documentElement;function s(){if(d.matches){h.classList.add('dark')}else{h.classList.remove('dark')}}s();d.addEventListener('change',s)}catch(e){}})();`,
          }}
        />
      </head>
      <body className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased">
        <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />
        <NextIntlClientProvider messages={messages}>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-foreground focus:px-3 focus:py-2 focus:text-sm focus:text-background"
          >
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
            {children}
          </main>
          <SiteFooter />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
