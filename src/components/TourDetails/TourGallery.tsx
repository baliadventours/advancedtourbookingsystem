import { useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

interface TourGalleryProps {
  images: string[];
}

export default function TourGallery({ images }: TourGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showFullGallery, setShowFullGallery] = useState(false);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-video w-full animate-pulse rounded-[10px] bg-gray-200" />
    );
  }

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % images.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

  return (
    <div className="space-y-6">
      {/* Mobile Version: Single Image with Slider */}
      <div className="md:hidden space-y-4">
        <div className="group relative aspect-[4/3] overflow-hidden rounded-[10px] bg-gray-100">
          <img
            src={images[currentIndex]}
            alt={`Gallery ${currentIndex}`}
            className="absolute inset-0 h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/10" />
          
          <div className="absolute inset-x-4 top-1/2 flex -translate-y-1/2 justify-between">
            <button onClick={handlePrev} className="h-8 w-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button onClick={handleNext} className="h-8 w-8 rounded-full bg-white/80 flex items-center justify-center shadow-sm">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <button 
            onClick={() => setShowFullGallery(true)}
            className="absolute bottom-4 right-4 flex items-center gap-1 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-md"
          >
            <Plus className="h-3 w-3" /> See More
          </button>
        </div>
      </div>

      {/* Desktop Version: Bento Style Grid (4-5 images) */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-3 h-[500px]">
        {/* Main Big Image */}
        <div className="col-span-2 row-span-2 relative overflow-hidden rounded-[10px] group">
          <img 
            src={images[0]} 
            alt="Main" 
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        </div>

        {/* Small Images */}
        {images.slice(1, 4).map((img, idx) => (
          <div key={idx} className="relative overflow-hidden rounded-[10px] group">
            <img 
              src={img} 
              alt={`Gallery ${idx + 1}`} 
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        ))}

        {/* 5th Image with "+X More" overlay */}
        {images.length >= 5 && (
          <div 
            className="relative overflow-hidden rounded-[10px] group cursor-pointer"
            onClick={() => setShowFullGallery(true)}
          >
            <img 
              src={images[4]} 
              alt="More" 
              className="h-full w-full object-cover" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 group-hover:bg-black/50 transition-colors">
              <span className="text-2xl font-black text-white">+{images.length - 4}</span>
              <span className="text-xs font-bold text-white uppercase tracking-wider">Show All</span>
            </div>
          </div>
        )}

        {/* If less than 5 images, show placeholders or just empty space handled by grid */}
      </div>

      {/* Full Gallery Modal/Overlay */}
      <AnimatePresence>
        {showFullGallery && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex flex-col bg-black/95 p-4 md:p-8"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Tour Gallery ({images.length} photos)</h2>
              <button onClick={() => setShowFullGallery(false)} className="h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pb-12">
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
                {images.map((img, idx) => (
                  <img 
                    key={idx} 
                    src={img} 
                    alt={`Full Gallery ${idx}`} 
                    className="w-full rounded-[10px]" 
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Add Close icon import
import { X } from 'lucide-react';
