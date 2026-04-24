import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, ChevronDown, Loader2 } from 'lucide-react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

export default function SearchForm() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    async function fetchLocations() {
      try {
        const q = query(collection(db, 'locationMeta'), orderBy('name', 'asc'));
        const snapshot = await getDocs(q);
        const locs = snapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name
        }));
        setLocations(locs);
      } catch (error) {
        console.error("Error fetching locations:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchLocations();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.append('search', keyword);
    if (selectedLocation !== 'all') params.append('location', selectedLocation);
    navigate(`/tours?${params.toString()}`);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="w-full max-w-5xl mx-auto px-4 relative"
    >
      <div className={cn(
        "bg-white rounded-[10px] p-2 md:p-3 transition-all duration-500 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] border border-gray-100",
        isFocused ? "shadow-[0_48px_80px_-20px_rgba(0,166,81,0.15)] border-primary/20 scale-[1.01]" : "hover:scale-[1.005]"
      )}>
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row items-center gap-1">
          {/* Keyword Search */}
          <div className="flex-[1.5] w-full relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
              <Search className="h-5 w-5" />
            </div>
            <div className="flex flex-col pl-14 pr-4 py-3 rounded-2xl hover:bg-gray-50/80 focus-within:bg-gray-50 transition-colors">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Destination</label>
              <input 
                type="text"
                placeholder="Where are you going?"
                value={keyword}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full bg-transparent p-0 border-none ring-0 focus:ring-0 text-sm font-bold text-gray-900 placeholder:text-gray-300 placeholder:font-medium"
              />
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-gray-100 mx-2" />

          {/* Location Select */}
          <div className="flex-1 w-full relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
              <MapPin className="h-5 w-5" />
            </div>
            <div className="flex flex-col pl-14 pr-8 py-3 rounded-2xl hover:bg-gray-50/80 focus-within:bg-gray-50 transition-colors relative">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Area</label>
              <select
                value={selectedLocation}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full bg-transparent p-0 border-none ring-0 focus:ring-0 text-sm font-bold text-gray-900 appearance-none cursor-pointer"
              >
                <option value="all">All Bali Areas</option>
                {loading ? (
                  <option disabled>Loading...</option>
                ) : (
                  locations.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name}</option>
                  ))
                )}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 pointer-events-none" />
            </div>
          </div>

          <div className="hidden md:block w-px h-12 bg-gray-100 mx-2" />

          {/* Activity / Type (Bonus for modernization) */}
          <div className="flex-1 w-full relative group">
             <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors pointer-events-none">
              <Users className="h-5 w-5" />
            </div>
            <div className="flex flex-col pl-14 pr-4 py-3 rounded-2xl hover:bg-gray-50/80 transition-colors">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Travelers</label>
              <p className="text-sm font-bold text-gray-900">Add guests</p>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full md:w-auto bg-primary text-white px-10 py-5 rounded-[20px] font-black text-sm hover:bg-emerald-700 transition-all shadow-xl shadow-primary/20 active:scale-95 flex items-center justify-center gap-2 mt-2 md:mt-0"
          >
            <span>Search</span>
          </button>
        </form>
      </div>
    </motion.div>
  );
}
