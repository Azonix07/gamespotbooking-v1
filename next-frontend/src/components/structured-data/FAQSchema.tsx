/**
 * FAQ Schema Component
 * Displays rich FAQ results in Google Search
 */

export default function FAQSchema() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "Where is GameSpot gaming lounge located in Kodungallur?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "GameSpot is located in Kodungallur, Thrissur District, Kerala 680664. We are easily accessible from Irinjalakuda, Thrissur, Guruvayur, Chalakudy, and Angamaly. Check our Contact page for exact directions."
        }
      },
      {
        "@type": "Question",
        "name": "What gaming consoles are available at GameSpot Kodungallur?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We offer PlayStation 5 (PS5), Xbox Series X, and Meta Quest VR gaming experiences. All consoles are equipped with the latest games and professional gaming peripherals."
        }
      },
      {
        "@type": "Question",
        "name": "How much does it cost to play PS5 at GameSpot?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Our PS5 gaming sessions start at affordable hourly rates. We offer flexible packages including hourly rentals, membership plans, and special discounts for students and bulk bookings. Visit our Booking page for current pricing."
        }
      },
      {
        "@type": "Question",
        "name": "What are GameSpot Kodungallur's operating hours?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "GameSpot is open daily from 9:00 AM to 12:00 AM (Midnight), Monday through Sunday. Last booking must end by midnight. We recommend booking online at gamespotkdlr.com to ensure availability during peak hours."
        }
      },
      {
        "@type": "Question",
        "name": "Can I book a gaming session online?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! You can book your gaming session online at gamespotkdlr.com/booking. Choose your preferred console (PS5, Xbox, or VR), select date and time, and confirm your booking instantly. Walk-ins are also welcome subject to availability."
        }
      },
      {
        "@type": "Question",
        "name": "Does GameSpot host gaming tournaments and events?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Absolutely! We regularly host gaming tournaments, birthday parties, and college gaming events in Kodungallur. Contact us for custom event bookings and special packages for groups."
        }
      },
      {
        "@type": "Question",
        "name": "What games are available at GameSpot?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "We have 50+ popular titles including FIFA, Call of Duty, GTA 5, Spider-Man, God of War, Forza Horizon, Halo Infinite, Beat Saber VR, and many more. Visit our Games page for the complete list updated regularly."
        }
      },
      {
        "@type": "Question",
        "name": "Is there a membership plan at GameSpot Kodungallur?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we offer flexible membership plans with significant discounts for regular gamers. Memberships include benefits like priority booking, discounted rates, and exclusive access to new game releases. Check our Membership page for details."
        }
      },
      {
        "@type": "Question",
        "name": "Can I bring my friends to GameSpot gaming lounge?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes! We encourage group gaming sessions. We have multiplayer game options and can accommodate groups for tournaments, parties, and casual gaming sessions. Special group discounts are available for bookings of 3+ players."
        }
      },
      {
        "@type": "Question",
        "name": "Is parking available at GameSpot Kodungallur?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, convenient parking facilities are available near our gaming lounge in Kodungallur. The location is easily accessible by car, bike, and public transport from Thrissur and nearby areas."
        }
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}
