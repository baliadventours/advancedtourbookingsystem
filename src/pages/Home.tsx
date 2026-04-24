import { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Tour } from '../types';
import { MOCK_TOURS } from '../lib/mockData';
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf } from 'lucide-react';
import TourCard from '../components/TourCard';
import { useSettings } from '../lib/SettingsContext';
import SearchForm from '../components/Home/SearchForm';
import TopRatedTours from '../components/Home/TopRatedTours';
import ReviewSlider from '../components/Home/ReviewSlider';
import BlogSection from '../components/Home/BlogSection';

export default function Home() {
  const { settings } = useSettings();
  const [tours, setTours] = useState<Tour[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'tours'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          setTours(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tour)));
        } else {
          setTours(MOCK_TOURS);
        }
      },
      (error) => {
        console.error("Tours fetch failed, using mocks:", error);
        setTours(MOCK_TOURS);
      }
    );
    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[85vh] w-full overflow-hidden">
        <img 
          src="https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&q=80&w=1920" 
          alt="Bali Landscape" 
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white px-4 pb-20">
          <span className="mb-4 inline-block px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-black">Explore {settings?.siteName}</span>
          <h1 className="mb-6 text-4xl font-black md:text-6xl leading-[0.95] tracking-tighter max-w-4xl">
            Discover the Hidden <span className="text-secondary">Treasures</span> of {settings?.siteName.split(' ')[0] || 'Bali'}
          </h1>
          <p className="mb-10 max-w-xl text-lg text-gray-100 font-medium leading-relaxed opacity-90">
            Curated expeditions through active volcanoes, emerald rice terraces, and ancient water temples.
          </p>
        </div>

        {/* Search Form Overlayed Inside Hero */}
        <div className="absolute bottom-5 left-0 w-full z-30">
          <SearchForm />
        </div>
      </section>

      {/* Feature Tour */}
      <section className="container mx-auto px-4 py-20 lg:px-8">
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="h-4 w-4 text-primary" />
              <span className="text-primary text-xs font-black">Handpicked experiences</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Featured Tours</h2>
            <p className="mt-3 text-gray-500 font-medium text-lg">Curated expeditions our guests love most</p>
          </div>
          <Link to="/tours" className="flex items-center gap-2 text-primary font-black text-xs group">
            View all tours <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
          {tours.slice(0, 8).map((tour, index) => (
            <TourCard key={tour.id} tour={tour} index={index} />
          ))}
        </div>
        
        {tours.length === 0 && (
           <div className="col-span-full py-20 bg-gray-50 rounded-[32px] text-center text-gray-400">
              <p className="text-xl font-black mb-2">No expeditions found</p>
              <p className="text-sm font-medium">Check back later for new adventures.</p>
           </div>
        )}
      </section>

      {/* Top Rated Tour */}
      <TopRatedTours />

      {/* Review Slider */}
      <ReviewSlider />

      {/* Blog Section */}
      <BlogSection />
    </div>
  );
}
