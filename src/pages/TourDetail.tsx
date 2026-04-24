import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, limit, getDocs, where } from 'firebase/firestore';
import { Tour, UrgencyPoint } from '../types';
import { MOCK_TOURS } from '../lib/mockData';
import { 
  Share2, MapPin, Clock, Star, 
  ChevronRight, Calendar, Users, 
  Info, Languages, MessageCircle, ShieldCheck, LucideIcon
} from 'lucide-react';
import * as Icons from 'lucide-react';
import TourGallery from '../components/TourDetails/TourGallery';
import TourInfo from '../components/TourDetails/TourInfo';
import BookingForm from '../components/TourDetails/BookingForm';
import ReviewSection from '../components/TourDetails/ReviewSection';
import { formatPrice } from '../lib/utils';
import TourCard from '../components/TourCard';

export default function TourDetail() {
  const { slug } = useParams();
  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [similarTours, setSimilarTours] = useState<Tour[]>([]);
  const [urgencyPoints, setUrgencyPoints] = useState<UrgencyPoint[]>([]);

  useEffect(() => {
    const fetchTour = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        const q = query(collection(db, 'tours'), where('slug', '==', slug), limit(1));
        const qSnap = await getDocs(q);
        
        if (!qSnap.empty) {
          const docSnap = qSnap.docs[0];
          setTour({ id: docSnap.id, ...docSnap.data() } as Tour);
          
          // Fetch similar tours
          const qSim = query(collection(db, 'tours'), limit(3));
          const qSnapSim = await getDocs(qSim);
          setSimilarTours(qSnapSim.docs.map(d => ({ id: d.id, ...d.data() })) as Tour[]);

          // Fetch all urgency points
          const urgencySnap = await getDocs(collection(db, 'urgencyPoints'));
          setUrgencyPoints(urgencySnap.docs.map(d => ({ id: d.id, ...d.data() } as UrgencyPoint)));
        } else {
          // Check mock data
          const mockTour = MOCK_TOURS.find(t => t.slug === slug);
          if (mockTour) {
            setTour(mockTour);
            setSimilarTours(MOCK_TOURS.filter(t => t.slug !== slug).slice(0, 3));
          } else {
            setTour(null);
          }
        }
      } catch (error) {
        console.error("Error fetching tour, trying mocks", error);
        const mockTour = MOCK_TOURS.find(t => t.slug === slug);
        if (mockTour) {
          setTour(mockTour);
          setSimilarTours(MOCK_TOURS.filter(t => t.slug !== slug).slice(0, 3));
        } else {
          setTour(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTour();
  }, [slug]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: tour?.title,
        text: tour?.description,
        url: window.location.href,
      });
    } else {
      alert("Link copied to clipboard!");
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );

  if (!tour) return <div className="p-20 text-center">Tour not found</div>;

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="bg-gray-50 py-4">
        <div className="container mx-auto px-4 lg:px-8">
          <nav className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Link to="/" className="hover:text-blue-600">Home</Link>
            <ChevronRight className="h-3 w-3" />
            <Link to="/tours" className="hover:text-blue-600">Tours</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-900 truncate max-w-[200px] md:max-w-none">{tour.title}</span>
          </nav>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 lg:px-8">
        {/* Title & Share */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-4">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 md:text-4xl lg:text-5xl">
              {tour.title}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-sm font-medium text-gray-500">
              <div className="flex items-center gap-1">
                <div className="flex text-amber-500">
                  <Star className="h-4 w-4 fill-current" />
                </div>
                <span className="text-gray-900 font-bold">{tour.rating || 'No rating'}</span>
                <span className="text-xs font-bold text-gray-400">({tour.reviewsCount || 0} Reviews)</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-primary rounded-full text-xs font-bold border border-emerald-100">
                <MapPin className="h-3 w-3" />
                <span>{tour.location}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-primary rounded-full text-xs font-bold border border-emerald-100">
                <Clock className="h-3 w-3" />
                <span>{tour.duration}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={handleShare}
            className="flex items-center justify-center gap-2 rounded-[10px] border border-gray-200 px-6 py-3 text-sm font-bold text-gray-700 transition-all hover:bg-gray-50 hover:border-gray-300 active:scale-95"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>

        {/* Gallery */}
        <TourGallery images={tour.gallery} />

        {/* Dynamic Urgency Points */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {urgencyPoints
            .filter(point => tour?.urgencyPointIds?.includes(point.id))
            .map(point => {
              const IconComponent = (Icons as any)[point.icon] || ShieldCheck;
              return (
                <div key={point.id} className="flex gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 group hover:bg-emerald-50 transition-colors">
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-gray-900 tracking-tight">{point.title}</h4>
                    <p className="text-[11px] text-gray-500 font-medium leading-tight mt-1">{point.description}</p>
                  </div>
                </div>
              );
          })}
          {(!tour.urgencyPointIds || tour.urgencyPointIds.length === 0) && (
            <>
              <div className="flex gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 group hover:bg-emerald-50 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 tracking-tight">Free cancellation</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-tight mt-1">Cancel up to 24 hours in advance for a full refund</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 group hover:bg-emerald-50 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 tracking-tight">Reserve now & pay later</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-tight mt-1">Keep your travel plans flexible — book your spot and pay nothing today</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 group hover:bg-emerald-50 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <Info className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 tracking-tight">Health precautions</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-tight mt-1">Special health and safety measures apply</p>
                </div>
              </div>
              <div className="flex gap-4 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50 group hover:bg-emerald-50 transition-colors">
                <div className="h-10 w-10 shrink-0 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <div className="rotate-12">
                    <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black text-gray-900 tracking-tight">Mobile ticketing</h4>
                  <p className="text-[11px] text-gray-500 font-medium leading-tight mt-1">Use your phone or print your voucher</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Content Grid */}
        <div className="mt-12 grid gap-12 lg:grid-cols-3">
          {/* Left Side: Info & Reviews */}
          <div className="lg:col-span-2 space-y-16">
            <TourInfo tour={tour} />
            <ReviewSection tourId={tour.id} />
          </div>

          {/* Right Side: Booking Area */}
          <div className="space-y-12">
            <BookingForm tour={tour} />
          </div>
        </div>
      </main>

      {/* Similar Experience Section (Moved to bottom) */}
      <div className="mt-24 bg-gray-50/50 py-24 border-t border-gray-100">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-gray-900 tracking-tight">Similar Experiences</h3>
              <Link to="/tours" className="text-sm font-bold text-primary hover:underline flex items-center gap-2">
                View All Tours <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              {similarTours.filter(t => t.id !== tour.id).map((sim, index) => (
                <TourCard key={sim.id} tour={sim} index={index} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
