// JSON-LD builders for SEO. All builders return plain objects; render with <JsonLd />.
//
// Why JSON-LD here: Google's crawlers use Organization to attach the site's
// brand entity, WebSite + SearchAction to opt into the sitelinks search box on
// branded SERPs, and SoftwareApplication on agent detail pages so install counts
// and licenses surface as rich results. (Same pattern npm, HuggingFace, and
// Replicate use; see search-quality docs at developers.google.com/search.)

import { SITE, SITE_URL, absoluteUrl } from './site';
import type { AgentCard } from '@datasetai/db';

type Json = Record<string, unknown>;

export function organizationJsonLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE.legalName,
    alternateName: SITE.name,
    url: SITE_URL,
    logo: absoluteUrl('/icon.svg'),
    description: SITE.description,
    sameAs: [SITE.github, `https://x.com/${SITE.twitter.replace(/^@/, '')}`],
  };
}

export function websiteJsonLd(): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: SITE.legalName,
    url: SITE_URL,
    description: SITE.description,
    publisher: { '@id': `${SITE_URL}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

export function softwareApplicationJsonLd(card: AgentCard, version?: string): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': absoluteUrl(`/agents/${card.id}#software`),
    name: card.name,
    description: card.description,
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    url: absoluteUrl(`/agents/${card.id}`),
    softwareVersion: version,
    license: card.license ?? undefined,
    keywords: card.tags.join(', '),
    dateModified: card.updatedAt.toISOString(),
    author: card.creatorLogin
      ? {
          '@type': 'Organization',
          name: card.creatorLogin,
          url: absoluteUrl(`/creators/${card.creatorLogin}`),
        }
      : undefined,
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/InstallAction',
      userInteractionCount: card.installCountLifetime,
    },
  };
}

export interface PublisherInput {
  username: string;
  displayName: string;
  bio: string;
  isVerifiedPublisher: boolean;
}

export function publisherJsonLd(p: PublisherInput): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': absoluteUrl(`/creators/${p.username}#publisher`),
    name: p.displayName,
    alternateName: p.username,
    url: absoluteUrl(`/creators/${p.username}`),
    description: p.bio || `Agents published by ${p.displayName} on datasetai.xyz.`,
  };
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(items: ReadonlyArray<BreadcrumbItem>): Json {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : absoluteUrl(item.url),
    })),
  };
}
