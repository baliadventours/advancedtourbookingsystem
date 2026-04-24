import { Tour, BlogPost, Review, SiteSettings, Category, TourType, LocationMeta, Guide, UrgencyPoint, Coupon, PageContent, AddOn } from '../types';

export const MOCK_SITE_SETTINGS: SiteSettings = {
  siteName: "DayTours",
  siteDescription: "Discover incredible daily adventures. We curate the best local experiences, from hidden landscapes to cultural treasures.",
  siteKeywords: "Bali, tour, adventure, travel, booking, volcano, temple",
  supportEmail: "info@baliadventours.com",
  supportPhone: "+62 812 3456 7890",
  whatsappNumber: "+62 812 3456 7890",
  logoURL: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5962?auto=format&fit=crop&q=80&w=200",
  faviconURL: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5962?auto=format&fit=crop&q=80&w=32",
  officeAddress: "Jalan Raya Ubud, Ubud, Gianyar, Bali 80571, Indonesia",
  primaryColor: "#059669",
  secondaryColor: "#ea580c",
  bodyFont: "DM Sans",
  headingFont: "DM Sans"
};

export const MOCK_CATEGORIES: Category[] = [
  { id: 'cat1', name: 'Adventure' },
  { id: 'cat2', name: 'Cultural' },
  { id: 'cat3', name: 'Nature' },
  { id: 'cat4', name: 'Water Activities' }
];

export const MOCK_TOUR_TYPES: TourType[] = [
  { id: 'type1', name: 'Group Tour' },
  { id: 'type2', name: 'Private Tour' },
  { id: 'type3', name: 'Day Trip' }
];

export const MOCK_LOCATIONS: LocationMeta[] = [
  { id: 'loc1', name: 'Ubud' },
  { id: 'loc2', name: 'Kintamani' },
  { id: 'loc3', name: 'Nusa Penida' },
  { id: 'loc4', name: 'Canggu' }
];

export const MOCK_ADDONS: AddOn[] = [
  { id: 'add1', name: 'GoPro Rental', price: 25, unit: 'per booking', description: 'Capture your adventure with a high-quality GoPro Hero 11.' },
  { id: 'add2', name: 'Professional Photographer', price: 50, unit: 'per booking', description: 'Personal photographer to follow you and take professional shots.' },
  { id: 'add3', name: 'Traditional Balinese Lunch', price: 15, unit: 'per person', description: 'Gourmet Balinese meal served in a local home.' }
];

export const MOCK_URGENCY_POINTS: UrgencyPoint[] = [
  { id: 'u1', title: 'Limited Spots', description: 'Only 3 spots left for this week!', icon: 'AlertTriangle' },
  { id: 'u2', title: 'Best Seller', description: 'Highly rated by 500+ travelers.', icon: 'TrendingUp' },
  { id: 'u3', title: 'Free Cancellation', description: 'Cancel up to 24 hours in advance.', icon: 'CheckCircle' }
];

export const MOCK_GUIDES: Guide[] = [
  { id: 'g1', name: 'Ketut Adventure', whatsapp: '+6281234567891', isActive: true },
  { id: 'g2', name: 'Wayan Discovery', whatsapp: '+6281234567892', isActive: true },
  { id: 'g3', name: 'Made Culture', whatsapp: '+6281234567893', isActive: true }
];

export const MOCK_COUPONS: Coupon[] = [
  { id: 'c1', code: 'BALI10', discountType: 'percentage', discountValue: 10, minBookingValue: 50, isActive: true },
  { id: 'c2', code: 'ADVENTURE25', discountType: 'fixed', discountValue: 25, minBookingValue: 200, isActive: true }
];

export const MOCK_PAGES: PageContent[] = [
  { 
    id: 'p1', 
    title: 'About Us', 
    slug: 'about-us', 
    content: 'DayTours started with a simple belief: travel should be more than just visiting places. It should be about connection, story-telling, and respecting the environment. Founded in 2015, we have grown to become a leading provider of sustainable adventures and daily experiences.',
    updatedAt: new Date()
  },
  { 
    id: 'p2', 
    title: 'Terms & Conditions', 
    slug: 'terms', 
    content: '### 1. Booking Policy\nBookings must be made at least 24 hours in advance...\n\n### 2. Cancellation\nFree cancellation is available for most tours up to 24 hours before the scheduled pickup time.',
    updatedAt: new Date()
  }
];

