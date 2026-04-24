import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { formatPrice, cn } from '../lib/utils';
import { Tour, UserProfile } from '../types';
import { motion } from 'motion/react';
import { auth, db } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

interface TourCardProps {
  tour: Tour;
  index?: number;
}

export default function TourCard({ tour, index = 0 }: TourCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const price = tour.discountPrice || tour.regularPrice;

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        const userRef = doc(db, 'users', authUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const profile = userSnap.data() as UserProfile;
          setIsWishlisted(profile.wishlist?.includes(tour.id) || false);
        }
      }
    });
    return unsubscribe;
  }, [tour.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      navigate('/login');
      return;
    }

    const userRef = doc(db, 'users', user.uid);
    try {
      if (isWishlisted) {
        await updateDoc(userRef, {
          wishlist: arrayRemove(tour.id)
        });
        setIsWishlisted(false);
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(tour.id)
        });
        setIsWishlisted(true);
      }
    } catch (err) {
      console.error("Error updating wishlist:", err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
    >
      <div className="group relative bg-white">
        <Link 
          to={`/tour/${tour.slug || tour.id}`}
          className="block"
        >
          {/* Image Container */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-[10px] mb-4">
            <img 
              src={tour.featuredImage || tour.gallery?.[0] || "https://picsum.photos/seed/placeholder/800/600"} 
              alt={tour.title} 
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            
            {/* Top Badges */}
            <div className="absolute top-3 left-3 flex gap-2">
              {tour.isPopular && (
                <div className="rounded-[6px] bg-white/90 backdrop-blur-sm px-2.5 py-1 shadow-sm">
                  <span className="text-[10px] font-bold text-gray-900">
                    Popular
                  </span>
                </div>
              )}
            </div>

            <div className="absolute bottom-3 left-3">
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-sm border border-gray-100 group/compare cursor-pointer hover:bg-white transition-colors">
                  <svg className="h-3 w-3 text-gray-900" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m16 8 4 4-4 4"></path><path d="M20 12H11"></path><path d="m8 16-4-4 4-4"></path><path d="M4 12h9"></path></svg>
                  <span className="text-[10px] font-bold text-gray-900">Compare</span>
               </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">
                {tour.location}
              </span>
              <div className="flex items-center gap-1">
                 <Star className="h-3 w-3 text-black fill-current" />
                 <span className="text-xs font-black text-gray-900">{tour.rating ? tour.rating.toFixed(1) : '5.0'}</span>
              </div>
            </div>
            
            <h3 className="text-base font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2">
              {tour.title}
            </h3>
            
            <p className="text-xs text-gray-500 font-medium">
              {tour.duration}
            </p>
            
            <div className="pt-1">
              <span className="text-sm font-medium text-gray-600">from </span>
              <span className="text-base font-black text-gray-900">
                {formatPrice(price)}
              </span>
              <span className="text-sm font-medium text-gray-600"> /person</span>
            </div>
          </div>
        </Link>

        {/* Wishlist Button - Outside the Link to handle its own click */}
        <button 
          onClick={toggleWishlist}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all z-10",
            isWishlisted 
              ? "bg-[#00A651] text-white shadow-lg shadow-emerald-200" 
              : "bg-black/10 text-white hover:bg-black/20"
          )}
        >
          <Heart className={cn("h-4 w-4", isWishlisted && "fill-current")} />
        </button>
      </div>
    </motion.div>
  );
}

