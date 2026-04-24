import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Review } from '../../types';
import { MOCK_REVIEWS } from '../../lib/mockData';
import { motion, AnimatePresence } from 'motion/react';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ReviewSlider() {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          setReviews(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
        } else {
          setReviews(MOCK_REVIEWS);
        }
      },
      (error) => {
        console.error("Reviews fetch failed, using mocks:", error);
        setReviews(MOCK_REVIEWS);
      }
    );
    return unsubscribe;
  }, []);

  if (reviews.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20 lg:px-8">
      <div className="mb-12 text-center">
        <span className="text-primary text-xs font-black mb-4 block">What they say</span>
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Guest Reviews</h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
        {reviews.map((review) => (
          <div key={review.id} className="bg-gray-950 rounded-2xl p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between group hover:-translate-y-1 transition-transform">
            <div className="absolute top-0 right-0 p-6 opacity-5">
              <Quote className="h-16 w-16 text-white" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-1 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-3 w-3 ${i < (review.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-800'}`} 
                  />
                ))}
              </div>

              <p className="text-base text-white/90 leading-relaxed mb-8 line-clamp-4">
                "{review.comment}"
              </p>
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-white/5">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black text-sm border border-primary/20 overflow-hidden shrink-0">
                {review.userPhoto ? (
                  <img src={review.userPhoto} className="w-full h-full object-cover" />
                ) : (
                  review.userName?.charAt(0) || 'U'
                )}
              </div>
              <div className="min-w-0">
                <h4 className="text-white font-black text-sm tracking-wider truncate">{review.userName}</h4>
                <p className="text-gray-500 font-bold text-[10px] tracking-widest truncate">{review.nationality || 'Verified traveler'}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
