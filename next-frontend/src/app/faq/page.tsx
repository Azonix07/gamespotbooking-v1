import type { Metadata } from 'next';
import FAQSchema from '@/components/structured-data/FAQSchema';
import BreadcrumbSchema from '@/components/structured-data/BreadcrumbSchema';
import Link from 'next/link';
import './faq.css';

export const metadata: Metadata = {
  title: 'FAQ - Gaming Lounge Questions Answered | GameSpot Kodungallur',
  description: 'Find answers to common questions about GameSpot gaming lounge in Kodungallur. PS5, Xbox, VR gaming sessions pricing, timing, booking, location, available games like GTA, FIFA, God of War & more.',
  keywords: [
    'GameSpot FAQ', 'gaming lounge questions Kodungallur', 'PS5 gaming cost Kodungallur',
    'gaming cafe hours Kodungallur', 'how to book gaming session Kodungallur',
    'gaming near me Kodungallur', 'Xbox gaming price Kerala',
    'VR gaming experience Kodungallur', 'gaming lounge location Kodungallur',
    'GTA gaming price Kodungallur', 'PS5 hourly rate Thrissur',
    'gaming lounge timing Kodungallur', 'what games available GameSpot',
    'driving simulator price Kodungallur', 'party booking gaming Kodungallur',
  ],
  alternates: {
    canonical: 'https://gamespotkdlr.com/faq',
  },
  openGraph: {
    title: 'FAQ - GameSpot Kodungallur Gaming Lounge',
    description: 'All your questions about gaming at GameSpot Kodungallur answered. Pricing, timing, games, booking & more.',
    url: 'https://gamespotkdlr.com/faq',
    siteName: 'GameSpot Kodungallur',
    type: 'website',
    images: [{ url: '/assets/images/logo.png', width: 400, height: 75, alt: 'GameSpot FAQ' }],
  },
};

const faqs = [
  {
    category: 'Location & Access',
    questions: [
      {
        q: 'Where is GameSpot gaming lounge located in Kodungallur?',
        a: 'GameSpot is located in Kodungallur, Thrissur District, Kerala 680664. We are easily accessible from Irinjalakuda, Thrissur, Guruvayur, Chalakudy, and Angamaly. Visit our Contact page for exact directions and map.'
      },
      {
        q: 'What are GameSpot\'s operating hours?',
        a: 'We are open daily from 10:00 AM to 10:00 PM, Monday through Sunday. We recommend booking online to ensure availability during peak hours (evenings and weekends).'
      },
      {
        q: 'Is parking available at GameSpot?',
        a: 'Yes, convenient parking facilities are available near our gaming lounge in Kodungallur. The location is easily accessible by car, bike, and public transport.'
      },
    ]
  },
  {
    category: 'Gaming Equipment',
    questions: [
      {
        q: 'What gaming consoles are available at GameSpot Kodungallur?',
        a: 'We offer PlayStation 5 (PS5), Xbox Series X, and Meta Quest VR gaming experiences. All consoles are equipped with the latest games and professional gaming peripherals including gaming headsets, controllers, and high-refresh-rate displays.'
      },
      {
        q: 'What games are available at GameSpot?',
        a: 'We have 50+ popular titles including FIFA 24, Call of Duty, GTA 5, Spider-Man, God of War, Forza Horizon, Halo Infinite, Beat Saber VR, and many more. Visit our Games page for the complete updated list.'
      },
      {
        q: 'Do you have multiplayer gaming options?',
        a: 'Absolutely! We support multiplayer gaming sessions for 2-4 players depending on the game. Popular multiplayer games include FIFA, Mortal Kombat, Street Fighter, Mario Kart, and many co-op titles.'
      },
    ]
  },
  {
    category: 'Booking & Pricing',
    questions: [
      {
        q: 'How much does it cost to play PS5 at GameSpot?',
        a: 'Our PS5 gaming sessions start at affordable hourly rates. We offer flexible packages including hourly rentals, membership plans, and special discounts for students and bulk bookings. Visit our Booking page for current pricing.'
      },
      {
        q: 'Can I book a gaming session online?',
        a: 'Yes! You can book your gaming session online at gamespotkdlr.com/booking. Choose your preferred console (PS5, Xbox, or VR), select date and time, and confirm your booking instantly. Walk-ins are also welcome subject to availability.'
      },
      {
        q: 'What is your cancellation policy?',
        a: 'You can cancel or reschedule your booking up to 2 hours before the scheduled time for a full refund. Cancellations within 2 hours of the booking time are non-refundable.'
      },
      {
        q: 'What payment methods do you accept?',
        a: 'We accept Cash, UPI (Google Pay, PhonePe, Paytm), and all major Debit/Credit Cards. Online bookings can be paid through our secure payment gateway.'
      },
    ]
  },
  {
    category: 'Membership & Offers',
    questions: [
      {
        q: 'Is there a membership plan at GameSpot Kodungallur?',
        a: 'Yes, we offer flexible membership plans with significant discounts for regular gamers. Memberships include benefits like priority booking, discounted rates (up to 30% off), exclusive access to new game releases, and special tournament invitations. Check our Membership page for details.'
      },
      {
        q: 'Do you offer student discounts?',
        a: 'Yes! Students with valid college ID cards get special discounted rates. Show your ID at the counter or mention during online booking to avail the discount.'
      },
      {
        q: 'Are there any promotional offers?',
        a: 'We regularly run promotional offers, seasonal discounts, and special packages. Follow us on Instagram @gamespot_kodungallur or check our Get Offers page for current promotions.'
      },
    ]
  },
  {
    category: 'Events & Groups',
    questions: [
      {
        q: 'Does GameSpot host gaming tournaments and events?',
        a: 'Absolutely! We regularly host gaming tournaments, birthday parties, and college gaming events in Kodungallur. Contact us for custom event bookings and special packages for groups.'
      },
      {
        q: 'Can I book GameSpot for a birthday party?',
        a: 'Yes! We offer special birthday party packages with gaming sessions, decorations, and snacks. Perfect for kids and teens who love gaming. Contact us to discuss your requirements.'
      },
      {
        q: 'Do you offer college gaming event packages?',
        a: 'Yes, we provide customized packages for college gaming events, tech fests, and esports tournaments. We can accommodate large groups and provide tournament setups. Visit our College Setup page for more details.'
      },
      {
        q: 'Can I bring my friends to GameSpot?',
        a: 'Yes! We encourage group gaming sessions. We have multiplayer game options and can accommodate groups for tournaments, parties, and casual gaming. Special group discounts are available for bookings of 3+ players.'
      },
    ]
  },
  {
    category: 'Technical & Support',
    questions: [
      {
        q: 'What if I face technical issues during my session?',
        a: 'Our staff is always available to assist you with any technical issues. We ensure all equipment is tested before each session. If you face any issues, our team will resolve it immediately or provide an alternative setup.'
      },
      {
        q: 'Can I use my own gaming account (PSN/Xbox Live)?',
        a: 'Yes, you can log in to your personal gaming accounts during your session. However, please remember to log out after your session ends. We are not responsible for any account-related issues.'
      },
      {
        q: 'Is the gaming setup suitable for beginners?',
        a: 'Absolutely! Whether you\'re a pro gamer or a complete beginner, our staff can help you get started. We provide game recommendations and basic tutorials for new players.'
      },
    ]
  },
];

