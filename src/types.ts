export interface PricingTier {
  minParticipants: number;
  maxParticipants: number;
  adultPrice: number;
  childPrice: number;
}

export interface TourPackage {
  name: string;
  details?: string; // Made optional
  inclusions: string[];
  exclusions: string[];
  tiers: PricingTier[];
}

export interface AddOn {
  id: string;
  name: string;
  description?: string; // New field
  price: number;
  unit: 'per person' | 'per booking';
}

export interface Category {
  id: string;
  name: string;
}

export interface TourType {
  id: string;
  name: string;
}

export interface LocationMeta {
  id: string;
  name: string;
}

export interface ImportantInfoSection {
  title: string;
  content: string[];
}

export interface Tour {
  id: string;
  slug: string; // Added slug field
  title: string;
  description: string;
  categoryId?: string;
  tourTypeId?: string;
  locationId?: string;
  highlights: string[];
  inclusions: string[]; // Global inclusions
  exclusions: string[]; // Global exclusions
  itinerary: {
    day: number;
    title: string;
    description: string;
    pickup?: {
      description: string;
      image?: string;
    };
    image?: string;
  }[];
  importantInfo?: string;
  infoSections?: ImportantInfoSection[]; // Dynamic sections: What to Bring, Before you go, etc.
  languages: string[];
  location: string; // Keep as backup or display string
  locationMapUrl: string;
  duration: string;
  gallery: string[];
  featuredImage?: string; // New field
  regularPrice: number; // For display on cards/grid
  discountPrice?: number;
  packages: TourPackage[];
  addOnIds?: string[]; // Selection from global add-ons
  addOns?: AddOn[]; // Kept for backward compatibility or snapshots
  faqs: {
    question: string;
    answer: string;
  }[];
  timeSlots?: string[]; // Available times e.g. ["08:00", "08:30"]
  urgencyPointIds?: string[]; // Global urgency points
  rating?: number; // New field for aggregated rating
  reviewsCount?: number; // New field for review count
  isPopular?: boolean; // New field for display badges
  createdAt: any;
  updatedAt: any;
}

export interface UrgencyPoint {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name
}

export interface PageContent {
  id: string;
  title: string;
  slug: string;
  content: string;
  updatedAt: any;
}

export interface Review {
  id: string;
  tourId?: string; // New: reference back to tour
  tourTitle?: string; // New: cache for display
  userId: string;
  userName: string;
  userPhoto?: string;
  nationality?: string;
  tourDate?: string;
  rating: number;
  title?: string;
  comment: string;
  image?: string;
  images?: string[]; // New: support for multiple images
  status: 'pending' | 'approved' | 'rejected'; // New moderation status
  createdAt: any;
}

export interface PaymentSettings {
  paypalClientId: string;
  isPaypalEnabled: boolean;
  creditCardEnabled: boolean;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  swiftCode?: string;
  bankInstructions: string;
}

export interface BookingLog {
  timestamp: string;
  message: string;
  type: 'status_change' | 'note' | 'system' | 'assignment';
  userName?: string;
}

export interface Booking {
  id: string;
  tourId: string;
  tourTitle: string;
  userId: string;
  customerData: {
    fullName: string;
    email: string;
    phone: string;
    country?: string; // New field
    nationality?: string;
    pickupAddress?: string; // New field
    specialRequirements?: string;
  };
  date: string;
  time?: string;
  timeSlot?: string; // New field for selected time slot
  participants: {
    adults: number;
    children: number;
  };
  packageName: string;
  selectedAddOns: {
    id: string;
    name: string;
    price: number;
    quantity: number;
  }[];
  addOns?: { name: string; price: number }[]; // Snapshot fields
  couponCode?: string;
  discountAmount?: number;
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed'; // New field
  paymentId: string | null;
  paymentToken?: string; // New field for manual tokens
  internalNotes?: string; // New field for admin notes
  logs?: BookingLog[]; // New: activity logs
  assignedGuideId?: string; // New field for guide assignment
  assignedGuideName?: string; // Cache name for easy display
  assignedGuideWhatsapp?: string; // New: cache whatsapp for easy contact
  createdAt: any;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'admin' | 'customer';
  phoneNumber?: string;
  country?: string;
  dateOfBirth?: string;
  bio?: string;
  wishlist?: string[];
  createdAt: any;
  updatedAt?: any;
}

export interface Coupon {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minBookingValue: number;
  expiryDate?: string;
  isActive: boolean;
}

export interface Guide {
  id: string;
  name: string;
  whatsapp: string;
  isActive: boolean;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string; // Markdown supported
  excerpt: string;
  featuredImage: string;
  category: string;
  tags: string[];
  author: string;
  status: 'draft' | 'published';
  publishedAt: any;
  createdAt: any;
  updatedAt: any;
}

export interface EmailTemplate {
  subject: string;
  body: string; // HTML supported with placeholders like {{customerName}}, {{bookingId}}, etc.
  enabled: boolean;
}

export interface CommunicationSettings {
  id: 'settings';
  emailProvider: 'resend' | 'sendgrid' | 'brevo' | 'smtp' | 'gmail' | 'none';
  emailApiKey?: string;
  gmailUser?: string;
  gmailAppPassword?: string;
  smtpSettings?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
  };
  senderEmail: string;
  senderName: string;
  adminNotificationEmail: string; // Where admin receives alerts
  templates: {
    booking_pending: EmailTemplate;
    booking_confirmed: EmailTemplate;
    booking_cancelled: EmailTemplate;
    booking_changed: EmailTemplate;
    booking_status_updated: EmailTemplate;
    payment_received: EmailTemplate;
    payment_failed: EmailTemplate;
    review_request: EmailTemplate;
    guide_assigned: EmailTemplate;
    admin_new_booking: EmailTemplate;
  };
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  siteKeywords: string;
  supportEmail: string;
  supportPhone: string;
  whatsappNumber: string;
  logoURL: string;
  faviconURL: string;
  officeAddress: string;
  primaryColor: string;
  secondaryColor: string;
  bodyFont: string;
  headingFont: string;
}

export interface Popup {
  id: string;
  title: string;
  content: string;
  imageURL?: string;
  ctaText?: string;
  ctaLink?: string;
  isActive: boolean;
  displayDelay: number;
  type: 'newsletter' | 'promotion' | 'info';
  updatedAt: any;
}
