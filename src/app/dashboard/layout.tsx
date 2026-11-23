import type { Metadata } from 'next';
import React from 'react';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rigscouter.ishaankoradia.com';

export const metadata: Metadata = {
  title: 'Hardware Intelligence & Deal Tracking Dashboard',
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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

const dashboardJsonLd = [
  {
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
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Which retailers are tracked on the RigScouter AI Dashboard?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'RigScouter AI continuously monitors active product listings, stock states, and pricing deltas across Amazon and eBay, with Best Buy and Micro Center integrations in staged testing.',
        },
      },
      {
        '@type': 'Question',
        name: 'How does the Deal Scoring Engine compute hardware savings?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The deal scoring algorithm evaluates multi-factor signals including deviation from manufacturer suggested retail price (MSRP), historical all-time-low benchmarks, 24-hour and 7-day volatility deltas, and cross-retailer competition.',
        },
      },
      {
        '@type': 'Question',
        name: 'How are price drop alerts and daily morning digests dispatched?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Alerts are dispatched instantly via automated Discord webhooks when components drop below configured target prices, and summarized daily at 08:00 UTC via automated morning digests.',
        },
      },
    ],
  },
];

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
