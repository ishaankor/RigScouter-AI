import type { Metadata, Viewport } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rigscouter.ai';

export const viewport: Viewport = {
  themeColor: '#0b0f19',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'RigScouter AI | Autonomous PC Hardware Market Intelligence & Deal Engine',
    template: '%s | RigScouter AI',
  },
  description:
    'Continuous multi-retailer price tracking and autonomous market intelligence for desktop PC components across Amazon, eBay, Best Buy, and Micro Center with real-time deal scoring and automated briefings.',
  keywords: [
    'PC hardware deal tracker',
    'GPU price drop alerts',
    'computer parts tracker',
    'hardware price intelligence',
    'autonomous scraper',
    'all-time low hardware prices',
    'graphics card prices',
    'CPU price comparisons',
  ],
  authors: [{ name: 'RigScouter AI Engineering Team', url: siteUrl }],
  creator: 'RigScouter AI',
  publisher: 'RigScouter AI',
  applicationName: 'RigScouter AI',
  generator: 'Next.js',
  manifest: '/manifest.json',
  alternates: {
    canonical: siteUrl,
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
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'RigScouter AI',
    title: 'RigScouter AI | Autonomous PC Hardware Deal Intelligence',
    description:
      'Continuous multi-retailer price tracking across Amazon and eBay with real-time deal scoring, all-time-low tracking, and multi-channel alerts.',
    images: [
      {
        url: '/icon.png',
        width: 512,
        height: 512,
        alt: 'RigScouter AI - Autonomous PC Hardware Deal Intelligence',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RigScouter AI | Autonomous PC Hardware Deal Intelligence',
    description:
      'Real-time multi-retailer PC hardware deal intelligence, all-time-low price tracking, and automated multi-channel briefings.',
    images: ['/icon.png'],
    creator: '@RigScouterAI',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'RigScouter AI',
  url: siteUrl,
  description:
    'Autonomous PC hardware market intelligence pipeline tracking components across major retailers with live stock checks and automated deal scoring.',
  applicationCategory: 'ShoppingApplication',
  operatingSystem: 'Any',
  browserRequirements: 'Requires JavaScript. Requires HTML5.',
  offers: {
    '@type': 'Offer',
    price: '0.00',
    priceCurrency: 'USD',
  },
  featureList: [
    'Autonomous Multi-Retailer Scraping',
    'Real-Time Deal Scoring Algorithm',
    'All-Time Low Price Trend Analytics',
    'Automated Multi-Channel Briefings',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#0b0f19] text-[#f3f4f6]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-gray-950 focus:font-bold focus:rounded-lg focus:shadow-lg focus:outline-none"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
