import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { BlogPost } from '../types';
import { MOCK_BLOGS } from '../lib/mockData';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { cn } from '../lib/utils';

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [toc, setToc] = useState<{ level: number; text: string; id: string }[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      
      try {
        const q = query(
          collection(db, 'posts'),
          where('slug', '==', slug),
          where('status', '==', 'published'),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          setPost({ id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() } as BlogPost);
        } else {
          // Try mock fallback
          const mockPost = MOCK_BLOGS.find(b => b.slug === slug);
          if (mockPost) {
            setPost(mockPost);
          } else {
            setPost(null);
          }
        }
      } catch (error) {
        console.error("Error fetching post, using mock fallback", error);
        const mockPost = MOCK_BLOGS.find(b => b.slug === slug);
        if (mockPost) {
          setPost(mockPost);
        } else {
          setPost(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
    window.scrollTo(0, 0);
  }, [slug]);

  // Extract TOC and assign IDs to headings after content is rendered
  useEffect(() => {
    if (!loading && post && contentRef.current) {
      const headingElements = contentRef.current.querySelectorAll('h1, h2, h3');
      const generatedToc: { level: number; text: string; id: string }[] = [];
      
      headingElements.forEach((el, index) => {
        const text = el.textContent || '';
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') || `heading-${index}`;
        el.setAttribute('id', id);
        el.classList.add('scroll-mt-24'); // Add smooth scroll offset
        
        const level = parseInt(el.tagName.substring(1));
        generatedToc.push({ level, text, id });
      });
      
      setToc(generatedToc);
    }
  }, [loading, post]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Icons.Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6 text-center">
        <Icons.FileQuestion className="h-20 w-20 text-gray-200 mb-6" />
        <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Article Not Found</h1>
        <p className="text-gray-500 font-medium mb-8">The story you're looking for might have been moved or doesn't exist.</p>
        <Link to="/blog" className="px-8 py-4 bg-primary text-white font-black rounded-2xl text-xs hover:bg-emerald-700 transition-all">
          Back to blog
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen font-sans pb-24">
      {/* Header / Hero */}
      <section className="relative pt-32 pb-48 lg:pb-64 overflow-hidden bg-gray-900">
        <div className="absolute inset-0 z-0">
          <img 
            src={post.featuredImage || 'https://picsum.photos/seed/detail/1920/1080'} 
            className="w-full h-full object-cover opacity-40 scale-105 blur-[2px]" 
            alt=""
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/60 via-gray-900/80 to-white" />
        </div>

        <div className="max-w-4xl mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Link to="/blog" className="inline-flex items-center gap-2 text-emerald-400 font-black text-xs mb-8 hover:text-white transition-colors">
              <Icons.ChevronLeft className="h-4 w-4" /> Back to blog
            </Link>
            
            <div className="flex items-center justify-center gap-4 mb-8">
               <span className="px-5 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-full">
                 {post.category}
               </span>
               <span className="text-emerald-100/60 font-bold text-xs flex items-center gap-1">
                 <Icons.Clock className="h-3.5 w-3.5" /> 5 min read
               </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-10 tracking-tighter leading-[1.1]">
              {post.title}
            </h1>

            <div className="flex items-center justify-center gap-8 text-emerald-100/60 font-bold text-xs">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-sm">
                   {post.author?.charAt(0) || 'B'}
                 </div>
                 <span>{post.author || 'Bali Adventours'}</span>
              </div>
              <div className="flex items-center gap-2">
                 <Icons.Calendar className="h-4 w-4" />
                 {post.publishedAt?.toDate ? post.publishedAt.toDate().toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Article Content */}
      <section className="-mt-32 max-w-4xl mx-auto px-6 relative z-10">
         <motion.div 
           initial={{ opacity: 0, y: 40 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="bg-white rounded-[48px] p-8 md:p-16 shadow-2xl shadow-gray-300/50"
         >
           {/* Featured Image Large */}
           <div className="aspect-video w-full rounded-[32px] overflow-hidden mb-16 shadow-2xl shadow-emerald-100/50">
             <img 
               src={post.featuredImage || 'https://picsum.photos/seed/featured/1200/800'} 
               className="w-full h-full object-cover" 
               alt={post.title}
               referrerPolicy="no-referrer"
             />
           </div>

           {/* Table of Contents */}
           {toc.length > 0 && (
             <div className="mb-16 p-8 bg-gray-50/50 rounded-[32px] border border-gray-100">
               <h4 className="text-xs font-black text-primary mb-6 flex items-center gap-2">
                 <Icons.List className="h-4 w-4" /> In this article
               </h4>
               <nav className="space-y-4">
                 {toc.map((item, idx) => (
                   <a 
                     key={idx} 
                     href={`#${item.id}`}
                     className={cn(
                       "block font-bold text-sm transition-all hover:text-primary",
                       item.level === 3 ? "ml-6 text-gray-400" : (item.level === 1 ? "text-gray-900" : "text-gray-600")
                     )}
                   >
                     {item.text}
                   </a>
                 ))}
               </nav>
             </div>
           )}

           {/* Content Rendering */}
           <div 
             ref={contentRef}
             className="prose prose-lg lg:prose-xl prose-emerald max-w-none font-medium text-gray-700 leading-[1.8] tracking-normal mb-16
               prose-headings:font-black prose-headings:text-gray-900 prose-headings:tracking-tight
               prose-p:mb-8 prose-p:leading-relaxed
               prose-img:rounded-[32px] prose-img:shadow-2xl prose-img:my-12
               prose-blockquote:border-l-8 prose-blockquote:border-primary prose-blockquote:bg-emerald-50 prose-blockquote:p-8 prose-blockquote:rounded-r-[32px] prose-blockquote:font-black prose-blockquote:text-gray-900 prose-blockquote:text-2xl
               "
             dangerouslySetInnerHTML={{ __html: post.content }}
           />
           
           {/* Tags */}
           {post.tags && post.tags.length > 0 && (
             <div className="mt-20 pt-10 border-t border-gray-100 flex flex-wrap gap-3">
               <span className="text-[10px] font-black text-gray-400 w-full mb-2">Tagged with:</span>
               {post.tags.map(tag => (
                 <span key={tag} className="px-4 py-2 bg-gray-50 text-gray-500 font-bold text-xs rounded-full hover:bg-emerald-50 hover:text-primary transition-colors cursor-pointer">
                   # {tag}
                 </span>
               ))}
             </div>
           )}
         </motion.div>
      </section>

      {/* Share Section */}
      <section className="max-w-4xl mx-auto px-6 mt-16 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <span className="text-xs font-black text-gray-900">Share this story:</span>
            <div className="flex gap-2">
               {[Icons.Facebook, Icons.Twitter, Icons.Send, Icons.Link].map((Icon, i) => (
                 <button key={i} className="h-10 w-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary hover:text-white hover:border-primary transition-all">
                   <Icon className="h-4 w-4" />
                 </button>
               ))}
            </div>
         </div>
         <button 
           onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
           className="flex items-center gap-2 text-primary font-black text-xs hover:gap-4 transition-all"
         >
            Back to top <Icons.ArrowUp className="h-4 w-4" />
         </button>
      </section>
    </div>
  );
}