export default function FAQPage() {
  return (
    <>
      <FAQSchema />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'FAQ', url: '/faq' }
      ]} />
      
      <div className="faq-page">
        <div className="faq-header">
          <h1>Frequently Asked Questions</h1>
          <p className="faq-subtitle">
            Everything you need to know about GameSpot Kodungallur gaming lounge
          </p>
        </div>

        <div className="faq-container">
          <div className="faq-quick-links">
            <h3>Quick Jump</h3>
            <ul>
              {faqs.map((category, idx) => (
                <li key={idx}>
                  <a href={`#category-${idx}`}>{category.category}</a>
                </li>
              ))}
            </ul>
            <div className="faq-cta">
              <p>Still have questions?</p>
              <Link href="/contact" className="btn-contact">
                Contact Us
              </Link>
            </div>
          </div>

          <div className="faq-content">
            {faqs.map((category, catIdx) => (
              <div key={catIdx} id={`category-${catIdx}`} className="faq-category">
                <h2 className="category-title">{category.category}</h2>
                <div className="faq-items">
                  {category.questions.map((faq, qIdx) => (
                    <details key={qIdx} className="faq-item">
                      <summary className="faq-question">
                        <span className="question-text">{faq.q}</span>
                        <span className="question-icon">+</span>
                      </summary>
                      <div className="faq-answer">
                        <p>{faq.a}</p>
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="faq-footer">
          <div className="faq-footer-content">
            <h2>Ready to Start Gaming?</h2>
            <p>Book your gaming session at Kodungallur's #1 gaming lounge</p>
            <div className="faq-footer-actions">
              <Link href="/booking" className="btn-primary">
                Book Now
              </Link>
              <Link href="/games" className="btn-secondary">
                View Games
              </Link>
            </div>
          </div>
        </div>

        <div className="faq-seo-content">
          <h2>About GameSpot Gaming Lounge Kodungallur</h2>
          <p>
            GameSpot is the premier gaming lounge in Kodungallur, Thrissur District, Kerala. 
            We serve gamers from Kodungallur, Irinjalakuda, Thrissur, Guruvayur, Chalakudy, 
            and surrounding areas with professional PS5, Xbox Series X, and VR gaming experiences.
          </p>
          <p>
            Whether you're looking for "gaming near me" or searching for the "best gaming cafe in Kodungallur", 
            GameSpot offers premium gaming equipment, comfortable environment, competitive pricing, 
            and a wide selection of 50+ games. Book your session online at gamespotkdlr.com today!
          </p>
        </div>
      </div>
    </>
  );
}
