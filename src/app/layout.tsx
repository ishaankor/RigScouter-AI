import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RigScouter-AI | Autonomous PC Hardware Deal Intelligence & Price Tracker',
  description: 'Autonomous PC hardware deal scouting platform featuring multi-retailer scraping across Amazon and eBay (with Micro Center, Newegg, Best Buy, and B&H Photo coming soon), AI deal scoring, and automated daily price digests.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-height-screen">
        {children}
      </body>
    </html>
  );
}
