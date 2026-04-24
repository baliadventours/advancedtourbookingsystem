import React, { useState, useEffect } from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  ExternalLink,
  ChevronRight,
  MoreVertical,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Ban,
  Briefcase,
  Star,
  MessageSquare,
  X,
  Send,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, doc, addDoc, serverTimestamp, documentId } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Booking, UserProfile, Tour, Review } from '../../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

type FilterType = 'All' | 'Upcoming' | 'Completed' | 'Cancelled';

export default function Bookings() {
  const { user, profile } = useOutletContext<{ user: any; profile: UserProfile }>();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tours, setTours] = useState<Record<string, Tour>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);
  const navigate = useNavigate();

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    async function fetchBookings() {
      if (!user) return;
      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snap = await getDocs(q);
      const bookingsData = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      setBookings(bookingsData);

      // Fetch tour details to get slugs
      if (bookingsData.length > 0) {
        const tourIds = Array.from(new Set(bookingsData.map(b => b.tourId)));
        // Firestore 'in' query limit is 10, but we'll assume limited tours for now
        // A better way would be chunking if many
        const tourQ = query(collection(db, 'tours'), where(documentId(), 'in', tourIds.slice(0, 10)));
        const tourSnap = await getDocs(tourQ);
        const tourMap: Record<string, Tour> = {};
        tourSnap.docs.forEach(doc => {
          const data = doc.data() as Tour;
          tourMap[doc.id] = { id: doc.id, ...data };
        });
        setTours(tourMap);
      }
      
      setLoading(false);
    }
    fetchBookings();
  }, [user]);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.tourTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'All') return matchesSearch;
    
    const bookingDate = new Date(booking.date);
    const now = new Date();
    
    if (filter === 'Upcoming') return matchesSearch && booking.status === 'confirmed' && bookingDate >= now;
    if (filter === 'Completed') return matchesSearch && booking.status === 'confirmed' && bookingDate < now;
    if (filter === 'Cancelled') return matchesSearch && booking.status === 'cancelled';
    
    return matchesSearch;
  });

  const getStatusStyles = (status: string, date: string) => {
    const bookingDate = new Date(date);
    const now = new Date();

    if (status === 'cancelled') return { label: 'Cancelled', icon: XCircle, className: 'bg-red-50 text-red-600' };
    if (bookingDate < now) return { label: 'Completed', icon: CheckCircle2, className: 'bg-blue-50 text-blue-600' };
    return { label: 'Confirmed', icon: Clock, className: 'bg-emerald-50 text-emerald-600' };
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingBooking || !user) return;
    setReviewSubmitting(true);

    try {
      const reviewData: Omit<Review, 'id'> = {
        tourId: reviewingBooking.tourId,
        tourTitle: reviewingBooking.tourTitle,
        userId: user.uid,
        userName: profile?.displayName || user.displayName || 'Guest',
        userPhoto: profile?.photoURL || user.photoURL,
        rating: reviewRating,
        comment: reviewComment,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'reviews'), reviewData);
      setReviewingBooking(null);
      setReviewRating(5);
      setReviewComment('');
      // Optionally show success toast
    } catch (err) {
      console.error("Error submitting review:", err);
    } finally {
      setReviewSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">My Bookings</h1>
        <p className="text-gray-500">View and manage all your tour bookings</p>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by tour name, location, or booking ID..."
            className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-[#00A651] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {(['All', 'Upcoming', 'Completed', 'Cancelled'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-6 py-3 rounded-[12px] text-sm font-bold transition-all whitespace-nowrap",
                filter === f 
                  ? "bg-[#00A651] text-white shadow-lg shadow-emerald-100" 
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-white rounded-[24px] border border-gray-100 animate-pulse" />
          ))
        ) : filteredBookings.length > 0 ? (
          filteredBookings.map((booking) => {
            const status = getStatusStyles(booking.status, booking.date);
            const tour = tours[booking.tourId];
            const isCompleted = new Date(booking.date) < new Date() && booking.status === 'confirmed';

            return (
              <motion.div
                key={booking.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[24px] border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
              >
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-64 h-48 md:h-auto bg-gray-100 relative overflow-hidden">
                    <img 
                      src={tour?.featuredImage || `https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=800`} 
                      alt={booking.tourTitle}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute top-4 left-4">
                      <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold backdrop-blur-md shadow-sm", status.className)}>
                        <status.icon className="h-3 w-3" />
                        {status.label}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Booking ID: {booking.id.slice(0, 8)}...</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-[#00A651] transition-colors">{booking.tourTitle}</h3>
                      </div>
                      <div className="px-3 py-1 bg-emerald-50 text-[#00A651] rounded-full text-[10px] font-bold uppercase tracking-wider">
                        {booking.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Date</p>
                          <p className="text-sm font-bold text-gray-900">{new Date(booking.date).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Guests</p>
                          <p className="text-sm font-bold text-gray-900">{booking.participants.adults + booking.participants.children} Persons</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Location</p>
                          <p className="text-sm font-bold text-gray-900">{tour?.location || 'Bali, Indonesia'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
                          <p className="text-sm font-bold text-gray-900">${booking.totalAmount}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto flex flex-wrap items-center gap-3">
                      <button 
                        onClick={() => setSelectedBooking(booking)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white rounded-[10px] text-xs font-bold hover:bg-gray-800 transition-all"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                      
                      {tour && (
                        <Link 
                          to={`/tour/${tour.slug || tour.id}`}
                          className="flex items-center gap-2 px-6 py-2.5 bg-[#00A651] text-white rounded-[10px] text-xs font-bold hover:bg-emerald-700 transition-all"
                        >
                          <MapPin className="h-4 w-4" />
                          View Tour
                        </Link>
                      )}

                      {isCompleted ? (
                        <button 
                          onClick={() => setReviewingBooking(booking)}
                          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 text-white rounded-[10px] text-xs font-bold hover:bg-amber-600 transition-all"
                        >
                          <MessageSquare className="h-4 w-4" />
                          Write a Review
                        </button>
                      ) : (
                        tour && (
                          <Link 
                            to={`/tour/${tour.slug || tour.id}`}
                            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-100 text-gray-700 rounded-[10px] text-xs font-bold hover:bg-gray-50 transition-all"
                          >
                            <RefreshCw className="h-4 w-4" />
                            Book Again
                          </Link>
                        )
                      )}
                      
                      {booking.status !== 'cancelled' && new Date(booking.date) > new Date() && (
                        <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-red-100 text-red-500 rounded-[10px] text-xs font-bold hover:bg-red-50 transition-all ml-auto">
                          <Ban className="h-4 w-4" />
                          Cancel Booking
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="py-20 text-center bg-white rounded-[24px] border border-gray-100">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-10 w-10 text-gray-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-500">We couldn't find any bookings matching your criteria.</p>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedBooking(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{selectedBooking.tourTitle}</h2>
                  <p className="text-sm text-gray-500">Booking Reference: {selectedBooking.id}</p>
                </div>
                <button onClick={() => setSelectedBooking(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto max-h-[70vh]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Traveler Details</h4>
                      <div className="space-y-2">
                        <p className="text-sm font-bold text-gray-900">{selectedBooking.customerData.fullName}</p>
                        <p className="text-sm text-gray-500">{selectedBooking.customerData.email}</p>
                        <p className="text-sm text-gray-500">{selectedBooking.customerData.phone}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Selection</h4>
                      <p className="text-sm font-bold text-gray-900">{selectedBooking.packageName}</p>
                      <p className="text-sm text-gray-500 mt-1">{selectedBooking.participants.adults} Adults, {selectedBooking.participants.children} Children</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Extras & Add-ons</h4>
                      {selectedBooking.selectedAddOns.length > 0 ? (
                        <div className="space-y-2">
                          {selectedBooking.selectedAddOns.map(addon => (
                            <div key={addon.id} className="flex justify-between text-sm">
                              <span className="text-gray-500">{addon.name} (x{addon.quantity})</span>
                              <span className="font-bold text-gray-900">${addon.price * addon.quantity}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 italic">No add-ons selected</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-gray-500">Subtotal</span>
                    <span className="font-bold text-gray-900">${selectedBooking.totalAmount + (selectedBooking.discountAmount || 0)}</span>
                  </div>
                  {selectedBooking.discountAmount && (
                    <div className="flex items-center justify-between mb-4 text-red-500">
                      <span>Discount ({selectedBooking.couponCode})</span>
                      <span>-${selectedBooking.discountAmount}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-lg font-bold text-gray-900">Total Charged</span>
                    <span className="text-2xl font-black text-[#00A651]">${selectedBooking.totalAmount}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewingBooking && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReviewingBooking(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <form onSubmit={handleReviewSubmit}>
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
                    <p className="text-sm text-gray-500">{reviewingBooking.tourTitle}</p>
                  </div>
                  <button type="button" onClick={() => setReviewingBooking(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                
                <div className="p-8 space-y-6">
                  <div className="text-center">
                    <p className="text-sm font-bold text-gray-900 mb-3">How was your experience?</p>
                    <div className="flex items-center justify-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 transition-transform active:scale-110"
                        >
                          <Star 
                            className={cn(
                              "h-10 w-10 transition-colors",
                              star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-200"
                            )} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Your Review</label>
                    <textarea 
                      required
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Share your thoughts about the tour..."
                      className="w-full bg-gray-50 border-none rounded-[16px] p-4 text-sm focus:ring-2 focus:ring-[#00A651] transition-all min-h-[120px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Add Photos (Optional)</label>
                    <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-100 rounded-[16px] hover:border-[#00A651] transition-colors cursor-pointer group">
                      <div className="text-center">
                        <ImageIcon className="h-8 w-8 text-gray-300 mx-auto mb-2 group-hover:text-[#00A651]" />
                        <p className="text-xs font-bold text-gray-400">Click to upload images</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 bg-gray-50/50 flex gap-4">
                  <button 
                    type="button" 
                    onClick={() => setReviewingBooking(null)}
                    className="flex-1 py-3 bg-white border border-gray-200 rounded-[12px] font-bold text-sm text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={reviewSubmitting || !reviewComment}
                    className="flex-[2] py-3 bg-[#00A651] text-white rounded-[12px] font-bold text-sm hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                  >
                    {reviewSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Submit Review
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

