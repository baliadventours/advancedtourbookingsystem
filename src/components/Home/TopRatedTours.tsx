import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { Tour } from '../../types';
import { MOCK_TOURS } from '../../lib/mockData';
import TourCard from '../TourCard';
import { Star } from 'lucide-react';

export default function TopRatedTours() {
  const [tours, setTours] = useState<Tour[]>([]);

  useEffect(() => {
    // Only fetch tours with rating >= 4.5
    const q = query(
      collection(db, 'tours'), 
      where('rating', '>=', 4.5),
      orderBy('rating', 'desc'),
      limit(8)
    );
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          setTours(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tour)));
        } else {
          setTours(MOCK_TOURS.filter(t => (t.rating || 0) >= 4.5));
        }
      },
      (error) => {
        console.error("Top rated tours fetch failed, using mocks:", error);
        setTours(MOCK_TOURS.filter(t => (t.rating || 0) >= 4.5));
      }
    );
    return unsubscribe;
  }, []);

  if (tours.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20 lg:px-8 bg-gray-50/50 rounded-[40px] my-10">
      <div className="mb-12 text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Star className="h-5 w-5 text-amber-500 fill-amber-500" />
          <span className="text-gray-400 text-sm font-bold tracking-widest">Top rated experiences</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Guest Favorites</h2>
        <p className="mt-4 text-gray-500 font-medium text-lg">The most loved tours by our explorers</p>
      </div>

      <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {tours.map((tour, index) => (
          <TourCard key={tour.id} tour={tour} index={index} />
        ))}
      </div>
    </section>
  );
}
