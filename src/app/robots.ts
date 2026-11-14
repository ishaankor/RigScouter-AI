import { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rigscouter.ai';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/cron/', '/api/keep-alive/'],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

