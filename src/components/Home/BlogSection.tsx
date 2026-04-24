import { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { BlogPost } from '../../types';
import { MOCK_BLOGS } from '../../lib/mockData';
import { Link } from 'react-router-dom';
import { ArrowRight, Calendar, User } from 'lucide-react';

export default function BlogSection() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        if (!snapshot.empty) {
          setPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost)));
        } else {
          setPosts(MOCK_BLOGS);
        }
      },
      (error) => {
        console.error("Posts fetch failed, using mocks:", error);
        setPosts(MOCK_BLOGS);
      }
    );
    return unsubscribe;
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-20 lg:px-8 bg-white overflow-hidden">
      <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <span className="text-secondary text-xs font-black mb-4 block">Explore more</span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight leading-none">Travel Inspiration</h2>
          <p className="mt-4 text-gray-500 font-medium text-lg">Tips, guides, and stories from the island of the gods.</p>
        </div>
        <Link to="/blog" className="flex items-center gap-2 text-gray-900 font-black text-xs group border-b-2 border-secondary pb-2">
          Read all posts <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {posts.map((post) => (
          <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
            <div className="relative aspect-[16/10] overflow-hidden rounded-2xl mb-6 shadow-xl shadow-gray-200/50">
              <img 
                src={post.featuredImage || `https://picsum.photos/seed/${post.slug}/800/600`}
                alt={post.title}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-4 left-4">
                <span className="px-4 py-2 bg-white/90 backdrop-blur-md rounded-full text-[10px] font-black text-primary shadow-sm">
                  {post.category}
                </span>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400">
                <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {post.publishedAt?.toDate ? post.publishedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}</span>
                <span className="h-1 w-1 bg-gray-200 rounded-full" />
                <span className="flex items-center gap-1.5"><User className="h-3 w-3" /> {post.author || 'Admin'}</span>
              </div>
              <h3 className="text-xl font-black text-gray-900 group-hover:text-primary transition-colors tracking-tight leading-tight line-clamp-2">
                {post.title}
              </h3>
              <p className="text-gray-500 font-medium line-clamp-2 leading-relaxed">
                {post.excerpt}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
