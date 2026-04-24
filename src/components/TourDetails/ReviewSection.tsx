import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Star, MessageCircle, Send, Globe, Calendar, Image as ImageIcon, Camera, Loader2, User, Flag } from 'lucide-react';
import { db, auth } from '../../lib/firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc, where } from 'firebase/firestore';
import { Review } from '../../types';
import { cn } from '../../lib/utils';
import { uploadImage } from '../../lib/imgbb';

interface ReviewSectionProps {
  tourId: string;
}

const COUNTRIES = [
  "Australia", "United States", "United Kingdom", "Germany", "France", "Japan", 
  "Singapore", "Malaysia", "China", "Indonesia", "Canada", "Netherlands", 
  "Russia", "South Korea", "India", "Other"
];

export default function ReviewSection({ tourId }: ReviewSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [name, setName] = useState(auth.currentUser?.displayName || '');
  const [nationality, setNationality] = useState('');
  const [tourDate, setTourDate] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [honeypot, setHoneypot] = useState(''); // Anti-spam honeypot

  useEffect(() => {
    const q = query(
      collection(db, 'reviews'),
      where('tourId', '==', tourId),
      where('status', '==', 'approved'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[];
      setReviews(data);
    });

    return unsubscribe;
  }, [tourId]);

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > 5) {
      alert("Maximum 5 images allowed per review");
      return;
    }

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file));
      const urls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...urls]);
    } catch (error) {
      alert("Failed to upload some images. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // Anti-spam check: Honeypot
    if (honeypot) {
      console.warn("Spam detected via honeypot");
      return;
    }

    if (!auth.currentUser) {
      alert("Please login to leave a review");
      return;
    }

    if (!nationality) {
      alert("Please select your nationality");
      return;
    }

    if (comment.length < 50) {
      alert("Feedback is too short. Please provide at least 50 characters to help other travelers.");
      return;
    }

    // Anti-spam: Check for repetitive characters or words
    const repetitiveCharRegex = /(.)\1{9,}/; // Same character 10+ times
    if (repetitiveCharRegex.test(comment)) {
      alert("Please provide a more detailed and natural review.");
      return;
    }

    const words = comment.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    if (words.length > 20 && uniqueWords.size / words.length < 0.3) {
      alert("Please provide a more detailed and unique review.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Get tour title for the review record
      const tourSnap = await getDoc(doc(db, 'tours', tourId));
      const tourTitle = tourSnap.exists() ? tourSnap.data().title : 'Unknown Tour';

      await addDoc(collection(db, 'reviews'), {
        tourId,
        tourTitle,
        userId: auth.currentUser.uid,
        userName: name || 'Anonymous',
        userPhoto: auth.currentUser.photoURL || '',
        nationality,
        tourDate,
        rating,
        title,
        comment,
        image: images[0] || '', // Keep for backward compatibility
        images: images,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      
      alert("Review submitted! It will be visible after approval.");
      
      // Reset form
      setComment('');
      setTitle('');
      setRating(5);
      setNationality('');
      setTourDate('');
      setImages([]);
    } catch (error) {
      console.error("Error adding review", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  return (
    <div id="reviews" className="space-y-12 scroll-mt-[116px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-100 pb-8">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Guest Reviews</h2>
          <p className="text-sm font-medium text-gray-500">Real verified guest feedback from our tours.</p>
        </div>
        <div className="flex items-center gap-4 bg-gray-50 px-6 py-4 rounded-[10px] self-start border border-gray-100">
          <div className="flex flex-col items-center">
            <span className="text-3xl font-black text-gray-900">{averageRating}</span>
            <div className="flex items-center gap-0.5 text-amber-500">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star key={s} className={cn("h-3 w-3 fill-current", Number(averageRating) >= s ? "text-amber-500" : "text-gray-200")} />
              ))}
            </div>
          </div>
          <div className="h-10 w-[1px] bg-gray-200" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Total</span>
            <span className="font-bold text-gray-900">{reviews.length} reviews</span>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {reviews.map((review) => (
          <div key={review.id} className="flex gap-6 group">
            <div className="hidden sm:block">
              {review.userPhoto ? (
                <img 
                  src={review.userPhoto} 
                  alt={review.userName} 
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-emerald-50"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="h-14 w-14 flex items-center justify-center rounded-full bg-emerald-50 font-black text-primary text-xl ring-2 ring-emerald-50">
                  {review.userName.charAt(0)}
                </div>
              )}
            </div>
            <div className="flex-1 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <h4 className="font-black text-gray-900 text-lg leading-tight flex items-center gap-2">
                      {review.userName}
                      {review.nationality && (
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Flag className="h-2 w-2" /> {review.nationality}
                        </span>
                      )}
                    </h4>
                    {review.tourDate && (
                      <span className="text-xs font-medium text-gray-400 flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> Traveled in {new Date(review.tourDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={cn("h-4 w-4 fill-current", review.rating > i ? "text-amber-500" : "text-gray-200")} />
                      ))}
                    </div>
                    {review.createdAt && (
                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                        {review.createdAt.toDate().toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                {review.title && (
                  <h5 className="font-black text-gray-900">{review.title}</h5>
                )}
                <p className="text-base leading-relaxed text-gray-600 font-medium text-justify">{review.comment}</p>
                {(review.images && review.images.length > 0) ? (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {review.images.map((img, i) => (
                      <div key={i} className="aspect-square rounded-[10px] overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                        <img 
                          src={img} 
                          alt={`Review ${i + 1}`} 
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                          referrerPolicy="no-referrer"
                          onClick={() => window.open(img, '_blank')}
                        />
                      </div>
                    ))}
                  </div>
                ) : review.image && (
                  <div className="mt-4 max-w-sm rounded-[10px] overflow-hidden border border-gray-100 shadow-sm bg-gray-50">
                    <img 
                      src={review.image} 
                      alt="Review" 
                      className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                      referrerPolicy="no-referrer"
                      onClick={() => window.open(review.image, '_blank')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <div className="text-center text-gray-500 py-16 bg-gray-50/50 rounded-[10px] border border-gray-100 border-dashed">
            <MessageCircle className="mx-auto h-16 w-16 opacity-10 mb-4" />
            <p className="font-bold text-gray-400">Be the first to share your experience!</p>
          </div>
        )}
      </div>

      <div className="rounded-[10px] border border-gray-100 bg-white p-8 shadow-2xl shadow-gray-200/50">
        <div className="mb-8 space-y-1">
          <h3 className="text-2xl font-black text-gray-900 tracking-tight">Share Your Experience</h3>
          <p className="text-sm font-medium text-gray-500">Your review helps other travelers make better decisions.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 flex items-center gap-2">
                <User className="h-3 w-3" /> Your full name
              </label>
              <input 
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="How should we call you?"
                className="w-full rounded-[10px] border-2 border-gray-50 bg-gray-50/50 p-4 text-sm font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 flex items-center gap-2">
                <Globe className="h-3 w-3" /> Nationality
              </label>
              <select 
                required
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full rounded-[10px] border-2 border-gray-50 bg-gray-50/50 p-4 text-sm font-bold focus:border-primary focus:bg-white focus:outline-none transition-all appearance-none"
              >
                <option value="">Select country</option>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 flex items-center gap-2">
                <Calendar className="h-3 w-3" /> Tour date (when you traveled)
              </label>
              <input 
                type="date"
                required
                value={tourDate}
                onChange={(e) => setTourDate(e.target.value)}
                className="w-full rounded-[10px] border-2 border-gray-50 bg-gray-50/50 p-4 text-sm font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 flex items-center gap-2">
                <Star className="h-3 w-3" /> Your rating
              </label>
              <div className="flex gap-2 p-2 bg-gray-50/50 rounded-xl w-fit">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={cn("h-8 w-8 transition-colors", rating >= s ? "fill-amber-500 text-amber-500" : "text-gray-200")} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400">Review title</label>
            <input 
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your review a catchy headline"
              className="w-full rounded-[10px] border-2 border-gray-50 bg-gray-50/50 p-4 text-sm font-bold focus:border-primary focus:bg-white focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400">Review content</label>
            <textarea
              required
              rows={5}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us about the guides, the locations, and the highlights of your trip... (Min. 50 characters)"
              className="w-full rounded-[10px] border-2 border-gray-50 bg-gray-50/50 p-4 text-sm font-medium focus:border-primary focus:bg-white focus:outline-none transition-all leading-relaxed"
            />
          </div>

          {/* Honeypot Field */}
          <div className="hidden" aria-hidden="true">
            <input 
              type="text" 
              name="website" 
              tabIndex={-1} 
              autoComplete="off" 
              value={honeypot} 
              onChange={e => setHoneypot(e.target.value)} 
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-black text-gray-400">Add photos (Max 5)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {images.map((url, idx) => (
                <div key={idx} className="relative aspect-square rounded-[10px] overflow-hidden border-2 border-emerald-500 shadow-sm group">
                  <img src={url} alt="Preview" className="h-full w-full object-cover" />
                  <button 
                    type="button" 
                    onClick={() => removeImage(idx)}
                    className="absolute top-1 right-1 h-6 w-6 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 shadow-xl"
                  >
                    &times;
                  </button>
                </div>
              ))}
              
              {images.length < 5 && (
                <div className="relative aspect-square border-2 border-dashed border-gray-200 rounded-[15px] flex flex-col items-center justify-center gap-2 bg-gray-50/30 hover:border-primary transition-colors cursor-pointer group">
                  <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-gray-400 shadow-sm transition-transform group-hover:scale-110">
                    {isUploading ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Camera className="h-5 w-5" />}
                  </div>
                  <span className="text-[10px] font-black text-gray-400 text-center px-2">
                    {isUploading ? 'Uploading...' : 'Add photo'}
                  </span>
                  <input 
                    type="file" 
                    multiple
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="flex w-full items-center justify-center gap-3 rounded-[10px] bg-primary py-5 font-black text-white hover:bg-emerald-700 hover:shadow-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 text-sm"
          >
            {isSubmitting ? (
              <><Loader2 className="h-5 w-5 animate-spin" /> Publishing review...</>
            ) : (
              <><Send className="h-5 w-5" /> Submit review</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