export const MOCK_TOURS: Tour[] = [
  {
    id: 't1',
    slug: 'mount-batur-sunrise-trekking',
    title: 'Mount Batur Sunrise Trekking',
    description: 'Experience an unforgettable sunrise from the summit of Mount Batur, an active volcano in Bali. This trek offers breathtaking views of the lake and surrounding mountains.',
    highlights: ['Enjoy breakfast at the summit', 'Stunning sunrise views over Lake Batur', 'Visit a local coffee plantation'],
    inclusions: ['Private transport', 'English speaking guide', 'Breakfast and water', 'Trekking equipment'],
    exclusions: ['Personal expenses', 'Tips for the guide'],
    itinerary: [
      { day: 1, title: 'Early Morning Pickup', description: 'Pickup from your hotel at 2:00 AM.' },
      { day: 1, title: 'Trekking Begins', description: 'Start the ascent with our professional guides.' },
      { day: 1, title: 'Sunrise Victory', description: 'Reach the summit and enjoy sunrise and breakfast.' }
    ],
    languages: ['English', 'Indonesian'],
    location: 'Kintamani, Bali',
    locationId: 'loc2',
    categoryId: 'cat1',
    tourTypeId: 'type1',
    locationMapUrl: 'https://goo.gl/maps/xyz',
    duration: '8 Hours',
    gallery: [
      'https://images.unsplash.com/photo-1558005530-d7c496f30d0a?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1477587175574-c5f5e9432161?auto=format&fit=crop&q=80&w=800'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1536431311719-398b6704d4cc?auto=format&fit=crop&q=80&w=800',
    regularPrice: 65,
    discountPrice: 55,
    packages: [
      {
        name: 'Standard Package',
        inclusions: ['Shared guide', 'Standard breakfast'],
        exclusions: ['Private transport'],
        tiers: [{ minParticipants: 1, maxParticipants: 10, adultPrice: 55, childPrice: 40 }]
      }
    ],
    faqs: [
      { question: 'Is it difficult?', answer: 'It is a moderate trek suitable for beginners.' }
    ],
    urgencyPointIds: ['u1', 'u2'],
    rating: 4.8,
    reviewsCount: 124,
    isPopular: true,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't2',
    slug: 'ubud-cultural-day-tour',
    title: 'Ubud Cultural Day Tour',
    description: 'Dive deep into the heart of Balinese culture. Visit the Sacred Monkey Forest, Tegallalang Rice Terrace, and Ubud Royal Palace.',
    highlights: ['Meet monkeys in the forest', 'Walk through emerald rice paddies', 'Art market exploration'],
    inclusions: ['AC vehicle', 'Driver/Guide', 'Entrance fees'],
    exclusions: ['Lunch'],
    itinerary: [
      { day: 1, title: 'Monkey Forest', description: 'Interact with the long-tailed macaques.' },
      { day: 1, title: 'Rice Terrace', description: 'Breathtaking landscape walk in Tegallalang.' }
    ],
    languages: ['English', 'Indonesian', 'Japanese'],
    location: 'Ubud, Bali',
    locationId: 'loc1',
    categoryId: 'cat2',
    tourTypeId: 'type3',
    locationMapUrl: 'https://goo.gl/maps/abc',
    duration: '10 Hours',
    gallery: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
      'https://images.unsplash.com/photo-1540206351-d4177b949987?auto=format&fit=crop&q=80&w=800'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=800',
    regularPrice: 50,
    packages: [
      {
        name: 'Classic Ubud',
        inclusions: ['All entrance fees'],
        exclusions: ['Lunch'],
        tiers: [{ minParticipants: 1, maxParticipants: 4, adultPrice: 50, childPrice: 35 }]
      }
    ],
    faqs: [],
    rating: 4.9,
    reviewsCount: 89,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 't3',
    slug: 'nusa-penida-island-hop',
    title: 'Nusa Penida Island Hopper',
    description: 'A day trip to the stunning Nusa Penida island. Visit Kelingking Beach (T-Rex Bay), Broken Beach, and Angel Billabong.',
    highlights: ['Iconic T-Rex cliffs', 'Crystal clear bay swimming', 'Speed boat adventure'],
    inclusions: ['Hotel transfer', 'Fast boat return', 'Lunch', 'Insurance'],
    exclusions: ['Snorkeling gear rent'],
    itinerary: [
      { day: 1, title: 'Harbor Pickup', description: 'Head to Sanur harbor for the fast boat.' },
      { day: 1, title: 'Island Exploration', description: 'Drive around the West area of Nusa Penida.' }
    ],
    languages: ['English'],
    location: 'Nusa Penida, Bali',
    locationId: 'loc3',
    categoryId: 'cat4',
    tourTypeId: 'type3',
    locationMapUrl: 'https://goo.gl/maps/pqr',
    duration: '12 Hours',
    gallery: [
       'https://images.unsplash.com/photo-1537953773345-d142cc45da62?auto=format&fit=crop&q=80&w=800'
    ],
    featuredImage: 'https://images.unsplash.com/photo-1570729732333-41aaeef79ae5?auto=format&fit=crop&q=80&w=800',
    regularPrice: 95,
    discountPrice: 85,
    packages: [
      {
        name: 'Standard Day Tour',
        inclusions: ['Fast boat', 'Transport'],
        exclusions: [],
        tiers: [{ minParticipants: 1, maxParticipants: 6, adultPrice: 85, childPrice: 65 }]
      }
    ],
    faqs: [],
    rating: 4.7,
    reviewsCount: 210,
    isPopular: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const MOCK_BLOGS: BlogPost[] = [
  {
    id: 'b1',
    title: 'Top 5 Hidden Waterfalls in Bali',
    slug: 'top-5-hidden-waterfalls-in-bali',
    excerpt: 'Beyond the crowded Tegenungan, Bali hides some truly spectacular waterfalls deep in the jungle. Here are our favorites...',
    content: 'Bali is famous for its beaches, but its heart beats in the lush jungle waterfalls. **Sekumpul** is arguably the most beautiful, while **Nungnung** offers a powerful descent...',
    featuredImage: 'https://images.unsplash.com/photo-1552465011-b4e21bd6e79a?auto=format&fit=crop&q=80&w=800',
    category: 'Adventure',
    tags: ['Waterfalls', 'Nature', 'Guide'],
    author: 'Wayan Adventure',
    status: 'published',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'b2',
    title: 'Ubud vs Canggu: Where should you stay?',
    slug: 'ubud-vs-canggu-where-to-stay',
    excerpt: 'Finding it hard to choose between the cultural heart of Ubud and the surfing vibes of Canggu? Our comparison guide helps you decide.',
    content: 'Ubud is the cultural soul, perfect for yoga and rice terrace views. Canggu is the trendy hub with black sand beaches and amazing cafes...',
    featuredImage: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800',
    category: 'Travel Tips',
    tags: ['Ubud', 'Canggu', 'Comparison'],
    author: 'Sari Travel',
    status: 'published',
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: 'r1',
    tourId: 't1',
    userId: 'u1',
    userName: 'John Doe',
    userPhoto: 'https://i.pravatar.cc/150?u=u1',
    nationality: 'United States',
    rating: 5,
    comment: 'The Mount Batur trek was the highlight of our trip! Perfectly organized and the view was out of this world.',
    tourTitle: 'Mount Batur Sunrise Trekking',
    status: 'approved',
    createdAt: new Date()
  },
  {
    id: 'r2',
    tourId: 't2',
    userId: 'u2',
    userName: 'Emma Smith',
    userPhoto: 'https://i.pravatar.cc/150?u=u2',
    nationality: 'United Kingdom',
    rating: 5,
    comment: 'Ubud is so magical. Our guide Ketut was so knowledgeable and friendly. Highly recommend!',
    tourTitle: 'Ubud Cultural Day Tour',
    status: 'approved',
    createdAt: new Date()
  }
];

