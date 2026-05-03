import { getRequestConfig } from 'next-intl/server';

// MVP ships English only; locale routing is added in Phase 2.
// See PRD NFR-I18N-1..3 + Architecture AD-11.
export default getRequestConfig(async () => {
  const locale = 'en';
  const messages = (await import(`./messages/${locale}.json`)).default as Record<string, string>;
  return { locale, messages };
});
