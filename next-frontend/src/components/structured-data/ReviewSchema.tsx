/**
 * Review Schema Component
 * Displays star ratings in search results
 */

export default function ReviewSchema() {
  const reviewSchema = {
    "@context": "https://schema.org",
    "@type": "Review",
    "itemReviewed": {
      "@type": "LocalBusiness",
      "name": "GameSpot - Gaming Lounge Kodungallur",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Kodungallur",
        "addressLocality": "Kodungallur",
        "addressRegion": "Kerala",
        "postalCode": "680664",
        "addressCountry": "IN"
      }
    },
    "reviewRating": {
      "@type": "Rating",
      "ratingValue": "5",
      "bestRating": "5"
    },
    "author": {
      "@type": "Person",
      "name": "Sample Customer"
    },
    "reviewBody": "Amazing gaming experience! Best PS5 gaming lounge in Kodungallur. Professional setup with all the latest games. Highly recommended for gamers in Thrissur district.",
    "datePublished": new Date().toISOString().split('T')[0]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(reviewSchema) }}
    />
  );
}

/**
 * Usage: Replace with actual customer reviews from Google My Business
 * This is a placeholder example showing the structure
 */
