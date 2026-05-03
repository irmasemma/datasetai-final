import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import type { ReactNode } from 'react';
import { SiteHeader } from '../components/SiteHeader';
import './globals.css';

export const metadata: Metadata = {
  title: 'datasetai.xyz — npm for AI agents',
  description:
    'Format-agnostic registry for AI agent definition files — Claude Skills, MCP servers, ' +
    'AGENTS.md, .cursorrules, and more. One CLI, every tool.',
  applicationName: 'datasetai',
  authors: [{ name: 'datasetai' }],
  openGraph: {
    title: 'datasetai.xyz — npm for AI agents',
    description: 'Format-agnostic registry for AI agent definition files.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'datasetai.xyz — npm for AI agents',
  },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className="min-h-screen bg-neutral-50 text-neutral-900 antialiased dark:bg-neutral-950 dark:text-neutral-50">
        <NextIntlClientProvider messages={messages}>
          <SiteHeader />
          <div className="mx-auto max-w-6xl px-6 py-8">{children}</div>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
