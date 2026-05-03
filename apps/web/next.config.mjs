import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Workspace TS-source packages — Next.js transpiles them on the fly
  // so we don't need to pre-build the libs (Architecture AD-1).
  transpilePackages: [
    '@datasetai/api-client',
    '@datasetai/config',
    '@datasetai/core',
    '@datasetai/db',
    '@datasetai/ui',
  ],
  webpack: (config) => {
    // Resolve `.js` import specifiers (NodeNext convention used by workspace packages)
    // to their underlying `.ts` source files when transpiled by Next.js.
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      '.js': ['.ts', '.tsx', '.js'],
      '.mjs': ['.mts', '.mjs'],
    };
    return config;
  },
};

export default withNextIntl(nextConfig);
