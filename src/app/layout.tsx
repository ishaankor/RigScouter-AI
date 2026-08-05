import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RigScouter-AI | Intelligent PC Deal Finder & Automated Price Tracker',
  description: 'AI agent for scoring PC hardware deals, building custom rigs, and automated daily price digests across major retailers.',
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
