import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db, isAdminUser } from '../lib/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { User, Shield, Menu, X, Leaf, Search, Instagram, Facebook, Twitter, Phone, Mail, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { useSettings } from '../lib/SettingsContext';

export default function Header() {
  const { settings } = useSettings();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Use onSnapshot for real-time profile updates
        const unsubsProfile = onSnapshot(doc(db, 'users', authUser.uid), (snap) => {
          if (snap.exists()) {
            setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
          } else {
            setProfile(null);
          }
        });
        return () => unsubsProfile();
      } else {
        setProfile(null);
      }
    });
    return unsubscribe;
  }, []);

  const isAdmin = isAdminUser(user?.email, profile?.role);

  const handleLogin = () => {
    navigate('/login');
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <header className="fixed top-0 z-50 w-full bg-white border-none shadow-sm">
      {/* Top Bar */}
      <div className="bg-gray-900 py-2.5">
        <div className="container mx-auto px-4 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 border-r border-white/10 pr-6">
              <a href="#" className="text-white/60 hover:text-white transition-colors"><Instagram className="h-3.5 w-3.5" /></a>
              <a href="#" className="text-white/60 hover:text-white transition-colors"><Facebook className="h-3.5 w-3.5" /></a>
              <a href="#" className="text-white/60 hover:text-white transition-colors"><Twitter className="h-3.5 w-3.5" /></a>
            </div>
            <div className="hidden md:flex items-center gap-6">
              <a href={`tel:${settings?.supportPhone || "+6281234567890"}`} className="flex items-center gap-2 text-[10px] font-bold text-white/60 hover:text-white transition-colors tracking-widest">
                <Phone className="h-3 w-3 text-primary" /> {settings?.supportPhone || "+62 812 3456 7890"}
              </a>
              <a href={`mailto:${settings?.supportEmail || "info@baliadventours.com"}`} className="flex items-center gap-2 text-[10px] font-bold text-white/60 hover:text-white transition-colors tracking-widest">
                <Mail className="h-3 w-3 text-primary" /> {settings?.supportEmail || "info@baliadventours.com"}
              </a>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/contact" className="flex items-center gap-2 text-[10px] font-black text-white/80 hover:text-white transition-colors tracking-[0.1em]">
              <HelpCircle className="h-3 w-3" /> Support
            </Link>
            {user ? (
               <button onClick={handleLogout} className="text-[10px] font-black text-white/80 hover:text-red-400 transition-colors tracking-[0.1em] flex items-center gap-2">
                 Logout
               </button>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-[10px] font-black text-white/80 hover:text-primary transition-colors tracking-[0.1em] flex items-center gap-2">
                  <User className="h-3 w-3" /> Login / Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Nav */}
      <div className="container mx-auto flex h-20 items-center justify-between px-4 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          {settings?.logoURL ? (
            <img src={settings.logoURL} alt={settings.siteName} className="h-10 md:h-14 w-auto object-contain transition-transform group-hover:scale-105" />
          ) : (
            <>
              <div className="relative">
                <Leaf className="h-9 w-9 text-primary transition-transform group-hover:rotate-12" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl font-black text-gray-900 leading-tight tracking-tighter">
                  {settings?.siteName.split(' ')[0] || 'bali'}
                </span>
                <span className="text-xl font-black text-primary leading-tight tracking-tighter">
                  {settings?.siteName.split(' ').slice(1).join(' ') || 'adventours'}
                </span>
              </div>
            </>
          )}
        </Link>

        {/* Desktop Menu */}
        <nav className="hidden items-center gap-5 md:flex">
          <Link to="/" className="text-sm font-black text-gray-900 hover:text-primary transition-colors">Home</Link>
          <Link to="/tours" className="text-sm font-black text-gray-900 hover:text-primary transition-colors">Tours</Link>
          <Link to="/blog" className="text-sm font-black text-gray-900 hover:text-primary transition-colors">Blog</Link>
          <Link to="/about" className="text-sm font-black text-gray-900 hover:text-primary transition-colors">About</Link>
          <Link to="/contact" className="text-sm font-black text-gray-900 hover:text-primary transition-colors">Contact</Link>
        </nav>

        <div className="hidden items-center gap-6 md:flex">
          <button className="text-gray-900 hover:text-primary transition-colors">
            <Search className="h-4 w-4" />
          </button>
          
          {isAdmin && (
            <Link to="/admin" className="p-2 text-gray-900 hover:text-amber-600">
              <Shield className="h-4 w-4" />
            </Link>
          )}

          {user && (
            <Link to="/customer/dashboard" className="flex items-center gap-3 group/user">
              <div className="text-right hidden lg:block">
                <p className="text-xs font-black text-gray-900 leading-none mb-1 group-hover/user:text-primary transition-colors tracking-tight">{profile?.displayName || user?.displayName}</p>
                <p className="text-[9px] text-gray-400 font-bold leading-none tracking-widest">Dashboard</p>
              </div>
              <img src={profile?.photoURL || user?.photoURL} alt={user?.displayName} className="h-8 w-8 rounded-full border border-gray-100 object-cover" />
            </Link>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X className="h-6 w-6 text-gray-900" /> : <Menu className="h-6 w-6 text-gray-900" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="border-t border-gray-100 bg-white p-6 md:hidden shadow-2xl absolute w-full left-0">
          <nav className="flex flex-col gap-6">
            <Link to="/" className="text-xs font-black tracking-[0.3em] text-gray-900">Home</Link>
            <Link to="/tours" className="text-xs font-black tracking-[0.3em] text-gray-900">Tours</Link>
            <Link to="/blog" className="text-xs font-black tracking-[0.3em] text-gray-900">Blog</Link>
            <Link to="/about" className="text-xs font-black tracking-[0.3em] text-gray-900">About</Link>
            <Link to="/contact" className="text-xs font-black tracking-[0.3em] text-gray-900">Contact</Link>
            {isAdmin && (
              <Link to="/admin" className="text-xs font-black tracking-[0.3em] text-amber-600">Admin Panel</Link>
            )}
            {user ? (
               <Link to="/customer/dashboard" className="text-xs font-black tracking-[0.3em] text-primary">Dashboard</Link>
            ) : (
                <Link to="/login" className="text-xs font-black tracking-[0.3em] text-primary">Login / Register</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}