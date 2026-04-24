import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BlogPost } from '../types';
import { MOCK_BLOGS } from '../lib/mockData';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { cn } from '../lib/utils';

export default function BlogArchive() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost)));
        } else {
          setPosts(MOCK_BLOGS);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Blogs fetch failed, using mocks:", error);
        setPosts(MOCK_BLOGS);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Icons.Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-gray-50">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
        <div className="max-w-7xl mx-auto px-6 relative z-10 text-center">
            <motion.span 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-block px-4 py-2 bg-emerald-100 text-primary text-[10px] font-black rounded-full mb-6"
            >
              The Bali Wanderlust blog
            </motion.span>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-black text-gray-900 mb-8 tracking-tighter"
            >
              Stories from the <br />
              <span className="text-secondary">island of the gods</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-gray-500 max-w-2xl mx-auto font-medium"
            >
              Insider tips, travel guides, and local stories to help you plan the perfect Bali adventure.
            </motion.p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          {posts.map((post, idx) => (
            <motion.article 
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="group cursor-pointer"
            >
              <Link to={`/blog/${post.slug}`}>
                <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] mb-8 shadow-2xl shadow-gray-200/50">
                  <img 
                    src={post.featuredImage || `https://picsum.photos/seed/${post.slug}/800/600`} 
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-6 left-6">
                    <span className="px-5 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-primary">
                      {post.category}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-4 px-2">
                  <div className="flex items-center gap-4 text-[10px] font-black text-gray-400">
                    <span className="flex items-center gap-1">
                      <Icons.Calendar className="h-3 w-3" />
                      {post.publishedAt?.toDate ? post.publishedAt.toDate().toLocaleDateString() : 'Draft'}
                    </span>
                    <span className="h-1 w-1 bg-gray-200 rounded-full" />
                    <span className="flex items-center gap-1">
                      <Icons.User className="h-3 w-3" />
                      {post.author || 'DayTours'}
                    </span>
                  </div>
                  
                  <h2 className="text-2xl font-black text-gray-900 group-hover:text-primary transition-colors tracking-tight leading-tight">
                    {post.title}
                  </h2>
                  
                  <p className="text-gray-500 font-medium line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                  
                  <div className="pt-4 flex items-center gap-2 text-primary font-black text-xs group-hover:gap-4 transition-all">
                    Read more
                    <Icons.ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            </motion.article>
          ))}
        </div>

        {posts.length === 0 && (
          <div className="py-40 text-center">
             <Icons.Inbox className="h-16 w-16 text-gray-200 mx-auto mb-6" />
             <h3 className="text-2xl font-black text-gray-900 mb-2">No Stories Yet</h3>
             <p className="text-gray-500 font-medium">We're currently writing some amazing content for you. Check back soon!</p>
          </div>
        )}
      </section>

      {/* Newsletter Section */}
      <section className="py-24 bg-gray-900 relative overflow-hidden mx-6 rounded-[48px] mb-24">
         <div className="absolute inset-0 bg-emerald-600 opacity-10 mix-blend-overlay" />
         <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">Stay in the Loop</h2>
            <p className="text-emerald-100/70 font-bold mb-10 text-lg">Get the latest travel tips and exclusive Bali offers delivered to your inbox.</p>
            <form className="flex flex-col md:flex-row gap-4 max-w-lg mx-auto">
               <input 
                 type="email" 
                 placeholder="Your email address" 
                 className="flex-1 px-8 py-5 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:bg-white/20 transition-all font-bold"
               />
               <button className="px-10 py-5 bg-primary text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-950 text-xs">
                 Subscribe
               </button>
            </form>
         </div>
      </section>
    </div>
  );
}
