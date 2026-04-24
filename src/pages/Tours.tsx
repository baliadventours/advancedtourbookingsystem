import { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { Tour, Category, LocationMeta } from '../types';
import { MOCK_TOURS } from '../lib/mockData';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import TourCard from '../components/TourCard';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'rating';

export default function Tours() {
  const [tours, setTours] = useState<Tour[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [locations, setLocations] = useState<LocationMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<number>(2000);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Fetch categories and locations
    const fetchMetadata = async () => {
      const catSnap = await getDocs(collection(db, 'categories'));
      const locSnap = await getDocs(collection(db, 'locationMeta'));
      setCategories(catSnap.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
      setLocations(locSnap.docs.map(d => ({ id: d.id, ...d.data() } as LocationMeta)));
    };
    fetchMetadata();

    const q = query(collection(db, 'tours'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          setTours(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tour)));
        } else {
          setTours(MOCK_TOURS);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Tours fetch failed, using mocks:", error);
        setTours(MOCK_TOURS);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, []);

  const filteredAndSortedTours = useMemo(() => {
    const filtered = tours.filter(tour => {
      const matchesSearch = tour.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           tour.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || tour.categoryId === selectedCategory;
      const matchesLocation = selectedLocation === 'all' || tour.locationId === selectedLocation;
      const price = tour.discountPrice || tour.regularPrice;
      const matchesPrice = price <= priceRange;

      return matchesSearch && matchesCategory && matchesLocation && matchesPrice;
    });

    return filtered.sort((a, b) => {
      const priceA = a.discountPrice || a.regularPrice;
      const priceB = b.discountPrice || b.regularPrice;

      switch (sortBy) {
        case 'price-low': return priceA - priceB;
        case 'price-high': return priceB - priceA;
        case 'rating': return (b.rating || 0) - (a.rating || 0);
        case 'newest':
        default:
          return (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0);
      }
    });
  }, [tours, searchTerm, selectedCategory, selectedLocation, priceRange, sortBy]);

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Page Header */}
      <section className="pt-24 pb-12 bg-white border-b border-gray-100">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-4">Choose your adventure</h1>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">
              Explore our curated collection of Bali's most extraordinary expeditions, from majestic peaks to coastal sanctuaries.
            </p>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filter */}
          <aside className="lg:w-72 flex-shrink-0">
            {/* Mobile Filter Toggle */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full flex items-center justify-between px-6 py-4 bg-white border border-gray-200 rounded-2xl font-black text-xs text-gray-900 mb-6"
            >
              <span className="flex items-center gap-2"><Filter className="h-4 w-4" /> Filters</span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", showFilters && "rotate-180")} />
            </button>

            <div className={cn(
              "space-y-10 lg:block lg:sticky lg:top-32",
              showFilters ? "block" : "hidden"
            )}>
              {/* Search */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400">Search</h3>
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                  <input 
                    type="text"
                    placeholder="Keywords..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all text-sm font-bold text-gray-900 placeholder:text-gray-300"
                  />
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400">Activity type</h3>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      "px-4 py-2 rounded-full text-[10px] font-black border transition-all",
                      selectedCategory === 'all' 
                        ? "bg-gray-900 border-gray-900 text-white" 
                        : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                    )}
                  >
                    All types
                  </button>
                  {categories.map(cat => (
                    <button 
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-[10px] font-black border transition-all",
                        selectedCategory === cat.id 
                          ? "bg-gray-900 border-gray-900 text-white" 
                          : "bg-white border-gray-100 text-gray-500 hover:border-gray-200"
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-gray-400">Destination</h3>
                <div className="relative">
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-sm font-bold text-gray-900 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all"
                  >
                    <option value="all">Across Bali</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-gray-400">Max price</h3>
                  <span className="text-xs font-black text-primary">${priceRange}</span>
                </div>
                <input 
                  type="range"
                  min="50"
                  max="2000"
                  step="50"
                  value={priceRange}
                  onChange={e => setPriceRange(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-bold text-gray-300">
                  <span>$50</span>
                  <span>$2000+</span>
                </div>
              </div>

              {/* Clear Filters */}
              {(searchTerm || selectedCategory !== 'all' || selectedLocation !== 'all' || priceRange < 2000) && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedLocation('all');
                    setPriceRange(2000);
                  }}
                  className="w-full py-4 bg-gray-50 text-red-500 rounded-xl text-xs font-black hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
                >
                  <X className="h-4 w-4" /> Reset filters
                </button>
              )}
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="mb-10 flex flex-col sm:flex-row items-center justify-between gap-6 pb-6 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-400">
                Showing <span className="text-gray-900">{filteredAndSortedTours.length}</span> results
              </p>
              
              <div className="flex items-center gap-4">
                <span className="text-xs font-black text-gray-400 hidden sm:inline-block">Sort by:</span>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none bg-white border border-gray-200 rounded-xl py-2 padding-right pl-4 pr-10 text-sm font-bold text-gray-900 cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary transition-all text-right"
                  >
                    <option value="newest">Featured</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Top Rated</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {[1,2,3,4,5,6].map(n => (
                      <div key={n} className="space-y-4 animate-pulse">
                          <div className="aspect-[4/5] bg-white rounded-[24px]" />
                          <div className="space-y-3">
                            <div className="h-2 bg-gray-200 rounded-full w-1/3" />
                            <div className="h-4 bg-gray-200 rounded-full w-full" />
                            <div className="h-2 bg-gray-200 rounded-full w-1/4" />
                          </div>
                      </div>
                  ))}
              </div>
            ) : (
              <>
                {filteredAndSortedTours.length > 0 ? (
                  <div className="grid gap-y-12 gap-x-8 sm:grid-cols-2 xl:grid-cols-3">
                    {filteredAndSortedTours.map((tour, index) => (
                      <TourCard key={tour.id} tour={tour} index={index} />
                    ))}
                  </div>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-40 text-center bg-white rounded-[48px] border border-gray-50 shadow-sm"
                  >
                    <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-8">
                        <Search className="h-8 w-8 text-gray-300" />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-4">No adventures found</h3>
                    <p className="text-gray-400 font-medium max-w-xs mb-10">We couldn't find any tours matching your current filters. Try resetting or adjusting them.</p>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
