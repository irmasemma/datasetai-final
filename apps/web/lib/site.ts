// Canonical site URL + brand metadata. Single source of truth for SEO/OG/JSON-LD.

const RAW =
  process.env['NEXT_PUBLIC_SITE_URL'] ??
  process.env['SITE_URL'] ??
  (process.env['VERCEL_URL'] ? `https://${process.env['VERCEL_URL']}` : null) ??
  'https://datasetai.xyz';

export const SITE_URL = RAW.replace(/\/$/, '');

export const SITE = {
  url: SITE_URL,
  name: 'datasetai',
  legalName: 'datasetai.xyz',
  domain: 'datasetai.xyz',
  tagline: 'npm for AI agents',
  description:
    'Format-agnostic registry for AI agent definition files — Claude Skills, MCP servers, ' +
    'AGENTS.md, .cursorrules, and more. One CLI, every tool.',
  twitter: '@datasetai',
  github: 'https://github.com/datasetai',
} as const;

export function absoluteUrl(path: string): string {
  if (!path.startsWith('/')) return `${SITE_URL}/${path}`;
  return `${SITE_URL}${path}`;
}
