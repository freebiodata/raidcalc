export const SITE = 'https://raidcalc.top';
export const SITE_NAME = 'RaidCalc';
export const DATA_SNAPSHOT = '2026-10-11';

export function organizationBlock() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE}/#organization`,
    name: SITE_NAME,
    url: `${SITE}/`,
    logo: `${SITE}/favicon.svg`,
    description:
      'Free Rust raid cost and sulfur calculators: raid cost calculator, cheapest raid solver and sulfur farming ETA.',
  };
}

export function websiteBlock() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE}/#website`,
    name: SITE_NAME,
    url: `${SITE}/`,
    publisher: { '@id': `${SITE}/#organization` },
  };
}

export function breadcrumbBlock(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE}/` },
      ...items.map((it, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: it.name,
        item: `${SITE}${it.path}`,
      })),
    ],
  };
}

export function webAppBlock(path: string, name: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    '@id': `${SITE}${path}#app`,
    name,
    url: `${SITE}${path}`,
    description,
    applicationCategory: 'GameApplication',
    operatingSystem: 'Any (browser)',
    browserRequirements: 'Requires JavaScript',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': `${SITE}/#organization` },
  };
}

export function articleBlock(
  path: string,
  headline: string,
  description: string,
  datePublished = '2026-10-11',
  dateModified = DATA_SNAPSHOT,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    '@id': `${SITE}${path}#article`,
    headline,
    description,
    datePublished,
    dateModified,
    author: { '@type': 'Organization', name: SITE_NAME, url: `${SITE}/about/` },
    publisher: { '@id': `${SITE}/#organization` },
    mainEntityOfPage: `${SITE}${path}`,
    image: `${SITE}/og.png`,
  };
}
