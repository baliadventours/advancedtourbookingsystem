import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, Link } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Briefcase, 
  Heart, 
  User, 
  LogOut, 
  Menu, 
  X,
  Plane,
  Bell,
  Search,
  ChevronRight,
  Leaf
} from 'lucide-react';
import { auth, db } from '../../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../../types';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function DashboardLayout() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        const unsubsProfile = onSnapshot(doc(db, 'users', authUser.uid), (snap) => {
          if (snap.exists()) {
            setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
          } else {
            setProfile(null);
          }
          setLoading(false);
        }, (err) => {
          console.error("Dashboard profile watch error:", err);
          setLoading(false);
        });
        return () => unsubsProfile();
      } else {
        navigate('/login', { state: { from: window.location } });
        setLoading(false);
      }
    });
    return unsubscribe;
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00A651]"></div>
      </div>
    );
  }

  const menuItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/customer/dashboard' },
    { label: 'My Bookings', icon: Briefcase, path: '/customer/bookings' },
    { label: 'Wishlist', icon: Heart, path: '/customer/wishlist' },
    { label: 'Profile', icon: User, path: '/customer/profile' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 transition-transform duration-300 lg:static lg:translate-x-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <Link to="/" className="flex items-center gap-2 mb-12 group">
            <Leaf className="h-8 w-8 text-[#00A651]" />
            <div className="flex flex-col -space-y-1">
              <span className="text-lg font-bold text-gray-900">bali</span>
              <span className="text-lg font-bold text-[#00A651]">adventours</span>
            </div>
          </Link>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-[12px] text-sm font-semibold transition-all group",
                  isActive 
                    ? "bg-emerald-50 text-[#00A651]" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="pt-6 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-3 w-full rounded-[12px] text-sm font-semibold text-red-500 hover:bg-red-50 transition-all"
            >
              <LogOut className="h-5 w-5" />
              Sign out
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-50 rounded-lg"
            >
              {isSidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Link to="/" className="text-gray-500 hover:text-gray-900">Pages</Link>
              <ChevronRight className="h-4 w-4 text-gray-300" />
              <span className="text-gray-900 font-medium">Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-4 px-4 py-2 bg-gray-50 rounded-full">
              <Search className="h-4 w-4 text-gray-400" />
              <input type="text" placeholder="Search..." className="bg-transparent border-none focus:ring-0 text-sm" />
            </div>
            
            <button className="relative p-2 text-gray-500 hover:bg-gray-50 rounded-full">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-none mb-1">{profile?.displayName || user?.displayName}</p>
                <p className="text-xs text-gray-400 leading-none">{profile?.email}</p>
              </div>
              <img 
                src={profile?.photoURL || user?.photoURL} 
                alt="Profile" 
                className="h-10 w-10 rounded-full border border-gray-100" 
              />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet context={{ user, profile }} />
        </main>
      </div>
    </div>
  );
}
