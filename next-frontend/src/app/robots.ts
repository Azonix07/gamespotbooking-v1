import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://gamespotkdlr.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/invite', '/verify-email', '/forgot-password'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
