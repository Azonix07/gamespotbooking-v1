import type { Metadata } from 'next';
import HomePageClient from './HomePageClient';

export const metadata: Metadata = {
  title: 'GameSpot Kodungallur - #1 Premium Gaming Lounge | PS5, Xbox, VR Gaming',
  description: 'GameSpot is the best gaming lounge in Kodungallur, Thrissur, Kerala. Book PS5, Xbox Series X, Meta Quest VR sessions. Premium gaming cafe near Kodungallur, Irinjalakuda, Guruvayur & Chalakudy. Professional setup, 50+ games, competitive pricing.',
  keywords: [
    'GameSpot Kodungallur', 'gaming lounge Kodungallur', 'PS5 gaming Kodungallur',
    'best gaming cafe Kodungallur', 'VR gaming near Kodungallur', 'gaming zone Thrissur',
    'Xbox gaming Kerala', 'gaming near me Kodungallur', 'PlayStation 5 Kodungallur',
    'gaming cafe near Irinjalakuda', 'gaming lounge near Guruvayur',
  ],
  alternates: {
    canonical: 'https://gamespotkdlr.com',
  },
  openGraph: {
    title: 'GameSpot Kodungallur - #1 Premium Gaming Lounge in Kerala',
    description: 'Experience next-generation gaming at Kodungallur\'s best gaming lounge. PS5, Xbox Series X, Meta Quest VR. Book your session now!',
    url: 'https://gamespotkdlr.com',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'GameSpot Kodungallur Gaming Lounge' }],
  },
};

/* JSON-LD Structured Data for Local Business SEO */
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://gamespotkdlr.com',
  name: 'GameSpot - Premium Gaming Lounge',
  alternateName: 'GameSpot Kodungallur',
  description: 'Premium gaming lounge in Kodungallur offering PS5, Xbox Series X, and Meta Quest VR gaming sessions. Professional setup, 50+ games, and competitive pricing.',
  url: 'https://gamespotkdlr.com',
  telephone: '+91-XXXXXXXXXX', // Replace with actual phone number
  image: 'https://gamespotkdlr.com/assets/images/logo.png',
  logo: 'https://gamespotkdlr.com/assets/images/logo.png',
  priceRange: '₹₹',
  currenciesAccepted: 'INR',
  paymentAccepted: 'Cash, UPI, Google Pay, PhonePe, Card',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Kodungallur', // Replace with actual street address
    addressLocality: 'Kodungallur',
    addressRegion: 'Kerala',
    postalCode: '680664', // Replace with actual postal code
    addressCountry: 'IN',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 10.2269, // Replace with actual coordinates
    longitude: 76.1950,
  },
  areaServed: [
    { '@type': 'City', name: 'Kodungallur' },
    { '@type': 'City', name: 'Irinjalakuda' },
    { '@type': 'City', name: 'Thrissur' },
    { '@type': 'City', name: 'Guruvayur' },
    { '@type': 'City', name: 'Chalakudy' },
    { '@type': 'City', name: 'Angamaly' },
    { '@type': 'State', name: 'Kerala' },
  ],
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '10:00',
      closes: '22:00',
    },
  ],
  sameAs: [
    // Add your social media URLs here
    // 'https://instagram.com/gamespot_kodungallur',
    // 'https://facebook.com/gamespotkodungallur',
  ],
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Gaming Sessions',
    itemListElement: [
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'PS5 Gaming Session', description: 'PlayStation 5 gaming session with 50+ games' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'Xbox Series X Gaming Session', description: 'Xbox Series X gaming session' },
      },
      {
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: 'VR Gaming Experience', description: 'Meta Quest VR gaming experience' },
      },
    ],
  },
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.8',
    reviewCount: '150', // Update with actual review count
    bestRating: '5',
  },
};

/* Website structured data for sitelinks searchbox */
const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'GameSpot Kodungallur',
  alternateName: 'GameSpot Gaming Lounge',
  url: 'https://gamespotkdlr.com',
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <HomePageClient />
    </>
  );
}
