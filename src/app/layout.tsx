import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RigScouter-AI | Autonomous PC Hardware Deal Intelligence & Price Tracker',
  description: 'Autonomous PC hardware deal scouting platform featuring multi-retailer scraping, AI deal scoring, and automated daily price digests across Micro Center, Amazon, Newegg, Best Buy, and B&H Photo.',
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
