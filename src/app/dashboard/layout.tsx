import type { Metadata } from 'next';
import React from 'react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rigscouter.ishaankoradia.com';

export const metadata: Metadata = {
  title: 'Hardware Intelligence & Deal Tracking Dashboard | RigScouter AI',
  description:
    'Real-time multi-retailer PC hardware watchlist, all-time-low price tracking, and autonomous deal intelligence briefings across Amazon, eBay, Best Buy, and Micro Center.',
  keywords: [
    'PC hardware dashboard',
    'GPU price tracker dashboard',
    'hardware watchlist',
    'real-time deal scoring',
    'Amazon PC parts price tracker',
    'eBay hardware deals tracker',
    'automated price briefings',
    'all-time-low hardware prices'
  ],
  alternates: {
    canonical: `${siteUrl}/dashboard`,
  },
  openGraph: {
    title: 'Hardware Intelligence & Deal Tracking Dashboard | RigScouter AI',
    description:
      'Autonomous PC hardware market intelligence pipeline tracking components across major retailers with live stock checks and automated deal scoring.',
    url: `${siteUrl}/dashboard`,
    siteName: 'RigScouter AI',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'RigScouter AI - Hardware Intelligence & Deal Tracking Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Hardware Intelligence & Deal Tracking Dashboard | RigScouter AI',
    description:
      'Autonomous PC hardware market intelligence pipeline tracking components across major retailers with live stock checks and automated deal scoring.',
    images: ['/icon.png'],
    creator: '@RigScouterAI',
  },
};

const dashboardJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Hardware Intelligence & Deal Tracking Dashboard',
  url: `${siteUrl}/dashboard`,
  description:
    'Continuous multi-retailer price tracking and autonomous market intelligence for desktop PC components across Amazon, eBay, Best Buy, and Micro Center.',
  isPartOf: {
    '@type': 'WebApplication',
    name: 'RigScouter AI',
    url: siteUrl,
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteUrl,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Dashboard',
        item: `${siteUrl}/dashboard`,
      },
    ],
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dashboardJsonLd) }}
      />
      {children}
    </>
  );
}
