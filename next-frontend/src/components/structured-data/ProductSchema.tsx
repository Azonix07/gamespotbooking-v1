/**
 * Product Schema Component
 * For gaming packages/services
 */

interface ProductSchemaProps {
  name: string;
  description: string;
  price: string;
  currency?: string;
  availability?: string;
  url?: string;
}

export default function ProductSchema({
  name,
  description,
  price,
  currency = "INR",
  availability = "InStock",
  url = ""
}: ProductSchemaProps) {
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": name,
    "description": description,
    "brand": {
      "@type": "Brand",
      "name": "GameSpot Kodungallur"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://gamespotkdlr.com${url}`,
      "priceCurrency": currency,
      "price": price,
      "availability": `https://schema.org/${availability}`,
      "priceValidUntil": new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 90 days from now
      "seller": {
        "@type": "Organization",
        "name": "GameSpot - Gaming Lounge Kodungallur"
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "150"
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
    />
  );
}
