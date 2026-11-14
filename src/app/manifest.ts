import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RigScouter AI - Hardware Market Intelligence',
    short_name: 'RigScouter AI',
    description: 'Autonomous PC hardware market intelligence and multi-retailer deal tracker.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0b0f19',
    theme_color: '#0b0f19',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/apple-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  };
}

