import { useState, useEffect, FormEvent, ChangeEvent, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { db, auth, isAdminUser } from '../lib/firebase';
import { 
  collection, addDoc, updateDoc, deleteDoc, 
  doc, onSnapshot, serverTimestamp, query, orderBy,
  getDoc, setDoc, getDocs, collectionGroup, where 
} from 'firebase/firestore';
import { Tour, TourPackage, PricingTier, AddOn, Coupon, PageContent, ImportantInfoSection, UrgencyPoint, Booking, Review, UserProfile, Guide, BlogPost, CommunicationSettings, BookingLog } from '../types';
import RichTextEditor from '../components/RichTextEditor';
import * as Icons from 'lucide-react';
import { sendBookingEmail } from '../lib/emailService';
import { 
  Plus, Edit2, Trash2, Save, X, Check,
  Layout, Image as ImageIcon, DollarSign, Map, 
  Info, List, CheckCircle, ChevronRight, 
  PlusCircle, MinusCircle, MessageCircle, Database,
  Upload, Loader2, BarChart3, FileText, TrendingUp, 
  MessageSquare, Monitor, Users, CreditCard, Settings, Wallet,
  Calendar as CalendarIcon, LayoutGrid, Clock, Briefcase, Star,
  Layers, Users2, ChevronDown, PieChart, Tag, MapPin, Globe,
  ShieldAlert, BookOpen, ShieldCheck, Phone, CheckCheck, Copy
} from 'lucide-react';
import { cn, formatPrice } from '../lib/utils';
import { uploadImage } from '../lib/imgbb';
import { Category, TourType, LocationMeta } from '../types';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  addDays,
  subMonths, 
  isToday,
  parseISO 
} from 'date-fns';

import GeneralSettings from '../components/Admin/GeneralSettings';
import PopupManager from '../components/Admin/PopupManager';

type MenuId = 'dashboard' | 'tours' | 'all-tours' | 'categories' | 'tour-types' | 'locations' | 'addons' | 'coupons' | 'schedule' | 'blog' | 'analytics' | 'reviews' | 'communication' | 'payments' | 'settings' | 'users' | 'payment-settings' | 'pages' | 'urgency-points' | 'timeslots' | 'bookings' | 'guides' | 'overview' | 'inventory' | 'operations' | 'content' | 'settings-group' | 'general-settings' | 'popups-manager';
type Tab = 'basic' | 'content' | 'inclusions' | 'pricing' | 'itinerary' | 'addOns' | 'faq' | 'info';

const TIME_SLOTS = Array.from({ length: 48 }, (_, i) => {
  const hours = Math.floor(i / 2);
  const minutes = i % 2 === 0 ? '00' : '30';
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
});

const COUNTRIES = [
  "Australia", "United States", "United Kingdom", "Germany", "France", "Japan", 
  "Singapore", "Malaysia", "China", "Indonesia", "Canada", "Netherlands", 
  "Russia", "South Korea", "India", "Other"
];

const MetaManager = ({ type, items }: { type: 'categories' | 'tour-types' | 'locations', items: (Category | TourType | LocationMeta)[] }) => {
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const collectionName = type === 'categories' ? 'categories' : type === 'tour-types' ? 'tourTypes' : 'locationMeta';
  const label = type === 'categories' ? 'Category' : type === 'tour-types' ? 'Tour Type' : 'Location';

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;
    try {
      await addDoc(collection(db, collectionName), { name: newValue });
      setNewValue('');
      setIsAdding(false);
      alert(`Success: ${label} created!`);
    } catch (error) {
      console.error(`Error saving ${label}`, error);
      alert(`Error: Failed to save ${label}. Check permissions.`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this ${label}?`)) {
      await deleteDoc(doc(db, collectionName, id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">{label} Management</h2>
          <p className="text-gray-500 font-medium">Add and organize your {label.toLowerCase()} descriptors.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-200"
        >
          <Plus className="h-4 w-4" /> Add New {label}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-[10px] border-2 border-primary border-dashed flex gap-4 items-center motion-safe:animate-in motion-safe:slide-in-from-top-4">
          <input 
            autoFocus
            required
            placeholder={`Enter ${label.toLowerCase()} name...`}
            value={newValue}
            onChange={e => setNewValue(e.target.value)}
            className="flex-1 rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
          />
          <button type="submit" className="bg-primary text-white px-8 py-4 rounded-[10px] font-black text-xs shadow-xl">Save {label}</button>
          <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 font-bold px-4">Cancel</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm flex items-center justify-between group hover:border-primary transition-all">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-50 rounded-[10px] flex items-center justify-center text-primary">
                {type === 'categories' ? <Tag className="h-5 w-5" /> : type === 'tour-types' ? <Globe className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
              </div>
              <span className="font-extrabold text-gray-900 tracking-tight">{item.name}</span>
            </div>
            <button 
              onClick={() => handleDelete(item.id)}
              className="p-2 text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

const CouponManager = ({ items }: { items: Coupon[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<Coupon>>({ 
    code: '', 
    discountType: 'percentage', 
    discountValue: 0, 
    minBookingValue: 0, 
    isActive: true 
  });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim()) return;
    try {
      await addDoc(collection(db, 'coupons'), { 
        ...formData,
        createdAt: serverTimestamp()
      });
      setFormData({ code: '', discountType: 'percentage', discountValue: 0, minBookingValue: 0, isActive: true });
      setIsAdding(false);
      alert("Success: Coupon created!");
    } catch (error) {
      console.error("Error saving Coupon", error);
      alert("Error: Failed to save Coupon. Check your permissions and data formats.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this Coupon?`)) {
      await deleteDoc(doc(db, 'coupons', id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Coupons</h2>
          <p className="text-gray-500 font-medium">Create and manage discount codes for your tours.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-200"
        >
          <Plus className="h-4 w-4" /> Add New Coupon
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-8 rounded-[20px] border border-gray-100 space-y-6 motion-safe:animate-in motion-safe:slide-in-from-top-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Coupon Code</label>
              <input 
                required
                placeholder="e.g. SUMMER25"
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Discount Type</label>
              <select 
                value={formData.discountType}
                onChange={e => setFormData({ ...formData, discountType: e.target.value as any })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none bg-white font-bold"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Discount Value</label>
              <input 
                required
                type="number"
                value={formData.discountValue}
                onChange={e => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Min. Booking ($)</label>
              <input 
                required
                type="number"
                value={formData.minBookingValue}
                onChange={e => setFormData({ ...formData, minBookingValue: Number(e.target.value) })}
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-4 pt-6 border-t border-gray-50">
             <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 font-bold px-4">Cancel</button>
             <button type="submit" className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all">Create Coupon</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm flex flex-col gap-4 group hover:border-primary transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-primary">
                  <Tag className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-bold text-gray-900 text-lg tracking-tight block">{item.code}</span>
                  <span className="text-sm font-semibold text-primary">
                    {item.discountType === 'percentage' ? `${item.discountValue}% Off` : `$${item.discountValue} Off`}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            <div className="pt-4 border-t border-gray-50">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Min. Spend: ${item.minBookingValue}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PageManager = () => {
    const [pages, setPages] = useState<PageContent[]>([]);
    const [editingPage, setEditingPage] = useState<Partial<PageContent> | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(collection(db, 'pages'), (snapshot) => {
            setPages(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as PageContent)));
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const handleSave = async (e: FormEvent) => {
        e.preventDefault();
        if (!editingPage?.title || !editingPage?.slug) return;

        try {
            const pageData = {
                title: editingPage.title,
                slug: editingPage.slug.toLowerCase().replace(/ /g, '-'),
                content: editingPage.content || '',
                updatedAt: serverTimestamp()
            };

            if (editingPage.id) {
                await updateDoc(doc(db, 'pages', editingPage.id), pageData);
            } else {
                await addDoc(collection(db, 'pages'), pageData);
            }
            setEditingPage(null);
            alert("Page saved successfully!");
        } catch (err) {
            console.error(err);
            alert("Failed to save page.");
        }
    };

    if (loading) return (
        <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>
    );

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Static Pages</h2>
                    <p className="text-gray-500 font-medium">Manage your Terms and Conditions, Privacy Policy, and other content pages.</p>
                </div>
                <button 
                  onClick={() => setEditingPage({ title: '', slug: '', content: '' })}
                  className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-200"
                >
                  <Plus className="h-4 w-4" /> Create New Page
                </button>
            </div>

            {editingPage && (
                <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      className="bg-white rounded-[20px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                    >
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">
                                {editingPage.id ? 'Edit Page' : 'New Page'}
                            </h3>
                            <button onClick={() => setEditingPage(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="h-6 w-6 text-gray-400" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500">Page Title</label>
                                    <input 
                                      required
                                      value={editingPage.title}
                                      onChange={e => setEditingPage({ ...editingPage, title: e.target.value })}
                                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none font-bold"
                                      placeholder="e.g. Terms and Conditions"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-semibold text-gray-500">URL Slug</label>
                                    <input 
                                      required
                                      value={editingPage.slug}
                                      onChange={e => setEditingPage({ ...editingPage, slug: e.target.value.toLowerCase().replace(/ /g, '-') })}
                                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none font-bold text-gray-500"
                                      placeholder="e.g. terms-and-conditions"
                                      disabled={!!editingPage.id}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold text-gray-500">Page Content (HTML/Markdown supported)</label>
                                <textarea 
                                  required
                                  rows={15}
                                  value={editingPage.content}
                                  onChange={e => setEditingPage({ ...editingPage, content: e.target.value })}
                                  className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none font-medium min-h-[300px]"
                                  placeholder="Paste your page content here..."
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button type="button" onClick={() => setEditingPage(null)} className="px-8 py-4 font-bold text-gray-400">Cancel</button>
                                <button type="submit" className="bg-primary text-white px-12 py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all">
                                    {editingPage.id ? 'Save Changes' : 'Create Page'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pages.map(page => (
                    <div key={page.id} className="bg-white p-8 rounded-[24px] border border-gray-100 shadow-sm transition-all hover:border-primary group hover:shadow-md">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
                                <FileText className="h-7 w-7" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingPage(page)} className="p-2 text-gray-400 hover:text-primary transition-colors hover:bg-gray-50 rounded-lg"><Edit2 className="h-5 w-5" /></button>
                                <button 
                                  onClick={async () => {
                                    if (confirm("Delete this page?")) await deleteDoc(doc(db, 'pages', page.id));
                                  }}
                                  className="p-2 text-gray-400 hover:text-red-600 transition-colors hover:bg-red-50 rounded-lg"
                                >
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 tracking-tight mb-2 group-hover:text-primary transition-colors">{page.title}</h3>
                        <p className="text-sm font-semibold text-primary tracking-tight mb-4">/{page.slug}</p>
                        <p className="text-xs text-gray-500 line-clamp-3 font-medium leading-relaxed">
                            {(page.content || '').replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
};

const BookingTimeManager = () => {
    const [slots, setSlots] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'settings', 'timeslots'), (snap) => {
            if (snap.exists()) {
                setSlots(snap.data().slots || []);
            }
            setLoading(false);
        });
        return unsub;
    }, []);

    const toggleSlot = async (time: string) => {
        const newSlots = slots.includes(time) 
            ? slots.filter(s => s !== time) 
            : [...slots, time].sort();
        
        try {
            await setDoc(doc(db, 'settings', 'timeslots'), { slots: newSlots });
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="flex justify-center p-20"><Loader2 className="animate-spin text-primary" /></div>;

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Global Time Slots</h2>
                <p className="text-gray-500 font-medium">Configure the default available 30-minute intervals for your tours.</p>
            </div>

            <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-sm space-y-8">
                <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <div className="h-10 w-10 bg-primary text-white rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-gray-900">Default Availability</p>
                        <p className="text-xs text-gray-500 font-medium">Selected slots will be available for customers at checkout by default.</p>
                    </div>
                </div>

                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {TIME_SLOTS.map(time => {
                        const isSelected = slots.includes(time);
                        return (
                            <button
                                key={time}
                                onClick={() => toggleSlot(time)}
                                className={cn(
                                    "py-3 rounded-xl text-xs font-bold transition-all border-2",
                                    isSelected 
                                        ? "bg-primary text-white border-primary shadow-lg shadow-emerald-100" 
                                        : "bg-white text-gray-400 border-gray-50 hover:border-emerald-200"
                                )}
                            >
                                {time}
                            </button>
                        );
                    })}
                </div>

                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        {slots.length} Active Slots Selected
                    </p>
                    <button 
                        onClick={async () => {
                            if(confirm("Clear all slots?")) await setDoc(doc(db, 'settings', 'timeslots'), { slots: [] });
                        }}
                        className="text-xs font-bold text-red-500 hover:underline"
                    >
                        Clear All
                    </button>
                </div>
            </div>
        </div>
    );
};

  const AnalyticsManager = ({ bookings, tours }: { bookings: Booking[], tours: Tour[] }) => {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Performance Analytics</h2>
          <p className="text-gray-500 font-medium">Deep dive into your business growth and tour performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Total Revenue</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">
                ${bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0).toLocaleString()}
              </h3>
              <div className="mt-4 flex items-center gap-2 text-emerald-600 font-bold text-xs">
                 <Icons.TrendingUp className="h-4 w-4" /> +12.5% from last month
              </div>
           </div>
           <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Average Booking Value</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">
                ${bookings.length > 0 ? Math.round(bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0) / bookings.length) : 0}
              </h3>
              <div className="mt-4 flex items-center gap-2 text-blue-600 font-bold text-xs">
                 <Icons.Users className="h-4 w-4" /> Based on {bookings.length} bookings
              </div>
           </div>
           <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-sm">
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Conversion Rate</p>
              <h3 className="text-4xl font-black text-gray-900 tracking-tighter">3.2%</h3>
              <div className="mt-4 flex items-center gap-2 text-amber-600 font-bold text-xs">
                 <Icons.Monitor className="h-4 w-4" /> 2,450 unique visitors
              </div>
           </div>
        </div>

        <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-sm">
           <h3 className="font-black text-gray-900 mb-8">Tour Popularity</h3>
           <div className="space-y-6">
              {tours.slice(0, 5).map((tour, i) => {
                const tourBookings = bookings.filter(b => b.tourId === tour.id).length;
                const percentage = bookings.length > 0 ? (tourBookings / bookings.length) * 100 : 0;
                return (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="font-bold text-sm text-gray-900">{tour.title}</span>
                      <span className="text-xs font-black text-gray-500">{tourBookings} Bookings</span>
                    </div>
                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${Math.max(percentage * 5, 2)}%` }} />
                    </div>
                  </div>
                );
              })}
           </div>
        </div>
      </div>
    );
  };

  const ReviewManager = () => {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const q = query(collectionGroup(db, 'reviews'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          setReviews(snapshot.docs.map(doc => ({ 
            id: doc.id, 
            refPath: doc.ref.path, // Store the path for easier matching
            ...doc.data() 
          } as any)));
          setLoading(false);
        },
        (error) => {
          console.error("Reviews snapshot error:", error);
          setLoading(false);
        }
      );
      return unsubscribe;
    }, []);

    const handleDelete = async (review: any) => {
      if (confirm(`Delete review from ${review.userName}?`)) {
        try {
          const docRef = doc(db, review.refPath);
          const tourId = docRef.parent.parent?.id;
          
          await deleteDoc(docRef);
          
          // Recalculate tour average rating
          if (tourId) {
            const reviewsSnap = await getDocs(query(collection(db, 'tours', tourId, 'reviews'), where('status', '==', 'approved')));
            const approvedReviews = reviewsSnap.docs.map(d => d.data() as Review);
            
            const count = approvedReviews.length;
            const avg = count > 0 
              ? parseFloat((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
              : 0;
              
            await updateDoc(doc(db, 'tours', tourId), {
              rating: avg,
              reviewsCount: count
            });
          }
          alert("Review deleted.");
        } catch (error) {
          console.error("Error deleting", error);
        }
      }
    };

    const handleModerate = async (review: any, status: 'approved' | 'rejected') => {
      try {
        const docRef = doc(db, review.refPath);
        await updateDoc(docRef, { status });
        
        // Recalculate tour average rating
        const tourId = docRef.parent.parent?.id;
        if (tourId) {
          const reviewsSnap = await getDocs(query(collection(db, 'tours', tourId, 'reviews'), where('status', '==', 'approved')));
          const approvedReviews = reviewsSnap.docs.map(d => d.data() as Review);
          
          const count = approvedReviews.length;
          const avg = count > 0 
            ? parseFloat((approvedReviews.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1))
            : 0;
            
          await updateDoc(doc(db, 'tours', tourId), {
            rating: avg,
            reviewsCount: count
          });
        }
        
        alert(`Review ${status}!`);
      } catch (error) {
        console.error("Error moderating", error);
      }
    };

    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Guest Reviews</h2>
            <p className="text-gray-500 font-medium text-sm">Monitor and moderate all client feedback across all tours.</p>
          </div>
          <div className="flex items-center gap-4 bg-emerald-50 px-6 py-3 rounded-xl border border-emerald-100">
             <div className="flex flex-col items-center">
                <span className="text-xl font-black text-primary">{reviews.filter(r => (r as any).status === 'approved').length}</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Approved</span>
             </div>
             <div className="w-px h-6 bg-emerald-100" />
             <div className="flex flex-col items-center">
                <span className="text-xl font-black text-amber-500">{reviews.filter(r => !(r as any).status || (r as any).status === 'pending').length}</span>
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Pending</span>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {reviews.map(review => {
            const status = (review as any).status || 'pending';
            return (
              <div key={review.id} className={cn(
                "bg-white p-8 rounded-[20px] border shadow-sm flex flex-col md:flex-row gap-8 group transition-all",
                status === 'approved' ? "border-emerald-100" : status === 'rejected' ? "border-red-100 opacity-60" : "border-amber-200 bg-amber-50/10"
              )}>
                <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center shrink-0 border border-gray-100 overflow-hidden">
                  {review.userPhoto ? (
                    <img src={review.userPhoto} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <span className="text-2xl font-black text-primary">{review.userName.charAt(0)}</span>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                           {review.userName}
                           {review.nationality && (
                             <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                               <Icons.Globe className="h-2.5 w-2.5" /> {review.nationality}
                             </span>
                           )}
                        </h3>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                          status === 'approved' ? "bg-emerald-100 text-emerald-700" : 
                          status === 'rejected' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {status}
                        </span>
                      </div>
                      <p className="text-xs font-bold text-gray-400 flex items-center gap-2 mt-0.5">
                         <Icons.Calendar className="h-3 w-3" /> Traveled on {review.tourDate || 'Unknown Date'}
                         {review.tourTitle && <span className="text-primary ml-2">• Experience: {review.tourTitle}</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Icons.Star key={s} className={cn("h-4 w-4", review.rating >= s ? "fill-current" : "text-gray-200")} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                     {review.title && <h4 className="font-black text-gray-900 border-l-4 border-primary pl-3">{review.title}</h4>}
                     <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>
                  </div>
                  
                  {((review as any).images && (review as any).images.length > 0) ? (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {(review as any).images.map((img: string, idx: number) => (
                        <div key={idx} className="h-16 w-16 rounded-lg overflow-hidden border border-gray-100 shadow-sm cursor-zoom-in" onClick={() => window.open(img, '_blank')}>
                           <img src={img} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      ))}
                    </div>
                  ) : review.image && (
                    <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 h-24 w-40 shadow-sm cursor-zoom-in" onClick={() => window.open(review.image, '_blank')}>
                       <img src={review.image} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  
                  <div className="pt-6 border-t border-gray-50 flex items-center justify-end gap-3">
                    {status !== 'approved' && (
                      <button 
                        onClick={() => handleModerate(review, 'approved')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button 
                        onClick={() => handleModerate(review, 'rejected')}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-red-50 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
                    )}
                    <button 
                      onClick={() => handleDelete(review)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border-2 border-gray-50 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all"
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
          {reviews.length === 0 && (
            <div className="p-20 text-center text-gray-400 bg-white rounded-[20px] border border-gray-100 border-dashed">
               No reviews collected yet.
            </div>
          )}
        </div>
      </div>
    );
  };

  const UserManager = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
        setLoading(false);
      });
      return unsubscribe;
    }, []);

    const toggleAdmin = async (user: UserProfile) => {
      const newRole = user.role === 'admin' ? 'customer' : 'admin';
      if (confirm(`Change ${user.displayName} to ${newRole}?`)) {
        try {
          await updateDoc(doc(db, 'users', user.uid), { role: newRole });
        } catch (error) {
          console.error("Error updating role", error);
        }
      }
    };

    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Active Users</h2>
          <p className="text-gray-500 font-medium">Manage permissions and view client profiles.</p>
        </div>

        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Permission</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(u => (
                <tr key={u.uid} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                       <img src={u.photoURL} className="h-10 w-10 rounded-full border border-gray-100" referrerPolicy="no-referrer" />
                       <span className="text-sm font-black text-gray-900">{u.displayName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-500">{u.email}</td>
                  <td className="px-6 py-4">
                     <span className={cn(
                       "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                       u.role === 'admin' ? "bg-primary text-white" : "bg-gray-100 text-gray-500"
                     )}>
                       {u.role}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-gray-400">
                     {u.createdAt?.toDate().toLocaleDateString() || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button onClick={() => toggleAdmin(u)} className="p-2 text-primary hover:bg-emerald-50 rounded-lg transition-colors">
                        <Icons.ShieldAlert className="h-4 w-4" />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

const PaymentManager = () => {
  const [settings, setSettings] = useState({
    paypalClientId: '',
    isPaypalEnabled: false,
    creditCardEnabled: false,
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    swiftCode: '',
    bankInstructions: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'payment');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as any);
        }
      } catch (err) {
        console.error("Error fetching settings", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'payment'), settings);
      alert("Success: Payment configuration saved!");
    } catch (err) {
      console.error(err);
      alert("Error: Failed to save configuration. Check permissions.");
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 space-y-4">
      <Loader2 className="h-8 w-8 text-primary animate-spin" />
      <p className="text-gray-400 font-bold text-xs tracking-widest uppercase">Loading encrypted settings...</p>
    </div>
  );

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Payment Gateways</h2>
        <p className="text-gray-500 font-medium">Configure secure customer checkout and automated payouts.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white p-10 rounded-[20px] border border-gray-100 shadow-sm space-y-10">
            <div className="space-y-8">
              {/* PayPal Header Toggle */}
              <div className="flex items-center justify-between p-6 bg-emerald-50/30 rounded-2xl border border-emerald-100">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-gray-900">PayPal Express Checkout</h4>
                    <p className="text-xs text-emerald-600 font-bold mt-0.5">Primary Gateway</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer group">
                  <input 
                    type="checkbox" 
                    checked={settings.isPaypalEnabled}
                    onChange={e => setSettings({...settings, isPaypalEnabled: e.target.checked})}
                    className="sr-only peer" 
                  />
                  <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              {/* Client ID Section */}
              <div className={cn("space-y-4 transition-all duration-500", !settings.isPaypalEnabled && "opacity-40 grayscale pointer-events-none")}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">PayPal Client ID</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CreditCard className="h-4 w-4 text-gray-300 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input 
                      type="text"
                      placeholder="Enter your Live Client ID"
                      value={settings.paypalClientId}
                      onChange={e => setSettings({...settings, paypalClientId: e.target.value})}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 pl-12 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono text-sm tracking-tight"
                    />
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl flex gap-3 text-gray-400">
                  <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
                  <p className="text-[10px] leading-relaxed font-medium capitalize">
                    Retrieve your <span className="text-gray-900 font-bold">Standard Client ID</span> from the <a href="https://developer.paypal.com/dashboard/applications" target="_blank" className="text-primary underline font-black">PayPal Apps & Credentials Dashboard</a>. 
                    Recommended for handling global currencies and automatic fraud checks.
                  </p>
                </div>
              </div>

              {/* Advanced CC Toggle */}
              <div className={cn("pt-6 border-t border-gray-50 transition-all duration-500", !settings.isPaypalEnabled && "opacity-0 invisible h-0 overflow-hidden")}>
                <label className="flex items-center gap-4 cursor-pointer group p-4 hover:bg-gray-50 rounded-xl transition-all">
                  <div className={cn(
                    "h-6 w-6 rounded border-2 flex items-center justify-center transition-all",
                    settings.creditCardEnabled ? "bg-primary border-primary text-white" : "border-gray-200"
                  )}>
                    {settings.creditCardEnabled && <Check className="h-4 w-4" />}
                  </div>
                  <input 
                    type="checkbox"
                    checked={settings.creditCardEnabled}
                    onChange={e => setSettings({...settings, creditCardEnabled: e.target.checked})}
                    className="hidden"
                  />
                  <div>
                    <span className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">Direct Card Entry</span>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">Allow customers to pay via card without leaving checkout</p>
                  </div>
                </label>
              </div>

              {/* Bank Transfer Settings */}
              <div className="pt-8 border-t border-gray-50 space-y-6">
                <div>
                  <h4 className="text-sm font-black text-gray-900 flex items-center gap-2">
                    <Database className="h-4 w-4 text-secondary" /> Manual Bank Transfer Details
                  </h4>
                  <p className="text-[10px] text-gray-400 font-medium">These details will be shown to customers who choose manual bank transfer.</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Bank Name</label>
                    <input 
                      type="text"
                      placeholder="e.g. Bank Central Asia (BCA)"
                      value={settings.bankName || ''}
                      onChange={e => setSettings({...settings, bankName: e.target.value})}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Account Number</label>
                    <input 
                      type="text"
                      placeholder="e.g. 1234567890"
                      value={settings.accountNumber || ''}
                      onChange={e => setSettings({...settings, accountNumber: e.target.value})}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">SWIFT Code</label>
                    <input 
                      type="text"
                      placeholder="e.g. BCACIDJA"
                      value={settings.swiftCode || ''}
                      onChange={e => setSettings({...settings, swiftCode: e.target.value})}
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Account Holder Name</label>
                  <input 
                    type="text"
                    placeholder="e.g. DayTours Local"
                    value={settings.accountHolder || ''}
                    onChange={e => setSettings({...settings, accountHolder: e.target.value})}
                    className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 tracking-widest uppercase">Payment Instructions</label>
                  <textarea 
                    rows={3}
                    placeholder="e.g. Please include your Booking ID as the reference number."
                    value={settings.bankInstructions || ''}
                    onChange={e => setSettings({...settings, bankInstructions: e.target.value})}
                    className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold text-sm"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-primary text-white py-5 rounded-2xl font-bold text-sm tracking-wide shadow-2xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95"
            >
              <Save className="h-4 w-4" /> Save Global Configuration
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="bg-gray-900 rounded-[20px] p-8 text-white relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 h-40 w-40 bg-white/5 rounded-full blur-3xl" />
            <h4 className="text-xl font-bold mb-4 flex items-center gap-2 relative z-10">
              <Star className="h-5 w-5 text-amber-400 fill-current" /> Security Note
            </h4>
            <p className="text-sm text-gray-400 leading-relaxed font-medium relative z-10">
              Clients never store sensitive payment data. We strictly use modern redirect or component-based methods ensuring 
              <span className="text-white font-bold ml-1">PCI-DSS compliance</span> at all times.
            </p>
          </div>

          <div className="rounded-[20px] border border-gray-100 p-8 space-y-4">
            <h4 className="text-xs font-black text-gray-900 tracking-widest uppercase">Transaction Preview</h4>
            <div className="p-4 rounded-xl bg-gray-50 space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-gray-400">
                <span>Fee (2.9% + $0.30)</span>
                <span>-$3.20</span>
              </div>
              <div className="flex justify-between text-xs font-black text-emerald-600 border-t border-gray-100 pt-2">
                <span>Next Payout Deposit</span>
                <span>$96.80</span>
              </div>
            </div>
            <p className="text-[9px] text-gray-400">Estimated for a $100.00 booking through PayPal Express.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const UrgencyPointManager = ({ items }: { items: UrgencyPoint[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<UrgencyPoint>>({ 
    title: '', 
    description: '',
    icon: 'ShieldCheck'
  });

  const icons = [
    { name: 'ShieldCheck', icon: ShieldCheck },
    { name: 'Calendar', icon: CalendarIcon },
    { name: 'Info', icon: Info },
    { name: 'CreditCard', icon: CreditCard },
    { name: 'Clock', icon: Clock },
    { name: 'MapPin', icon: MapPin },
    { name: 'CheckCircle', icon: CheckCircle },
    { name: 'MessageSquare', icon: MessageSquare }
  ];

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) return;
    try {
      await addDoc(collection(db, 'urgencyPoints'), formData);
      setFormData({ title: '', description: '', icon: 'ShieldCheck' });
      setIsAdding(false);
      alert("Success: Urgency Point created!");
    } catch (error) {
      console.error("Error saving Urgency Point", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this Urgency Point?`)) {
      await deleteDoc(doc(db, 'urgencyPoints', id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Urgency Points</h2>
          <p className="text-gray-500 font-medium text-sm">Key trust features and urgency highlights shown on tour pages.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm flex items-center gap-2 shadow-lg shadow-emerald-200 active:scale-95 transition-all"
        >
          <Plus className="h-4 w-4" /> Add New Point
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-8 rounded-[20px] border border-gray-100 space-y-6 motion-safe:animate-in motion-safe:slide-in-from-top-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Feature Title</label>
              <input 
                required 
                value={formData.title} 
                onChange={e => setFormData({ ...formData, title: e.target.value })} 
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold" 
                placeholder="e.g. Free Cancellation"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Short Description</label>
              <input 
                value={formData.description} 
                onChange={e => setFormData({ ...formData, description: e.target.value })} 
                className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold" 
                placeholder="e.g. Up to 24 hours before"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500">Visual Icon</label>
              <div className="flex flex-wrap gap-2">
                {icons.map(ic => (
                  <button 
                    key={ic.name}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: ic.name })}
                    className={cn(
                      "p-3 rounded-xl border-2 transition-all",
                      formData.icon === ic.name ? "bg-primary text-white border-primary shadow-lg shadow-emerald-100" : "bg-white text-gray-400 border-gray-50 hover:border-emerald-200"
                    )}
                  >
                    <ic.icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 font-bold text-gray-400 text-sm">Cancel</button>
            <button type="submit" className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-sm tracking-wide shadow-xl active:scale-95 transition-all">Save Urgency Point</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => {
          const IconComp = icons.find(ic => ic.name === item.icon)?.icon || ShieldCheck;
          return (
            <div key={item.id} className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm flex items-start justify-between group hover:border-primary transition-all">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-primary shrink-0 transition-transform group-hover:scale-110">
                  <IconComp className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 tracking-tight text-lg mb-1 truncate">{item.title}</h3>
                  <p className="text-gray-500 text-xs font-medium leading-relaxed">{item.description}</p>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(item.id)} 
                className="p-2 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AddOnManager = ({ items }: { items: AddOn[] }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Partial<AddOn>>({ name: '', description: '', price: 0, unit: 'per person' });

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) return;
    try {
      await addDoc(collection(db, 'globalAddOns'), { ...formData, price: Number(formData.price) });
      setFormData({ name: '', description: '', price: 0, unit: 'per person' });
      setIsAdding(false);
      alert("Success: Add-on created!");
    } catch (error) {
      console.error("Error saving Add-on", error);
      alert("Error: Failed to save Add-on. Check permissions.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm(`Delete this Add-on?`)) {
      await deleteDoc(doc(db, 'globalAddOns', id));
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Global Add-ons</h2>
          <p className="text-gray-500 font-medium">Create add-ons once and pick them for any tour.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-primary text-white px-6 py-3 rounded-[10px] font-bold text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-emerald-200"
        >
          <Plus className="h-4 w-4" /> Add New Add-on
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleCreate} className="bg-white p-8 rounded-[10px] border-2 border-primary border-dashed space-y-4 motion-safe:animate-in motion-safe:slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-semibold text-gray-500">Add-on Name</label>
              <input 
                required
                placeholder="e.g. Airport Transfer"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400">Price ($)</label>
              <input 
                required
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400">Unit</label>
              <select 
                value={formData.unit}
                onChange={e => setFormData({ ...formData, unit: e.target.value as any })}
                className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none bg-white font-bold"
              >
                <option value="per person">Per Person</option>
                <option value="per booking">Per Booking</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400">Description</label>
            <textarea 
              placeholder="Detailed description of the service..."
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
             <button type="button" onClick={() => setIsAdding(false)} className="text-gray-400 font-bold px-4">Cancel</button>
             <button type="submit" className="bg-primary text-white px-10 py-4 rounded-[10px] font-bold text-sm tracking-wide shadow-xl">Create Add-on</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm flex flex-col gap-4 group hover:border-primary transition-all">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-50 rounded-[10px] flex items-center justify-center text-primary">
                  <PlusCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-extrabold text-gray-900 tracking-tight block">{item.name}</span>
                  <span className="text-[10px] font-black text-primary">{formatPrice(item.price)} / {item.unit}</span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="p-2 text-gray-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            </div>
            {item.description && (
              <p className="text-xs text-gray-500 font-medium border-t border-gray-50 pt-3">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const CommunicationManager = () => {
  const [settings, setSettings] = useState<CommunicationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [testEmailLoading, setTestEmailLoading] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState<{success: boolean, message: string} | null>(null);

  const handleSendTestEmail = async () => {
    if (!settings) return;
    setTestEmailLoading(true);
    setTestEmailStatus(null);
    try {
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: settings.adminNotificationEmail,
          subject: 'Test Email - DayTours',
          html: `<div style="font-family: sans-serif; padding: 20px; border: 2px solid #0d9488; border-radius: 10px;">
            <h2 style="color: #0d9488;">Email Configuration Test</h2>
            <p>Success! This is a test email from your <strong>DayTours</strong> website.</p>
            <p><strong>Provider used:</strong> ${settings.emailProvider.toUpperCase()}</p>
            <p>If you're seeing this, your transactional emails are now working correctly.</p>
            <hr />
            <small>Sent at: ${new Date().toLocaleString()}</small>
          </div>`,
          type: 'test'
        })
      });

      let data;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = { success: false, error: text || 'Server returned an invalid response (500).' };
      }

      if (response.ok && data.success) {
        setTestEmailStatus({ success: true, message: 'Test email sent successfully! Please check your inbox (' + settings.adminNotificationEmail + ').' });
      } else {
        // If it's a known server error string masquerading as HTML
        const displayError = data.error?.includes('A server error occurred') 
          ? 'The Vercel Server crashed while trying to load the email handler. This usually means a missing environment variable or configuration file.'
          : (data.error || 'Failed to send test email.');
          
        setTestEmailStatus({ success: false, message: displayError });
      }
    } catch (error: any) {
      setTestEmailStatus({ success: false, message: error.message || 'An unexpected error occurred.' });
    } finally {
      setTestEmailLoading(false);
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'communicationSettings', 'global');
      const snap = await getDoc(docRef);
      
      const defaults: CommunicationSettings = {
        id: 'settings',
        emailProvider: 'resend',
        senderEmail: 'onboarding@resend.dev',
        senderName: 'Travel Platform',
        adminNotificationEmail: import.meta.env.VITE_ADMIN_EMAIL || 'admin@example.com',
        templates: {
          booking_pending: { subject: 'Booking Pending - {{tourTitle}}', body: '<h1>Hi {{customerName}}</h1><p>Your booking for {{tourTitle}} is pending...</p>', enabled: true },
          booking_confirmed: { subject: 'Booking Confirmed - {{tourTitle}}', body: '<h1>Hi {{customerName}}</h1><p>Your booking for {{tourTitle}} is confirmed!</p>', enabled: true },
          booking_cancelled: { subject: 'Booking Cancelled - {{tourTitle}}', body: '<h1>Hi {{customerName}}</h1><p>Your booking for {{tourTitle}} has been cancelled.</p>', enabled: true },
          booking_changed: { subject: 'Booking Updated - {{tourTitle}}', body: '<h1>Hi {{customerName}}</h1><p>Your booking for {{tourTitle}} has been updated.</p>', enabled: true },
          booking_status_updated: { subject: 'Status Update - {{tourTitle}}', body: '<h1>Hi {{customerName}}</h1><p>The status of your booking {{bookingId}} is now {{status}}.</p>', enabled: true },
          payment_received: { subject: 'Payment Received - {{tourTitle}}', body: '<h1>Hi {{customerName}}</h1><p>We have received your payment of {{totalAmount}}.</p>', enabled: true },
          payment_failed: { subject: 'Payment Failed - {{tourTitle}}', body: '<h1>Hi {{customerName}}</h1><p>Unfortunately, your payment for {{tourTitle}} failed.</p>', enabled: true },
          review_request: { subject: 'Share your experience!', body: '<h1>Hi {{customerName}}</h1><p>How was your trip to {{tourTitle}}?</p>', enabled: true },
          guide_assigned: { subject: 'Guide Assigned - {{tourTitle}}', body: '<h1>Hi {{customerName}}</h1><p>Your guide for the tour is ready.</p>', enabled: true },
          admin_new_booking: { subject: 'NEW BOOKING: {{customerName}}', body: '<h1>New Booking!</h1><p>{{customerName}} booked {{tourTitle}} on {{date}}.</p>', enabled: true },
        }
      };

      if (snap.exists()) {
        const data = snap.data() as any;
        // Merge templates specifically to ensure new ones are added
        const mergedTemplates = { ...defaults.templates, ...(data.templates || {}) };
        setSettings({ ...defaults, ...data, templates: mergedTemplates });
      } else {
        await setDoc(docRef, defaults);
        setSettings(defaults);
      }
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      await setDoc(doc(db, 'communicationSettings', 'global'), settings);
      alert("Settings saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;
  if (!settings) return null;

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-3xl font-black text-gray-900 tracking-tight">Communication Settings</h2>
        <p className="text-gray-500 font-medium italic">Configure how you communicate with your guests via email.</p>
      </div>

      {/* Email Testing Tool (Fixed Position) */}
      <div className="bg-emerald-600 rounded-[20px] p-8 shadow-2xl shadow-emerald-600/20 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
          <Icons.Zap className="h-48 w-48 rotate-12" />
        </div>
        
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 max-w-xl">
             <div className="flex items-center gap-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">Diagnostic tool</span>
                <span className="h-1.5 w-1.5 bg-emerald-300 rounded-full animate-pulse"></span>
             </div>
             <h3 className="text-3xl font-black tracking-tight">Email Connection Tester</h3>
             <p className="text-emerald-50 text-sm font-medium">Verify your Gmail or SMTP settings instantly without making a real booking. We will send a test email to <strong>{settings.adminNotificationEmail}</strong>.</p>
          </div>
          <button 
            type="button" 
            onClick={handleSendTestEmail}
            disabled={testEmailLoading || settings.emailProvider === 'none'}
            className="bg-white text-emerald-600 px-10 py-5 rounded-2xl font-black text-sm tracking-widest uppercase shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 shrink-0"
          >
            {testEmailLoading ? <Icons.Loader2 className="h-5 w-5 animate-spin" /> : <Icons.Send className="h-5 w-5" />}
            {testEmailLoading ? 'Running test...' : 'Send Test mail'}
          </button>
        </div>

        {testEmailStatus && (
           <div className={`mt-8 p-6 rounded-2xl border-2 animate-in fade-in zoom-in duration-300 ${testEmailStatus.success ? 'bg-white/10 border-white/20 text-white' : 'bg-red-500/20 border-red-500/30 text-white'}`}>
             <div className="flex items-start gap-4">
                {testEmailStatus.success ? <Icons.CheckCircle2 className="h-8 w-8 text-white shrink-0" /> : <Icons.AlertCircle className="h-8 w-8 text-white shrink-0" />}
                <div className="space-y-1">
                   <p className="text-lg font-black tracking-tight">{testEmailStatus.success ? 'System Online!' : 'Connection Refused'}</p>
                   <p className="text-sm font-medium opacity-90">{testEmailStatus.message}</p>
                   {!testEmailStatus.success && (
                      <div className="mt-4 bg-black/20 p-4 rounded-xl text-xs font-mono leading-relaxed border border-white/10">
                         <span className="font-black text-white underline mb-1 block">QUICK FIX FOR GMAIL:</span>
                         1. Ensure <a href="https://myaccount.google.com/security" target="_blank" className="underline font-bold">2-Step Verification</a> is ON.<br/>
                         2. Generate a 16-character <strong>App Password</strong>.<br/>
                         3. Use that code instead of your regular password.
                      </div>
                   )}
                </div>
             </div>
           </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-12">
        <section className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-sm space-y-8">
           <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-primary">
                 <Icons.Mail className="h-5 w-5" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Email Provider</h3>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Provider</label>
                 <select 
                   value={settings.emailProvider}
                   onChange={e => setSettings({ ...settings, emailProvider: e.target.value as any })}
                   className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold appearance-none bg-white"
                 >
                   <option value="none">Disabled (No Emails)</option>
                   <option value="resend">Resend (Recommended)</option>
                   <option value="sendgrid">SendGrid</option>
                    <option value="brevo">Brevo (Sendinblue)</option>
                    <option value="gmail">Gmail SMTP (Direct Method)</option>
                 </select>
              </div>

              {settings.emailProvider === 'gmail' && (
                <>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Gmail Address</label>
                    <input 
                      type="email"
                      value={settings.gmailUser || ''}
                      onChange={e => setSettings({ ...settings, gmailUser: e.target.value })}
                      placeholder="baliadventours@gmail.com"
                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2 lg:col-span-1">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Google App Password</label>
                    <input 
                      type="password"
                      value={settings.gmailAppPassword || ''}
                      onChange={e => setSettings({ ...settings, gmailAppPassword: e.target.value })}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                    />
                  </div>
                  <div className="md:col-span-2 lg:col-span-3 bg-secondary/5 p-6 rounded-xl border border-secondary/20">
                    <div className="flex gap-4">
                      <Icons.Info className="h-6 w-6 text-secondary shrink-0" />
                      <div className="space-y-2">
                         <h4 className="font-bold text-gray-900 text-sm italic underline">How to get a Google App Password?</h4>
                         <ul className="text-xs text-gray-600 space-y-1 list-disc pl-4 font-medium leading-relaxed">
                            <li>Turn on <strong>2-Step Verification</strong> in your Google Account settings.</li>
                            <li>Search for "App Passwords" in your account search bar.</li>
                            <li>Select "Mail" and "Other (Custom name)" and type "Business Website".</li>
                            <li>Copy the 16-character code and paste it here.</li>
                         </ul>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {settings.emailProvider !== 'none' && settings.emailProvider !== 'gmail' && (
                <div className="space-y-2 lg:col-span-2">
                   <div className="flex justify-between items-center">
                     <label className="text-xs font-black text-gray-400 uppercase tracking-widest">API Key</label>
                     <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Env Vars Supported</span>
                   </div>
                   <input 
                     type="password"
                     value={settings.emailApiKey || ''}
                     onChange={e => setSettings({ ...settings, emailApiKey: e.target.value })}
                     placeholder={`Enter your ${settings.emailProvider} API key or use BREVO_API_KEY env var`}
                     className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-mono"
                   />
                   <p className="text-[10px] text-gray-400 font-medium">Use the "Settings" menu to add your API key securely as an environment variable.</p>
                </div>
              )}

              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sender Email</label>
                 <input 
                   required
                   type="email"
                   value={settings.senderEmail}
                   onChange={e => setSettings({ ...settings, senderEmail: e.target.value })}
                   className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Sender Name</label>
                 <input 
                   required
                   value={settings.senderName}
                   onChange={e => setSettings({ ...settings, senderName: e.target.value })}
                   className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                 />
              </div>

              <div className="space-y-2">
                 <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Admin Notification Email</label>
                 <input 
                   required
                   type="email"
                   value={settings.adminNotificationEmail}
                   onChange={e => setSettings({ ...settings, adminNotificationEmail: e.target.value })}
                   className="w-full rounded-[12px] border-2 border-gray-50 bg-gray-50/50 p-4 focus:border-primary focus:bg-white focus:outline-none transition-all font-bold"
                 />
              </div>
           </div>
        </section>

        <section className="space-y-6">
           <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Email Templates</h3>
              <p className="text-xs font-bold text-gray-400">Placeholders: &#123;&#123;customerName&#125;&#125;, &#123;&#123;tourTitle&#125;&#125;, &#123;&#123;bookingId&#125;&#125;, &#123;&#123;totalAmount&#125;&#125;</p>
           </div>

           <div className="grid grid-cols-1 gap-6">
              {Object.keys(settings.templates).map((key) => {
                 const template = settings.templates[key as keyof CommunicationSettings['templates']];
                 return (
                   <div key={key} className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
                      <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
                         <span className="text-xs font-black text-gray-900 uppercase tracking-widest">{key.replace(/_/g, ' ')}</span>
                         <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={template.enabled} 
                              onChange={e => {
                                 const next = { ...settings };
                                 next.templates[key as keyof CommunicationSettings['templates']].enabled = e.target.checked;
                                 setSettings(next);
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-8 h-4 bg-gray-200 peer-checked:bg-primary rounded-full relative transition-all after:content-[''] after:absolute after:h-3 after:w-3 after:bg-white after:rounded-full after:top-0.5 after:left-0.5 peer-checked:after:left-4 after:transition-all"></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">Enabled</span>
                         </label>
                      </div>
                      
                      <div className="p-8 space-y-4">
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Subject</label>
                            <input 
                               value={template.subject}
                               onChange={e => {
                                  const next = { ...settings };
                                  next.templates[key as keyof CommunicationSettings['templates']].subject = e.target.value;
                                  setSettings(next);
                               }}
                               className="w-full border-none focus:ring-0 p-0 text-lg font-black text-gray-900" 
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Body (HTML/Text)</label>
                            <textarea 
                               rows={6}
                               value={template.body}
                               onChange={e => {
                                  const next = { ...settings };
                                  next.templates[key as keyof CommunicationSettings['templates']].body = e.target.value;
                                  setSettings(next);
                               }}
                               className="w-full bg-gray-50 rounded-xl border-2 border-gray-50 p-4 text-sm font-medium focus:bg-white focus:border-primary transition-all focus:outline-none" 
                            />
                         </div>
                      </div>
                   </div>
                 )
              })}
           </div>
        </section>

        <div className="flex justify-end pt-8 border-t border-gray-100">
           <button 
             type="submit" 
             disabled={isSaving}
             className="bg-primary text-white px-12 py-4 rounded-xl font-black text-sm tracking-widest uppercase shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-2"
           >
             {isSaving ? <Icons.Loader2 className="animate-spin h-5 w-5" /> : <Icons.Save className="h-5 w-5" />}
             Save Communication Settings
           </button>
        </div>
      </form>
    </div>
  );
};

export default function Admin() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const navigate = useNavigate();

  const [tours, setTours] = useState<Tour[]>([]);
  // ... other existing state ...

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      setUser(authUser);
      if (authUser) {
        const unsubsProfile = onSnapshot(doc(db, 'users', authUser.uid), (snap) => {
          if (snap.exists()) {
            setProfile({ uid: snap.id, ...snap.data() } as UserProfile);
          }
          setAuthLoading(false);
        });
        return () => unsubsProfile();
      } else {
        setAuthLoading(false);
        navigate('/login');
      }
    });
    return unsubscribe;
  }, [navigate]);

  const isAdmin = isAdminUser(user?.email, profile?.role);

  useEffect(() => {
    // Admin elevation logic
    if (user && isAdmin && profile && profile.role !== 'admin') {
       const userRef = doc(db, 'users', user.uid);
       updateDoc(userRef, { role: 'admin', updatedAt: serverTimestamp() }).catch(console.error);
    }
  }, [user, isAdmin, profile]);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!isAdmin) return null; // Or show unauthorized message before redirect

  // ... rest of the component ...
  const [categories, setCategories] = useState<Category[]>([]);
  const [tourTypes, setTourTypes] = useState<TourType[]>([]);
  const [locations, setLocations] = useState<LocationMeta[]>([]);
  const [globalAddOns, setGlobalAddOns] = useState<AddOn[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [urgencyPoints, setUrgencyPoints] = useState<UrgencyPoint[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  const [activeMenu, setActiveMenu] = useState<MenuId>('dashboard');
  const [expandedMenu, setExpandedMenu] = useState<string | null>('tours');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  
  // Shared Booking State for Detail Modal
  const [globalSelectedBooking, setGlobalSelectedBooking] = useState<Booking | null>(null);
  const [originalBooking, setOriginalBooking] = useState<Booking | null>(null);
  const [isBookingDetailOpen, setIsBookingDetailOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assignBooking, setAssignBooking] = useState<Booking | null>(null);
  const [allGuides, setAllGuides] = useState<Guide[]>([]);
  const [newNote, setNewNote] = useState('');

  const [formData, setFormData] = useState<Partial<Tour>>({
    title: '',
    slug: '',
    description: '',
    categoryId: '',
    tourTypeId: '',
    locationId: '',
    location: '',
    duration: '',
    regularPrice: 0,
    discountPrice: 0,
    gallery: [],
    featuredImage: '',
    highlights: [],
    inclusions: [],
    exclusions: [],
    itinerary: [],
    infoSections: [],
    languages: [],
    packages: [],
    addOnIds: [],
    faqs: [],
    locationMapUrl: '',
    importantInfo: ''
  });

  const [highlightsText, setHighlightsText] = useState('');
  const [inclusionsText, setInclusionsText] = useState('');
  const [exclusionsText, setExclusionsText] = useState('');
  const [languagesText, setLanguagesText] = useState('');
  const [expandedPackages, setExpandedPackages] = useState<number[]>([]);
  const [expandedItinerary, setExpandedItinerary] = useState<number[]>([]);

  useEffect(() => {
    if (!editingId && formData.title) {
        const generatedSlug = formData.title
            .toLowerCase()
            .replace(/[^\w\s-]/g, '') // Remove non-alphanumeric except space and dash
            .replace(/\s+/g, '-') // Replace spaces with dashes
            .replace(/-+/g, '-') // Remove consecutive dashes
            .trim();
        setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.title, editingId]);

  useEffect(() => {
    const q = query(collection(db, 'tours'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTours(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Tour)));
    });

    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Category)));
    });

    const unsubscribeTypes = onSnapshot(collection(db, 'tourTypes'), (snapshot) => {
      setTourTypes(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as TourType)));
    });

    const unsubscribeLocations = onSnapshot(collection(db, 'locationMeta'), (snapshot) => {
      setLocations(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as LocationMeta)));
    });

    const unsubscribeAddOns = onSnapshot(collection(db, 'globalAddOns'), (snapshot) => {
      setGlobalAddOns(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as AddOn)));
    });

    const unsubscribeCoupons = onSnapshot(collection(db, 'coupons'), (snapshot) => {
      setCoupons(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Coupon)));
    });

    const unsubscribeUrgency = onSnapshot(collection(db, 'urgencyPoints'), (snapshot) => {
      setUrgencyPoints(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as UrgencyPoint)));
    });

    const unsubscribeBookings = onSnapshot(query(collection(db, 'bookings'), orderBy('date', 'asc')), (snapshot) => {
      setBookings(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    });

    const unsubscribeGuides = onSnapshot(
      query(collection(db, 'guides'), where('isActive', '==', true), orderBy('name', 'asc')), 
      (snapshot) => {
        setAllGuides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guide)));
      }
    );

    return () => {
      unsubscribe();
      unsubscribeCategories();
      unsubscribeTypes();
      unsubscribeLocations();
      unsubscribeAddOns();
      unsubscribeCoupons();
      unsubscribeUrgency();
      unsubscribeBookings();
      unsubscribeGuides();
    };
  }, []);

  const handleAssignToGuide = async (booking: Booking, guide: Guide) => {
    try {
      const tourDoc = await getDoc(doc(db, 'tours', booking.tourId));
      const tour = tourDoc.exists() ? tourDoc.data() as Tour : null;
      
      let message = `*Tour Details Assignment*\n\n`;
      message += `Name of guest: ${booking.customerData.fullName}\n`;
      message += `No of guest: ${booking.participants.adults} Adults, ${booking.participants.children} Children\n`;
      message += `Pick up address: ${booking.customerData.pickupAddress || 'N/A'}\n`;
      message += `Guest Whatsapp Number: ${booking.customerData.phone}\n`;
      message += `Tour date: ${booking.date}\n`;
      message += `Tours: ${booking.tourTitle}\n`;
      message += `Package Booked: ${booking.packageName}\n`;
      
      if (booking.selectedAddOns && booking.selectedAddOns.length > 0) {
        message += `\n*Add-ons:*\n`;
        booking.selectedAddOns.forEach(addon => {
          message += `- ${addon.name} (x${addon.quantity})\n`;
        });
      }
      
      if (tour && tour.itinerary && tour.itinerary.length > 0) {
         message += `\n*Itinerary:*\n`;
         tour.itinerary.forEach(item => {
           message += `- ${item.title}\n`;
         });
      }

      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${guide.whatsapp}?text=${encodedMessage}`, '_blank');
      
      const newLog: BookingLog = {
        timestamp: new Date().toISOString(),
        message: `Guide assigned: ${guide.name} (${guide.whatsapp})`,
        type: 'assignment',
        userName: auth.currentUser?.displayName || auth.currentUser?.email || 'Admin'
      };

      const updatedLogs = [...(booking.logs || []), newLog];

      // Save assignment to Firestore
      await updateDoc(doc(db, 'bookings', booking.id), {
        assignedGuideId: guide.id,
        assignedGuideName: guide.name,
        assignedGuideWhatsapp: guide.whatsapp,
        logs: updatedLogs
      });

      // Send Email Notification
      await sendBookingEmail('guide_assigned', { ...booking, logs: updatedLogs }, { 
        "{{guideName}}": guide.name,
        "{{guideWhatsapp}}": guide.whatsapp 
      });

      // Sync global Detail state if currently viewing this booking
      if (globalSelectedBooking && globalSelectedBooking.id === booking.id) {
        setGlobalSelectedBooking({
          ...globalSelectedBooking,
          assignedGuideId: guide.id,
          assignedGuideName: guide.name,
          assignedGuideWhatsapp: guide.whatsapp,
          logs: updatedLogs
        });
      }

      setIsAssignOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to gather info for WhatsApp message.");
    }
  };

  const updateBookingStatus = async (id: string, status: 'confirmed' | 'cancelled' | 'pending') => {
    try {
      await updateDoc(doc(db, 'bookings', id), { status });
      
      // Send Email Notification
      const bookingSnap = await getDoc(doc(db, 'bookings', id));
      if (bookingSnap.exists()) {
         const bookingData = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
         const templateType = status === 'confirmed' ? 'booking_confirmed' : status === 'cancelled' ? 'booking_cancelled' : 'booking_status_updated';
         await sendBookingEmail(templateType, bookingData);
      }

      alert(`Booking ${status} successfully!`);
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const handleAddInternalNote = async () => {
    if (!newNote.trim() || !globalSelectedBooking) return;
    
    const newLog: BookingLog = {
      timestamp: new Date().toISOString(),
      message: newNote,
      type: 'note',
      userName: auth.currentUser?.displayName || auth.currentUser?.email || 'Admin'
    };
    
    const updatedLogs = [...(globalSelectedBooking.logs || []), newLog];
    const updatedBooking = { ...globalSelectedBooking, logs: updatedLogs };
    
    setGlobalSelectedBooking(updatedBooking);
    setNewNote('');
    
    try {
      await updateDoc(doc(db, 'bookings', globalSelectedBooking.id), {
        logs: updatedLogs
      });
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const handleSaveBookingChange = async (e: FormEvent) => {
    e.preventDefault();
    if (!globalSelectedBooking) return;
    try {
      const { id, ...data } = globalSelectedBooking;
      
      // Handle Auto-logging of changes
      const newLogs: BookingLog[] = [...(globalSelectedBooking.logs || [])];
      const adminName = auth.currentUser?.displayName || auth.currentUser?.email || 'Admin';
      
      if (originalBooking) {
        if (globalSelectedBooking.status !== originalBooking.status) {
          newLogs.push({
            timestamp: new Date().toISOString(),
            message: `Status changed from ${originalBooking.status} to ${globalSelectedBooking.status}`,
            type: 'status_change',
            userName: adminName
          });
        }
        if (globalSelectedBooking.date !== originalBooking.date) {
            newLogs.push({
              timestamp: new Date().toISOString(),
              message: `Tour date changed from ${originalBooking.date} to ${globalSelectedBooking.date}`,
              type: 'system',
              userName: adminName
            });
        }
        if (globalSelectedBooking.paymentStatus !== originalBooking.paymentStatus) {
            newLogs.push({
              timestamp: new Date().toISOString(),
              message: `Payment status changed from ${originalBooking.paymentStatus} to ${globalSelectedBooking.paymentStatus}`,
              type: 'system',
              userName: adminName
            });
        }
      }

      const finalData = { ...data, logs: newLogs };
      await updateDoc(doc(db, 'bookings', id), finalData as any);
      
      // Determine logical change for specific email branding
      let templateType = 'booking_status_updated';
      if (originalBooking) {
        if (globalSelectedBooking.status !== originalBooking.status) {
           if (globalSelectedBooking.status === 'confirmed') templateType = 'booking_confirmed';
           else if (globalSelectedBooking.status === 'cancelled') templateType = 'booking_cancelled';
        } else if (globalSelectedBooking.date !== originalBooking.date) {
           templateType = 'booking_date_changed';
        } else if (globalSelectedBooking.paymentStatus !== originalBooking.paymentStatus && globalSelectedBooking.paymentStatus === 'paid') {
           templateType = 'booking_payment_received';
        }
      }
      
      await sendBookingEmail(templateType, { ...globalSelectedBooking, logs: newLogs });
      
      alert("Booking updated successfully!");
      setIsBookingDetailOpen(false);
      setOriginalBooking(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save booking.");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      // Hydrate selected add-ons from global list for frontend snapshots
      const selectedAddOnObjects = globalAddOns.filter(a => formData.addOnIds?.includes(a.id));
      
      const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');

      const dataToSave = {
        ...formData,
        slug: formData.slug || slugify(formData.title || 'tour'),
        addOns: selectedAddOnObjects, // Full objects for frontend
        highlights: highlightsText.split('\n').filter(line => line.trim() !== ''),
        inclusions: inclusionsText.split('\n').filter(line => line.trim() !== ''),
        exclusions: exclusionsText.split('\n').filter(line => line.trim() !== ''),
        languages: languagesText.split('\n').filter(line => line.trim() !== ''),
        packages: (formData.packages || []).map(pkg => ({
          ...pkg,
          inclusions: (pkg.inclusions || []).filter(l => l.trim() !== ''),
          exclusions: (pkg.exclusions || []).filter(l => l.trim() !== '')
        })),
        infoSections: (formData.infoSections || []).map(section => ({
          ...section,
          content: Array.isArray(section.content) ? section.content.filter(l => l.trim() !== '') : []
        })),
        updatedAt: serverTimestamp()
      };

      if (editingId) {
        await updateDoc(doc(db, 'tours', editingId), dataToSave);
      } else {
        await addDoc(collection(db, 'tours'), {
          ...dataToSave,
          createdAt: serverTimestamp(),
        });
        resetForm();
      }
      alert("Success!");
    } catch (error) {
      console.error("Error saving tour", error);
      alert("Error saving tour. Check permissions.");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setExpandedPackages([]);
    setExpandedItinerary([]);
    setActiveTab('basic');
    setHighlightsText('');
    setInclusionsText('');
    setExclusionsText('');
    setLanguagesText('');
    setFormData({
      title: '', slug: '', description: '', categoryId: '', tourTypeId: '', locationId: '',
      location: '', duration: '',
      regularPrice: 0, discountPrice: 0, gallery: [], featuredImage: '',
      highlights: [], inclusions: [], exclusions: [], itinerary: [],
      languages: [], packages: [], addOnIds: [], faqs: [], locationMapUrl: '',
      infoSections: [], importantInfo: ''
    });
  };

  const handleEdit = (tour: Tour) => {
    setEditingId(tour.id);
    setExpandedPackages([]);
    setExpandedItinerary([]);
    setHighlightsText(tour.highlights?.join('\n') || '');
    setInclusionsText(tour.inclusions?.join('\n') || '');
    setExclusionsText(tour.exclusions?.join('\n') || '');
    setLanguagesText(tour.languages?.join('\n') || '');
    setFormData({
      ...formData, // default values
      ...tour,
      gallery: tour.gallery || [],
      highlights: tour.highlights || [],
      inclusions: tour.inclusions || [],
      exclusions: tour.exclusions || [],
      itinerary: tour.itinerary || [],
      packages: tour.packages || [],
      addOns: tour.addOns || [],
      faqs: tour.faqs || [],
      languages: tour.languages || [],
      infoSections: tour.infoSections || []
    });
    setActiveTab('basic');
    setActiveMenu('tours');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloneTour = async (tour: Tour) => {
    if (!confirm(`Clone "${tour.title}"?`)) return;
    try {
      const { id, createdAt, updatedAt, ...clonedData } = tour;
      const newTitle = `${clonedData.title} (Copy)`;
      const newSlug = `${clonedData.slug}-copy-${Math.floor(Math.random() * 1000)}`;
      
      await addDoc(collection(db, 'tours'), {
        ...clonedData,
        title: newTitle,
        slug: newSlug,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      alert("Tour cloned successfully!");
    } catch (error) {
      console.error("Error cloning tour", error);
      alert("Failed to clone tour.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this tour?")) {
      await deleteDoc(doc(db, 'tours', id));
    }
  };

  // Helper for adding/removing items in arrays
  const addArrayItem = (field: keyof Tour, defaultValue: any) => {
    const current = Array.isArray(formData[field]) ? (formData[field] as any[]) : [];
    const newList = [...current, defaultValue];
    setFormData({ ...formData, [field]: newList });
    
    // Automatically expand the new item
    if (field === 'packages') {
      setExpandedPackages(prev => [...prev, current.length]);
    } else if (field === 'itinerary') {
      setExpandedItinerary(prev => [...prev, current.length]);
    }
  };

  const updateArrayItem = (field: keyof Tour, index: number, value: any) => {
    const current = Array.isArray(formData[field]) ? [...(formData[field] as any[])] : [];
    current[index] = value;
    setFormData({ ...formData, [field]: current });
  };

  const removeArrayItem = (field: keyof Tour, index: number) => {
    const current = Array.isArray(formData[field]) ? [...(formData[field] as any[])] : [];
    current.splice(index, 1);
    setFormData({ ...formData, [field]: current });

    // Update expanded states
    if (field === 'packages') {
      setExpandedPackages(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    } else if (field === 'itinerary') {
      setExpandedItinerary(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
    }
  };

  const handleItineraryImageUpload = async (index: number, e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      const newItinerary = [...(formData.itinerary || [])];
      newItinerary[index] = { ...newItinerary[index], image: url };
      setFormData({ ...formData, itinerary: newItinerary });
    } catch (error) {
      alert("Image upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // File Upload to Imgbb (Multi-file Support)
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => uploadImage(file as File));
      const urls = await Promise.all(uploadPromises);
      const currentGallery = formData.gallery || [];
      setFormData({ ...formData, gallery: [...currentGallery, ...urls] });
    } catch (error) {
      alert("Upload failed. Make sure your IMGBB API key is correct.");
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'basic', label: 'Basic Info', icon: Layout },
    { id: 'content', label: 'Highlights', icon: ImageIcon },
    { id: 'inclusions', label: 'Incl/Excl', icon: CheckCircle },
    { id: 'pricing', label: 'Pricing & Pkgs', icon: DollarSign },
    { id: 'itinerary', label: 'Itinerary', icon: Map },
    { id: 'addOns', label: 'Add-ons', icon: PlusCircle },
    { id: 'info', label: 'Important Info', icon: ShieldAlert },
    { id: 'faq', label: 'Policies & FAQ', icon: Info },
  ];

  const seedDummyData = async () => {
    const dummyTours: Partial<Tour>[] = [
      {
        title: "Ultimate Bali Adventure: Jungle & Beaches",
        slug: "ultimate-bali-adventure",
        description: "Experience the best of Bali in this 7-day comprehensive tour. From the lush jungles of Ubud to the pristine beaches of Uluwatu, this tour covers the island's most iconic spots. You'll visit ancient temples, witness traditional kecak dances, and enjoy world-class surf breaks. Our expert local guides will ensure you get an authentic experience away from the crowds.",
        highlights: ["Sunrise hike at Mount Batur", "Ubud Monkey Forest visit", "Tegalalang Rice Terrace tour", "Surfing lessons in Canggu"],
        inclusions: ["6 nights accommodation", "Daily breakfast", "Private transport"],
        exclusions: ["International flights", "Travel insurance", "Personal expenses"],
        itinerary: [
          { day: 1, title: "Arrival in Denpasar", description: "Pick up from airport and check-in at your hotel in Seminyak." },
          { day: 2, title: "Cultural Ubud", description: "Visit the Monkey Forest and Tegalalang Rice Terraces." }
        ],
        importantInfo: "Bring comfortable walking shoes and swimwear.",
        languages: ["English", "Indonesian"],
        location: "Ubud & Seminyak",
        locationMapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1010372!2d114.475!3d-8.45!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd141d3e8101539%3A0x740dfc3444053b6!2sBali!5e0!3m2!1sen!2sid!4v1713480000000!5m2!1sen!2sid",
        duration: "7 Days",
        gallery: ["https://picsum.photos/seed/bali-jungle/1200/800", "https://picsum.photos/seed/bali-beach/1200/800", "https://picsum.photos/seed/bali-temple/1200/800", "https://picsum.photos/seed/bali-food/1200/800", "https://picsum.photos/seed/bali-spa/1200/800"],
        regularPrice: 1200,
        discountPrice: 999,
        packages: [
          {
            name: "Standard Package",
            inclusions: ["Airport Transfer", "Breakfast"],
            exclusions: ["Lunch", "Dinner"],
            tiers: [
              { minParticipants: 1, maxParticipants: 1, adultPrice: 1500, childPrice: 1200 },
              { minParticipants: 2, maxParticipants: 4, adultPrice: 999, childPrice: 799 },
              { minParticipants: 5, maxParticipants: 10, adultPrice: 799, childPrice: 599 }
            ]
          },
          {
            name: "Luxury VIP Package",
            inclusions: ["Private Villa", "Pool Breakfast", "Private Driver"],
            exclusions: ["Alcoholic Drinks"],
            tiers: [
              { minParticipants: 1, maxParticipants: 1, adultPrice: 2500, childPrice: 2000 },
              { minParticipants: 2, maxParticipants: 4, adultPrice: 1999, childPrice: 1599 },
              { minParticipants: 5, maxParticipants: 10, adultPrice: 1599, childPrice: 1299 }
            ]
          }
        ],
        faqs: [{ question: "Is the hike difficult?", answer: "It's a moderate hike, suitable for most people with average fitness." }]
      },
      {
        title: "Nusa Penida & Lembongan Island Escape",
        description: "Hop over to the rugged Nusa islands for the most breathtaking cliffs and crystal clear waters in Indonesia. Visit Kelingking Beach, Broken Beach, and swim with Manta Rays at Manta Point.",
        highlights: ["Snorkeling with Manta Rays", "Kelingking Secret Point", "Broken Beach & Angel Billabong", "Devil's Tears Sunset"],
        inclusions: ["Fast boat transfers", "Snorkeling gear", "Lunch boxes"],
        exclusions: ["Dinner", "Alcohol"],
        itinerary: [
          { day: 1, title: "East Nusa Penida", description: "Visit Diamond Beach and Thousand Islands viewpoint." },
          { day: 2, title: "West Nusa Penida", description: "Kelingking Beach and Broken Beach." }
        ],
        importantInfo: "Boats can be rocky, bring motion sickness pills if needed.",
        languages: ["English", "Indonesian"],
        location: "Nusa Penida",
        locationMapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63131.5428784824!2d115.48514131!3d-8.724628!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd6093847ec3b27%3A0xe67aa887c2f0f456!2sNusa%20Penida!5e0!3m2!1sen!2sid!4v1713480000001!5m2!1sen!2sid",
        duration: "3 Days",
        gallery: ["https://picsum.photos/seed/nusa1/1200/800", "https://picsum.photos/seed/nusa2/1200/800", "https://picsum.photos/seed/nusa3/1200/800", "https://picsum.photos/seed/nusa4/1200/800"],
        regularPrice: 450,
        discountPrice: 399,
        packages: [
          {
            name: "Island Hopper",
            inclusions: ["Boat Transfer", "Hostel Bed"],
            exclusions: ["Private Room"],
            tiers: [
              { minParticipants: 1, maxParticipants: 1, adultPrice: 500, childPrice: 400 },
              { minParticipants: 2, maxParticipants: 5, adultPrice: 399, childPrice: 299 }
            ]
          }
        ],
        faqs: [{ question: "Can we see Mantas every day?", answer: "Mantas are wild animals, but we see them about 90% of the time!" }]
      },
      {
        title: "Bali Spiritual & Yoga Retreat",
        description: "Rejuvenate your soul in the spiritual heart of Bali. This retreat combines daily yoga sessions, meditation, and traditional Balinese healing ceremonies. Perfect for those looking to disconnect and find inner peace.",
        highlights: ["Daily Yoga & Meditation", "Traditional Healer Visit", "Sacred Water Temple Cleaning", "Organic Vegan Food"],
        inclusions: ["Eco-lodge stay", "Vegan meals", "Yoga mats"],
        exclusions: ["Spa treatments", "Flights"],
        itinerary: [
          { day: 1, title: "Welcome Circle", description: "Opening ceremony and sunset meditation." },
          { day: 2, title: "Purification", description: "Holy water ritual at Tirta Empul." }
        ],
        importantInfo: "Please bring white clothing for ceremonies.",
        languages: ["English", "Indonesian"],
        location: "Ubud Mountains",
        locationMapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126305.9080517!2d115.19!3d-8.45!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd23d70ad3a943d%3A0x403061fc49a1d40!2sUbud%2C%20Gianyar%20Regency%2C%20Bali!5e0!3m2!1sen!2sid!4v1713480000002!5m2!1sen!2sid",
        duration: "5 Days",
        gallery: ["https://picsum.photos/seed/yoga1/1200/800", "https://picsum.photos/seed/yoga2/1200/800", "https://picsum.photos/seed/yoga3/1200/800", "https://picsum.photos/seed/yoga4/1200/800"],
        regularPrice: 850,
        discountPrice: 750,
        packages: [
          {
            name: "Complete Zen",
            inclusions: ["All Meals", "All Classes"],
            exclusions: ["Private Consultation"],
            tiers: [
              { minParticipants: 1, maxParticipants: 2, adultPrice: 850, childPrice: 850 },
              { minParticipants: 3, maxParticipants: 10, adultPrice: 750, childPrice: 750 }
            ]
          }
        ],
        faqs: [{ question: "Beginners welcome?", answer: "Absolutely! Our classes are tailored for all levels." }]
      },
      {
        title: "North Bali Dolphin & Waterfall Tour",
        description: "Discover the hidden gems of North Bali. From the early morning dolphin watching in Lovina to the majestic Sekumpul waterfalls, this is the 'unspoiled' Bali you've been dreaming of.",
        highlights: ["Sunrise Dolphin Watching", "Sekumpul Waterfall Trek", "Banjar Hot Springs", "Buddhist Monastery"],
        inclusions: ["Boat rental", "Local guide", "Lunch"],
        exclusions: ["Breakfast"],
        itinerary: [
          { day: 1, title: "Drive North", description: "Scenic drive through the Bedugul mountains." },
          { day: 2, title: "Dolphins & Falls", description: "Early morning boat trip followed by waterfall hiking." }
        ],
        importantInfo: "Be prepared for a 4 AM start for the dolphins.",
        languages: ["English", "Indonesian"],
        location: "Lovina & Munduk",
        locationMapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d505185.243!2d114.9!3d-8.15!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd19ae4e83f2e1d%3A0xfe9743f553f1c6fe!2sLovina%20Beach!5e0!3m2!1sen!2sid!4v1713480000003!5m2!1sen!2sid",
        duration: "2 Days",
        gallery: ["https://picsum.photos/seed/dolphin1/1200/800", "https://picsum.photos/seed/dolphin2/1200/800", "https://picsum.photos/seed/dolphin3/1200/800", "https://picsum.photos/seed/dolphin4/1200/800"],
        regularPrice: 300,
        discountPrice: 250,
        packages: [
          {
            name: "Explorer Package",
            inclusions: ["Homestay Stay", "Dolphin Boat"],
            exclusions: ["Waterfall Entrance"],
            tiers: [
              { minParticipants: 1, maxParticipants: 1, adultPrice: 350, childPrice: 200 },
              { minParticipants: 2, maxParticipants: 6, adultPrice: 250, childPrice: 150 }
            ]
          }
        ],
        faqs: [{ question: "What if it rains?", answer: "Dolphin trips might be postponed, but waterfalls are even better in the rain!" }]
      },
      {
        title: "Bali Foodie & Night Market tour",
        description: "Taste your way through Bali. This tour takes you to the best night markets, local warungs, and hidden gems known only to residents. Learn the secrets of Balinese spices and cooking.",
        highlights: ["Night Market Food Crawl", "Babi Guling Feast", "Coffee Plantation Tour", "Cooking Class"],
        inclusions: ["All Food & Drinks", "Transportation"],
        exclusions: ["Main Course at High-end restaurants"],
        itinerary: [
          { day: 1, title: "Market Mania", description: "Visit Gianyar night market for authentic street food." }
        ],
        importantInfo: "Come hungry! Not recommended for those on a strict diet.",
        languages: ["English", "Indonesian"],
        location: "Gianyar & Sanur",
        locationMapUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126305!2d115.3!3d-8.5!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2dd23f9b!2sGianyar%2C%20Bali!5e0!3m2!1sen!2sid!4v1713480000004!5m2!1sen!2sid",
        duration: "1 Day",
        gallery: ["https://picsum.photos/seed/food1/1200/800", "https://picsum.photos/seed/food2/1200/800", "https://picsum.photos/seed/food3/1200/800", "https://picsum.photos/seed/food4/1200/800"],
        regularPrice: 150,
        discountPrice: 120,
        packages: [
          {
            name: "Street Food King",
            inclusions: ["Unlimited Samples", "Cooking Class"],
            exclusions: ["Souvenirs"],
            tiers: [
              { minParticipants: 1, maxParticipants: 3, adultPrice: 150, childPrice: 100 },
              { minParticipants: 4, maxParticipants: 10, adultPrice: 120, childPrice: 80 }
            ]
          }
        ],
        faqs: [{ question: "Is the food spicy?", answer: "It can be, but you can always request 'tidak pedas' (no spice)." }]
      }
    ];

    try {
      const slugify = (text: string) => text.toLowerCase().replace(/[^\w ]+/g, '').replace(/ +/g, '-');

      const batchPromises = dummyTours.map(tour => {
        const tourData = {
          ...tour,
          slug: tour.slug || slugify(tour.title || 'tour'),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        return addDoc(collection(db, 'tours'), tourData);
      });
      
      // Seed urgency points if none exist
      if (urgencyPoints.length === 0) {
        const defaultUrgency = [
          { title: "Free Cancellation", description: "Up to 24 hours in advance", icon: "CheckCircle" },
          { title: "Instant Confirmation", description: "Receive your voucher immediately", icon: "Clock" },
          { title: "Reserve Now, Pay Later", description: "Secure your spot without paying today", icon: "Calendar" }
        ];
        defaultUrgency.forEach(p => addDoc(collection(db, 'urgencyPoints'), p));
      }

      // Seed a sample page if none exist
      const pagesSnap = await getDocs(collection(db, 'pages'));
      if (pagesSnap.empty) {
        await addDoc(collection(db, 'pages'), {
          title: "Terms and Conditions",
          slug: "terms-and-conditions",
          content: "Welcome to DayTours. By booking with us, you agree to...",
          updatedAt: serverTimestamp()
        });
      }
      
      await Promise.all(batchPromises);
      alert("Dummy tours, urgency points, and pages seeded successfully!");
    } catch (error) {
       console.error("Error seeding", error);
       alert("Failed to seed. Make sure you are an admin.");
    }
  };

  const ScheduleCalendar = () => {
    const [viewDate, setViewDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
        setLoading(false);
      });
      return unsubscribe;
    }, []);

    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
      start: startDate,
      end: endDate,
    });

    const getBookingsForDay = (day: Date) => {
      return bookings.filter(b => {
        try {
          const bookingDate = parseISO(b.date);
          return isSameDay(bookingDate, day);
        } catch (e) {
          return false;
        }
      });
    };

    const nextMonth = () => setViewDate(addMonths(viewDate, 1));
    const previousMonth = () => setViewDate(subMonths(viewDate, 1));
    const goToToday = () => {
      setViewDate(new Date());
      setSelectedDate(new Date());
    };

    const selectedDayBookings = getBookingsForDay(selectedDate);
    const totalGuests = selectedDayBookings.reduce((sum, b) => sum + (b.participants.adults + b.participants.children), 0);
    const totalRevenue = selectedDayBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Tour Schedule Calendar</h2>
            <p className="text-gray-500 font-medium text-sm">View and manage your tour bookings by date</p>
          </div>
          <button 
            onClick={() => setActiveMenu('bookings')}
            className="px-6 py-3 rounded-xl border-2 border-gray-100 font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2"
          >
            <Icons.List className="h-4 w-4" /> View All Bookings
          </button>
        </div>

        <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden p-8">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2">
                 <button onClick={previousMonth} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 group transition-all">
                    <Icons.ChevronLeft className="h-5 w-5 group-hover:text-gray-900" />
                 </button>
                 <h3 className="text-xl font-black text-gray-900 min-w-[160px] text-center">
                    {format(viewDate, 'MMMM yyyy')}
                 </h3>
                 <button onClick={nextMonth} className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 group transition-all">
                    <Icons.ChevronRight className="h-5 w-5 group-hover:text-gray-900" />
                 </button>
               </div>
            </div>
            <button 
              onClick={goToToday}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-black text-xs uppercase tracking-[0.1em] hover:bg-emerald-700 transition-all flex items-center gap-2 shadow-lg shadow-emerald-100"
            >
              <Icons.Calendar className="h-4 w-4" /> Today
            </button>
          </div>

          <div className="grid grid-cols-7 gap-px rounded-xl overflow-hidden bg-gray-100 border border-gray-100">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="bg-gray-50 py-4 text-center">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{day}</span>
              </div>
            ))}
            
            {calendarDays.map((day, idx) => {
              const dayBookings = getBookingsForDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isCurrentMonth = isSameMonth(day, monthStart);
              const guestsCount = dayBookings.reduce((sum, b) => sum + (b.participants.adults + b.participants.children), 0);

              return (
                <div 
                  key={idx}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "min-h-[140px] bg-white p-4 transition-all cursor-pointer relative",
                    !isCurrentMonth && "bg-gray-50/30",
                    isSelected && "ring-2 ring-primary ring-inset z-10 bg-emerald-50/30"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-sm font-black transition-colors",
                      !isCurrentMonth ? "text-gray-300" : isToday(day) ? "text-emerald-600" : "text-gray-500",
                      isSelected && "text-primary"
                    )}>
                      {format(day, 'd')}
                    </span>
                    {dayBookings.length > 0 && (
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        dayBookings.some(b => b.status === 'confirmed') ? "bg-emerald-500" : "bg-amber-500"
                      )} />
                    )}
                  </div>

                  {dayBookings.length > 0 && isCurrentMonth && (
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-gray-900 leading-tight">
                        {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                         <Icons.Users className="h-2.5 w-2.5" />
                         {guestsCount} people
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Day Details */}
        <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
           <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </h3>
                <p className="text-gray-500 font-bold text-sm">
                  {selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? 's' : ''} scheduled
                </p>
              </div>
              <div className="flex items-center gap-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Guests</p>
                    <p className="text-2xl font-black text-gray-900">{totalGuests}</p>
                 </div>
                 <div className="w-px h-10 bg-gray-100" />
                 <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Revenue</p>
                    <p className="text-2xl font-black text-emerald-600 font-mono">{formatPrice(totalRevenue)}</p>
                 </div>
              </div>
           </div>

           <div className="grid gap-4">
              {selectedDayBookings.map(booking => (
                <div key={booking.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-primary/50 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
                   <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-primary transition-colors shrink-0">
                         <Icons.MapPin className="h-6 w-6" />
                      </div>
                      <div className="space-y-1">
                         <div className="flex items-center gap-3">
                           <h4 className="font-black text-gray-900 text-lg">{booking.tourTitle}</h4>
                           <span className={cn(
                             "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest",
                             booking.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" :
                             booking.status === 'cancelled' ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                           )}>
                             {booking.status}
                           </span>
                         </div>
                         <div className="grid grid-cols-2 gap-x-8 gap-y-1">
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Guest:</span>
                               <span className="text-xs font-black text-gray-700">{booking.customerData.fullName}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Email:</span>
                               <span className="text-xs font-bold text-gray-700">{booking.customerData.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Guests:</span>
                               <span className="text-xs font-black text-gray-700">{booking.participants.adults + booking.participants.children}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Total:</span>
                               <span className="text-xs font-black text-emerald-600 font-mono">{formatPrice(booking.totalAmount)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                               <span className="text-[10px] font-bold text-gray-400">Guide:</span>
                               <span className="text-xs font-black text-primary uppercase tracking-tight">{booking.assignedGuideName || 'Not Assigned'}</span>
                            </div>
                         </div>
                      </div>
                   </div>
                   <button 
                     onClick={() => {
                        setGlobalSelectedBooking(booking);
                        setOriginalBooking(booking);
                        setIsBookingDetailOpen(true);
                     }}
                     className="px-6 py-3 rounded-xl border-2 border-gray-50 text-gray-900 font-black text-xs uppercase tracking-widest hover:border-primary hover:text-primary transition-all self-end md:self-center"
                   >
                     View Details
                   </button>
                </div>
              ))}               {selectedDayBookings.length === 0 && (
                <div className="p-12 text-center bg-gray-50/50 rounded-2xl border border-gray-100 border-dashed">
                  <p className="text-gray-400 font-bold text-sm uppercase tracking-widest">No tours scheduled for this day</p>
                </div>
              )}
           </div>
        </div>
      </div>
    );
  };

  const BlogManager = () => {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPost, setEditingPost] = useState<Partial<BlogPost> | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BlogPost)));
        setLoading(false);
      }, (error) => {
        console.error("Posts fetch error:", error);
        setLoading(false);
      });
      return unsubscribe;
    }, []);

    const handleSavePost = async (e: FormEvent) => {
      e.preventDefault();
      if (!editingPost?.title || !editingPost?.slug) return;

      const postData = {
        ...editingPost,
        updatedAt: serverTimestamp(),
      };

      if (!postData.createdAt) {
        postData.createdAt = serverTimestamp();
      }

      try {
        if (editingPost.id) {
          await updateDoc(doc(db, 'posts', editingPost.id), postData);
        } else {
          await addDoc(collection(db, 'posts'), postData);
        }
        setIsModalOpen(false);
        setEditingPost(null);
      } catch (err) {
        console.error("Error saving post:", err);
      }
    };

    const handleDeletePost = async (id: string) => {
      if (confirm("Delete this post?")) {
        await deleteDoc(doc(db, 'posts', id));
      }
    };

    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Blog Articles</h2>
            <p className="text-gray-500 font-medium text-sm">Create and manage your stories and news.</p>
          </div>
          <button 
            onClick={() => { setEditingPost({ status: 'draft', tags: [] }); setIsModalOpen(true); }}
            className="bg-primary text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2"
          >
            <Icons.Plus className="h-4 w-4" /> New Article
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <div key={post.id} className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden group">
              <div className="aspect-video relative overflow-hidden">
                <img 
                  src={post.featuredImage || 'https://picsum.photos/seed/blog/800/600'} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <button onClick={() => { setEditingPost(post); setIsModalOpen(true); }} className="p-2 bg-white/90 backdrop-blur rounded-lg text-blue-600 shadow-lg">
                    <Icons.Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDeletePost(post.id)} className="p-2 bg-white/90 backdrop-blur rounded-lg text-red-600 shadow-lg">
                    <Icons.Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="absolute bottom-4 left-4">
                  <span className={cn(
                    "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                    post.status === 'published' ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
                  )}>
                    {post.status}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-black text-primary uppercase tracking-widest">{post.category}</span>
                </div>
                <h3 className="font-black text-gray-900 line-clamp-1 mb-2">{post.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">{post.excerpt}</p>
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsModalOpen(false)}
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-8 space-y-6 scrollbar-hide"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-black text-gray-900">{editingPost?.id ? 'Edit Article' : 'New Article'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-900">
                    <Icons.X className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSavePost} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Title</label>
                      <input 
                        required
                        value={editingPost?.title || ''}
                        onChange={e => setEditingPost({ 
                          ...editingPost, 
                          title: e.target.value, 
                          slug: e.target.value
                            .toLowerCase()
                            .replace(/[^\w\s-]/g, '')
                            .replace(/\s+/g, '-')
                            .replace(/-+/g, '-') 
                        })}
                        placeholder="Article Title"
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Slug</label>
                      <input 
                        required
                        value={editingPost?.slug || ''}
                        onChange={e => setEditingPost({ ...editingPost, slug: e.target.value })}
                        placeholder="url-slug"
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Category</label>
                      <input 
                        value={editingPost?.category || ''}
                        onChange={e => setEditingPost({ ...editingPost, category: e.target.value })}
                        placeholder="e.g. Travel Tips"
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Author</label>
                      <input 
                        value={editingPost?.author || ''}
                        onChange={e => setEditingPost({ ...editingPost, author: e.target.value })}
                        placeholder="Author Name"
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Status</label>
                      <select 
                        value={editingPost?.status || 'draft'}
                        onChange={e => setEditingPost({ ...editingPost, status: e.target.value as any, publishedAt: e.target.value === 'published' ? (editingPost?.publishedAt || serverTimestamp()) : null })}
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all appearance-none"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Featured Image</label>
                    <div className="flex gap-4 items-center">
                      <div className="h-24 w-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl overflow-hidden relative group">
                        <img 
                          src={editingPost?.featuredImage || 'https://picsum.photos/seed/placeholder/800/600'} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <Icons.Upload className="h-6 w-6 text-white" />
                          <input 
                            type="file"
                            accept="image/*"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  const url = await uploadImage(file);
                                  setEditingPost({ ...editingPost, featuredImage: url });
                                } catch (err) {
                                  alert("Upload failed.");
                                }
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="flex-1 space-y-2">
                        <p className="text-[10px] font-bold text-gray-400">Past Image URL or Upload New</p>
                        <input 
                          value={editingPost?.featuredImage || ''}
                          onChange={e => setEditingPost({ ...editingPost, featuredImage: e.target.value })}
                          placeholder="https://..."
                          className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tags (Comma separated)</label>
                    <input 
                      value={editingPost?.tags?.join(', ') || ''}
                      onChange={e => setEditingPost({ ...editingPost, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                      placeholder="e.g. Travel, Bali, Adventure"
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Short Excerpt</label>
                    <textarea 
                      rows={2}
                      value={editingPost?.excerpt || ''}
                      onChange={e => setEditingPost({ ...editingPost, excerpt: e.target.value })}
                      placeholder="Brief summary for archive page..."
                      className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-medium text-sm focus:border-primary focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Content</label>
                    <RichTextEditor 
                      content={editingPost?.content || ''}
                      onChange={(html) => setEditingPost({ ...editingPost, content: html })}
                      placeholder="Start writing your article..."
                    />
                  </div>

                  <button type="submit" className="w-full bg-primary text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100">
                    Save Article
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const GuideManager = () => {
    const [guides, setGuides] = useState<Guide[]>([]);
    const [loading, setLoading] = useState(true);
    const [name, setName] = useState('');
    const [whatsapp, setWhatsapp] = useState('');
    const [editingGuide, setEditingGuide] = useState<Guide | null>(null);

    useEffect(() => {
      const q = query(collection(db, 'guides'), orderBy('name', 'asc'));
      const unsubscribe = onSnapshot(q, 
        (snapshot) => {
          setGuides(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Guide)));
          setLoading(false);
        },
        (error) => {
          console.error("Guide fetch error:", error);
          setLoading(false);
        }
      );
      return unsubscribe;
    }, []);

    const handleSubmit = async (e: FormEvent) => {
      e.preventDefault();
      try {
        if (editingGuide) {
          await updateDoc(doc(db, 'guides', editingGuide.id), {
            name,
            whatsapp,
          });
          setEditingGuide(null);
        } else {
          await addDoc(collection(db, 'guides'), {
            name,
            whatsapp,
            isActive: true
          });
        }
        setName('');
        setWhatsapp('');
      } catch (err) {
        console.error(err);
      }
    };

    const toggleActive = async (guide: Guide) => {
      await updateDoc(doc(db, 'guides', guide.id), { isActive: !guide.isActive });
    };

    const handleDelete = async (id: string) => {
      if (confirm("Delete this guide?")) {
        try {
          await deleteDoc(doc(db, 'guides', id));
          alert("Guide deleted successfully");
        } catch (error) {
          console.error("Delete failed", error);
          alert("Failed to delete guide. Check permissions.");
        }
      }
    };

    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Drivers & Guides</h2>
            <p className="text-gray-500 font-medium text-sm">Manage your field team and their contact details.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
            <input 
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Ketut Wijaya"
              className="w-full rounded-xl border border-gray-100 p-4 font-bold text-sm focus:border-primary outline-none transition-all bg-gray-50/50"
            />
          </div>
          <div className="flex-1 space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">WhatsApp Number</label>
            <input 
              required
              value={whatsapp}
              onChange={e => setWhatsapp(e.target.value)}
              placeholder="e.g. 628123456789"
              className="w-full rounded-xl border border-gray-100 p-4 font-bold text-sm focus:border-primary outline-none transition-all bg-gray-50/50"
            />
          </div>
          <div className="flex gap-2 self-end h-[58px]">
            <button type="submit" className="bg-primary text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all">
              {editingGuide ? 'Update' : 'Add'} Driver/Guide
            </button>
            {editingGuide && (
              <button 
                type="button" 
                onClick={() => {
                  setEditingGuide(null);
                  setName('');
                  setWhatsapp('');
                }} 
                className="bg-gray-100 text-gray-500 px-6 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {guides.map(guide => (
            <div key={guide.id} className="bg-white p-6 rounded-[20px] border border-gray-100 shadow-sm hover:border-primary/50 transition-all group">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-primary font-black border border-emerald-100">
                    {guide.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900">{guide.name}</h4>
                    <a 
                      href={`https://wa.me/${guide.whatsapp}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Phone className="h-3 w-3" /> +{guide.whatsapp}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => {
                        setEditingGuide(guide);
                        setName(guide.name);
                        setWhatsapp(guide.whatsapp);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 text-primary hover:bg-emerald-50 rounded-lg transition-all"
                      title="Edit"
                   >
                      <Icons.Edit2 className="h-4 w-4" />
                   </button>
                   <button 
                      onClick={() => toggleActive(guide)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        guide.isActive ? "text-emerald-600 bg-emerald-50 border border-emerald-100" : "text-gray-400 bg-gray-50 border border-gray-100"
                      )}
                      title={guide.isActive ? "Active" : "Inactive"}
                   >
                      <CheckCheck className="h-4 w-4" />
                   </button>
                   <button onClick={() => handleDelete(guide.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="h-4 w-4" />
                   </button>
                </div>
              </div>
            </div>
          ))}
          {guides.length === 0 && (
            <div className="col-span-full p-20 text-center bg-gray-50/50 rounded-[20px] border border-gray-100 border-dashed">
               <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">No guides or drivers registered yet.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const BookingManager = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    
    // New Sorting and Filtering State
    const [sortBy, setSortBy] = useState<'bookingDate' | 'participationDate'>('bookingDate');
    const [filterMonth, setFilterMonth] = useState<string>('all');
    const [filterYear, setFilterYear] = useState<string>(new Date().getFullYear().toString());
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
      const qBookings = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));

      const unsubBookings = onSnapshot(qBookings, 
        (snapshot) => {
          setBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
          setLoading(false);
        },
        (error) => {
          console.error("Booking fetch error:", error);
          setLoading(false);
        }
      );

      return () => {
        unsubBookings();
      };
    }, []);

    // Handlers moved to global (Admin) scope
  
    // Expanded Filtering Logic
    const filteredBookings = useMemo(() => {
      return bookings
        .filter(b => filterStatus === 'all' || b.status === filterStatus)
        .filter(b => {
          if (!searchQuery.trim()) return true;
          const q = searchQuery.toLowerCase();
          return (
            b.id.toLowerCase().includes(q) || 
            b.customerData.fullName.toLowerCase().includes(q) || 
            b.customerData.email.toLowerCase().includes(q) ||
            (b.tourTitle || '').toLowerCase().includes(q)
          );
        })
        .filter(b => {
          if (filterMonth === 'all') return true;
          try {
            const date = parseISO(b.date);
            return (date.getMonth() + 1).toString() === filterMonth && date.getFullYear().toString() === filterYear;
          } catch (e) { return true; }
        })
        .sort((a, b) => {
          if (sortBy === 'bookingDate') {
            const dateA = a.createdAt?.toDate() || new Date(0);
            const dateB = b.createdAt?.toDate() || new Date(0);
            return dateB.getTime() - dateA.getTime();
          } else {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateB.getTime() - dateA.getTime();
          }
        });
    }, [bookings, filterStatus, sortBy, filterMonth, filterYear]);
  
    if (loading) return <div className="flex justify-center p-20"><Icons.Loader2 className="animate-spin text-primary" /></div>;
  
    return (
      <div className="space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h2 className="text-3xl font-black text-gray-900 tracking-tight">Booking Management</h2>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-gray-500 font-medium">View and process tour reservations and payments.</p>
              <div className="h-8 w-px bg-gray-200 hidden md:block" />
              <div className="relative flex-1 max-w-md">
                <Icons.Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input 
                  type="text"
                  placeholder="Search by ID, Name, Email, or Tour..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-sm font-bold focus:border-primary focus:ring-0 outline-none transition-all shadow-sm"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <Icons.X className="h-3 w-3 text-gray-400" />
                  </button>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-center">
              {/* Month Filter */}
              <select 
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest outline-none focus:border-primary transition-all"
              >
                 <option value="all">All Months</option>
                 {Array.from({ length: 12 }, (_, i) => (
                   <option key={i + 1} value={(i + 1).toString()}>
                      {format(new Date(2000, i, 1), 'MMMM')}
                   </option>
                 ))}
              </select>

              {/* Year Filter */}
              <select 
                value={filterYear}
                onChange={(e) => setFilterYear(e.target.value)}
                className="bg-white border border-gray-100 rounded-xl px-4 py-2.5 text-xs font-black uppercase tracking-widest outline-none focus:border-primary transition-all"
              >
                 {['2024', '2025', '2026'].map(y => (
                   <option key={y} value={y}>{y}</option>
                 ))}
              </select>

              {/* Sort By */}
              <div className="h-10 w-[1px] bg-gray-100 hidden lg:block" />
              
              <div className="flex bg-gray-100 p-1 rounded-xl">
                 <button 
                   onClick={() => setSortBy('bookingDate')}
                   className={cn(
                     "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                     sortBy === 'bookingDate' ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                   )}
                 >
                    Booking Date
                 </button>
                 <button 
                   onClick={() => setSortBy('participationDate')}
                   className={cn(
                     "px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                     sortBy === 'participationDate' ? "bg-white text-primary shadow-sm" : "text-gray-400 hover:text-gray-600"
                   )}
                 >
                    Tour Date
                 </button>
              </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'confirmed', 'cancelled'].map(s => (
                <button 
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all",
                    filterStatus === s ? "bg-primary text-white shadow-lg shadow-emerald-100" : "bg-white text-gray-400 border border-gray-100 hover:border-primary"
                  )}
                >
                    {s}
                </button>
            ))}
        </div>
  
        <div className="bg-white rounded-[20px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">ID / Date</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Customer</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Tour / Package</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Amount / Method</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBookings.map(booking => (
                  <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors cursor-pointer group" onClick={() => { setGlobalSelectedBooking(booking); setOriginalBooking(booking); setIsBookingDetailOpen(true); }}>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[10px] font-bold text-gray-400 block tracking-tighter">#{booking.id.slice(-8).toUpperCase()}</span>
                      <span className="text-sm font-bold text-gray-900">{booking.date}</span>
                      {booking.time && <span className="text-[10px] text-primary font-black ml-2">{booking.time}</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-gray-900 block">{booking.customerData.fullName}</span>
                      <span className="text-xs text-gray-500 font-medium">{booking.customerData.email}</span>
                      {booking.customerData.nationality && (
                        <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded ml-2 font-bold">{booking.customerData.nationality}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-gray-900 block">{booking.tourTitle}</span>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-xs text-emerald-600 font-bold">{booking.packageName}</span>
                        {booking.assignedGuideName && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md w-fit">
                            <Icons.User className="h-3 w-3" />
                            <span className="text-[10px] font-black uppercase tracking-tight">{booking.assignedGuideName}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-primary block">{formatPrice(booking.totalAmount)}</span>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">{(booking.paymentMethod || 'unknown').replace('_', ' ')}</span>
                        {booking.paymentToken && <Tag className="h-2.5 w-2.5 text-secondary" />}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                        booking.status === 'confirmed' ? "bg-emerald-100 text-emerald-700" :
                        booking.status === 'cancelled' ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      )}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                         <button 
                            onClick={() => { setAssignBooking(booking); setIsAssignOpen(true); }}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Assign to Guide"
                         >
                            <Icons.Share2 className="h-4 w-4" />
                         </button>
                         {booking.status !== 'confirmed' && (
                           <button onClick={() => updateBookingStatus(booking.id, 'confirmed')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Confirm Payment">
                              <Icons.CheckCircle className="h-4 w-4" />
                           </button>
                         )}
                         <button onClick={() => { setGlobalSelectedBooking(booking); setOriginalBooking(booking); setIsBookingDetailOpen(true); }} className="p-2 text-gray-400 hover:text-primary rounded-lg transition-colors" title="View Details">
                            <Icons.ExternalLink className="h-4 w-4" />
                         </button>
                         {booking.status !== 'cancelled' && (
                           <button onClick={() => updateBookingStatus(booking.id, 'cancelled')} className="p-2 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Cancel Booking">
                              <Icons.XCircle className="h-4 w-4" />
                           </button>
                         )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBookings.length === 0 && (
              <div className="p-20 text-center text-gray-400 font-bold uppercase text-xs tracking-widest">
                No bookings found for this filter.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const menuItems: { id: string; label: string; icon: any; children?: { id: MenuId | string; label: string }[] }[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: Layout,
    },
    { 
      id: 'overview', 
      label: 'Performance', 
      icon: LayoutGrid,
      children: [
        { id: 'analytics', label: 'Analytics' }
      ]
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: Map,
      children: [
        { id: 'all-tours', label: 'All Tours' },
        { id: 'tours', label: 'Add New Tour' },
        { id: 'categories', label: 'Categories' },
        { id: 'locations', label: 'Location Zones' },
        { id: 'addons', label: 'Global Add-ons' },
        { id: 'urgency-points', label: 'Urgency Features' },
        { id: 'coupons', label: 'Coupons' }
      ]
    },
    { 
      id: 'operations', 
      label: 'Operations', 
      icon: Briefcase,
      children: [
        { id: 'bookings', label: 'Manage Bookings' },
        { id: 'schedule', label: 'Calendar' },
        { id: 'guides', label: 'Guides/Drivers' },
        { id: 'timeslots', label: 'Time Slots' }
      ]
    },
    { 
      id: 'content', 
      label: 'Content', 
      icon: FileText,
      children: [
        { id: 'blog', label: 'Travel Blog' },
        { id: 'pages', label: 'Static Pages' },
        { id: 'reviews', label: 'Reviews' },
        { id: 'popups-manager', label: 'Popups' }
      ]
    },
    { 
      id: 'settings-group', 
      label: 'Settings', 
      icon: Settings,
      children: [
        { id: 'payment-settings', label: 'Payments' },
        { id: 'communication', label: 'Communication' },
        { id: 'users', label: 'User Roles' },
        { id: 'general-settings', label: 'General' }
      ]
    }
  ];

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 bg-white border-r border-gray-100 transition-all duration-300 shadow-sm",
          isSidebarOpen ? "w-72" : "w-20"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center gap-3">
            <div className="bg-primary h-10 w-10 rounded-[10px] flex items-center justify-center shrink-0">
              <span className="text-white font-black text-xl tracking-tighter">BA</span>
            </div>
            {isSidebarOpen && (
              <span className="font-black text-gray-900 tracking-tight text-lg truncate">Admin Admin</span>
            )}
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto mt-4 scrollbar-hide">
            {menuItems.map((item) => {
              const isActive = activeMenu === item.id;
              const isChildActive = item.children?.some(c => activeMenu === c.id);
              const isExpanded = expandedMenu === item.id;

              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                        if (item.children) {
                            setExpandedMenu(isExpanded ? null : item.id);
                        } else {
                            setActiveMenu(item.id as MenuId);
                            setExpandedMenu(null);
                        }
                        if (item.id === 'tours') setActiveTab('basic');
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-[10px] transition-all group",
                      isActive || isChildActive
                        ? "bg-emerald-50 text-primary" 
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5", isActive || isChildActive ? "text-primary" : "text-gray-400 group-hover:text-gray-900")} />
                    {isSidebarOpen && <span className="font-bold text-sm tracking-tight">{item.label}</span>}
                    {isSidebarOpen && item.children && (
                        <ChevronDown className={cn("ml-auto h-4 w-4 opacity-50 transition-transform", isExpanded && "rotate-180")} />
                    )}
                  </button>
                  {isSidebarOpen && isExpanded && item.children && (
                    <div className="ml-9 space-y-1">
                      {item.children.map((child) => (
                        <button
                          key={child.id}
                          onClick={() => {
                            if (child.id === 'tours') {
                                resetForm();
                                setActiveMenu('tours');
                            } else {
                                setActiveMenu(child.id as MenuId);
                            }
                          }}
                          className={cn(
                            "w-full text-left px-4 py-2 text-xs font-bold transition-colors",
                            activeMenu === child.id ? "text-primary bg-emerald-50/50 rounded-lg" : "text-gray-400 hover:text-primary"
                          )}
                        >
                          {child.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-6 border-t border-gray-50 text-gray-400 hover:text-gray-900 transition-colors flex justify-center"
          >
            {isSidebarOpen ? <ChevronRight className="h-5 w-5 rotate-180" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={cn(
        "flex-1 transition-all duration-300 min-h-screen",
        isSidebarOpen ? "pl-72" : "pl-20"
      )}>
        {/* Dynamic Header */}
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex items-center justify-between">
           <div>
              <h2 className="text-xl font-black tracking-tight text-gray-900">
                {menuItems.find(m => m.id === activeMenu)?.label || 
                 menuItems.flatMap(m => m.children || []).find(c => (c as any).id === activeMenu)?.label}
              </h2>
           </div>
           <div className="flex items-center gap-4">
              <button 
                onClick={seedDummyData} 
                className="flex items-center gap-2 px-4 py-2 rounded-[10px] bg-amber-50 text-amber-700 text-xs font-black hover:bg-amber-100 transition-all border border-amber-100"
              >
                <Database className="h-4 w-4" /> Seed
              </button>
              <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden">
                <img src={auth.currentUser?.photoURL || ''} className="h-full w-full object-cover" />
              </div>
           </div>
        </header>

        <div className="p-8">
          {/* Dashboard View */}
          {activeMenu === 'dashboard' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {[
                   { label: 'Active Tours', value: tours.length, icon: Map, color: 'emerald' },
                   { label: 'Total Bookings', value: bookings.length, icon: Clock, color: 'blue' },
                   { label: 'Monthly Revenue', value: `$${bookings.reduce((sum, b) => {
                     // Simple estimate: total sum of all bookings
                     return sum + (b.totalAmount || 0);
                   }, 0).toLocaleString('en-US', { notation: 'compact' })}`, icon: DollarSign, color: 'orange' },
                   { label: 'Avg Rating', value: '4.9', icon: MessageSquare, color: 'amber' }
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-6 rounded-[10px] border border-gray-100 shadow-sm flex items-center gap-4">
                      <div className={cn(
                        "h-12 w-12 rounded-[10px] flex items-center justify-center",
                        stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                        stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                        stat.color === 'orange' ? "bg-orange-50 text-orange-600" :
                        "bg-amber-50 text-amber-600"
                      )}>
                        <stat.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-gray-400">{stat.label}</p>
                        <p className="text-2xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                      </div>
                   </div>
                 ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-8">
                    {/* Scheduled Tours Section */}
                    <div className="bg-white rounded-[10px] border border-gray-100 p-8 shadow-sm">
                       <div className="flex items-center justify-between mb-8">
                         <div>
                            <h3 className="font-black tracking-tight text-gray-900">Scheduled Tours</h3>
                            <p className="text-xs font-bold text-gray-400">Scheduled for today and tomorrow</p>
                         </div>
                         <CalendarIcon className="h-5 w-5 text-gray-400" />
                       </div>
                       
                       <div className="space-y-4">
                          {(() => {
                             const today = format(new Date(), 'yyyy-MM-dd');
                             const tom = format(addDays(new Date(), 1), 'yyyy-MM-dd');
                             
                             const scheduledBookings = bookings.filter(b => b.date === today || b.date === tom);
                             
                             if (scheduledBookings.length === 0) {
                                return <p className="text-sm text-gray-400 text-center py-8">No tours scheduled for today or tomorrow.</p>
                             }

                             return scheduledBookings.map((booking, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 group hover:border-primary transition-all">
                                   <div className="flex items-center gap-4">
                                      <div className={cn(
                                         "h-10 w-10 rounded-lg flex items-center justify-center font-black text-xs",
                                         booking.date === today ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
                                      )}>
                                         {booking.date === today ? 'TODAY' : 'TOM'}
                                      </div>
                                      <div>
                                         <p className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">{booking.tourTitle}</p>
                                         <p className="text-xs text-gray-400 font-bold">{booking.customerData.fullName} • {booking.participants.adults + booking.participants.children} Pax</p>
                                      </div>
                                   </div>
                                   <div className="text-right">
                                      <p className="font-black text-gray-900 text-sm">{booking.timeSlot || booking.time || 'TBA'}</p>
                                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{booking.status}</p>
                                   </div>
                                </div>
                             ));
                          })()}
                       </div>
                    </div>

                    <div className="bg-white rounded-[10px] border border-gray-100 p-8 shadow-sm h-96">
                       <div className="flex items-center justify-between mb-8">
                         <h3 className="font-black tracking-tight text-gray-900">Revenue Analytics</h3>
                         <TrendingUp className="h-5 w-5 text-gray-400" />
                       </div>
                       <div className="flex items-end justify-between h-56 gap-2">
                          {[40, 70, 45, 90, 65, 80, 50, 60, 85, 45, 75, 95].map((h, i) => (
                            <div key={i} className="flex-1 bg-emerald-100 rounded-t-sm hover:bg-primary transition-colors cursor-pointer group relative" style={{ height: `${h}%` }}>
                               <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[8px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                  ${h}k
                               </div>
                            </div>
                          ))}
                       </div>
                       <div className="flex justify-between mt-4 text-[10px] font-black text-gray-400">
                          <span>Jan</span>
                          <span>Jun</span>
                          <span>Dec</span>
                       </div>
                    </div>
                 </div>
                 <div className="bg-white rounded-[10px] border border-gray-100 p-8 shadow-sm flex flex-col justify-between">
                    <div>
                      <h3 className="font-black tracking-tight text-gray-900 mb-6">Popular Tours</h3>
                      <div className="space-y-6">
                         {tours.slice(0, 3).map((tour, i) => (
                           <div key={i} className="flex items-center gap-4">
                              <img src={tour.gallery[0] || ''} className="h-12 w-12 rounded-[8px] object-cover" />
                              <div className="flex-1 overflow-hidden">
                                <p className="font-bold text-sm text-gray-900 truncate">{tour.title}</p>
                                <p className="text-[10px] font-bold text-emerald-600">34 Bookings</p>
                              </div>
                           </div>
                         ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => setActiveMenu('schedule')}
                      className="w-full mt-8 py-3 rounded-[10px] bg-emerald-600 text-white font-black text-[10px] hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <CalendarIcon className="h-3 w-3" /> View Schedule Calendar
                    </button>
                 </div>
              </div>
            </div>
          )}

          {/* Tour List View */}
          {activeMenu === 'all-tours' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-4xl font-black text-gray-900 tracking-tight">Tour Catalog</h1>
                  <p className="text-gray-500 font-medium">Manage and monitor all your live adventures.</p>
                </div>
                <button onClick={() => { resetForm(); setActiveMenu('tours'); }} className="bg-primary text-white px-6 py-3 rounded-[10px] font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-200">
                  <Plus className="h-4 w-4" /> Add New Tour
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tours.map(tour => (
                  <div key={tour.id} className="group relative overflow-hidden rounded-[10px] border border-gray-100 bg-white transition-all hover:shadow-2xl">
                    <div className="aspect-[4/3] w-full overflow-hidden relative">
                      <img 
                        src={tour.gallery?.[0] || "https://picsum.photos/seed/placeholder/400/300"} 
                        alt="" 
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                        <button onClick={() => handleCloneTour(tour)} className="p-3 bg-white/90 backdrop-blur rounded-[10px] text-emerald-600 shadow-xl hover:bg-emerald-600 hover:text-white transition-all" title="Clone Tour">
                          <Copy className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleEdit(tour)} className="p-3 bg-white/90 backdrop-blur rounded-[10px] text-blue-600 shadow-xl hover:bg-blue-600 hover:text-white transition-all" title="Edit Tour">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(tour.id)} className="p-3 bg-white/90 backdrop-blur rounded-[10px] text-red-600 shadow-xl hover:bg-red-600 hover:text-white transition-all" title="Delete Tour">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full">
                          {categories.find(c => c.id === tour.categoryId)?.name || 'General'}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-gray-900 text-lg group-hover:text-primary transition-colors line-clamp-1">{tour.title}</h3>
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-50">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-gray-400 tracking-tighter">Starts From</span>
                           <span className="text-xl font-black text-primary tracking-tight">${tour.discountPrice || tour.regularPrice}</span>
                        </div>
                        <div className="text-right">
                           <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter block">Duration</span>
                           <span className="text-sm font-black text-gray-900">{tour.duration}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meta Management (Categories, Types, Locations) */}
          {activeMenu === 'analytics' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <AnalyticsManager bookings={bookings} tours={tours} />
            </div>
          )}
          {['categories', 'tour-types', 'locations'].includes(activeMenu) && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
               <MetaManager 
                 type={activeMenu as 'categories' | 'tour-types' | 'locations'}
                 items={
                   activeMenu === 'categories' ? categories : 
                   activeMenu === 'tour-types' ? tourTypes : 
                   locations
                 }
               />
            </div>
          )}
          {activeMenu === 'addons' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <AddOnManager items={globalAddOns} />
             </div>
          )}
          {activeMenu === 'bookings' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <BookingManager />
            </div>
          )}
          {activeMenu === 'guides' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <GuideManager />
            </div>
          )}
          {activeMenu === 'schedule' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
               <ScheduleCalendar />
            </div>
          )}
          {activeMenu === 'coupons' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <CouponManager items={coupons} />
             </div>
          )}
          {activeMenu === 'pages' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <PageManager />
             </div>
          )}
          {activeMenu === 'blog' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
               <BlogManager />
            </div>
          )}
          {activeMenu === 'users' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
               <UserManager />
            </div>
          )}
          {activeMenu === 'urgency-points' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <UrgencyPointManager items={urgencyPoints} />
             </div>
          )}
          {activeMenu === 'reviews' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <ReviewManager />
            </div>
          )}
          {activeMenu === 'communication' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <CommunicationManager />
            </div>
          )}
          {activeMenu === 'payment-settings' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <PaymentManager />
             </div>
          )}
          {activeMenu === 'general-settings' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <GeneralSettings />
             </div>
          )}
          {activeMenu === 'popups-manager' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <PopupManager />
             </div>
          )}
          {activeMenu === 'timeslots' && (
             <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                <BookingTimeManager />
             </div>
          )}
          {/* Add/Edit Tour View */}
          {activeMenu === 'tours' && (
            <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-[10px] border border-gray-100">
                <div className="flex gap-2">
                  <button onClick={() => { setActiveTab('basic'); setEditingId(null); }} className={cn("px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg transition-all", !editingId ? "bg-primary text-white" : "text-gray-400 hover:bg-gray-50")}>+ Add New Tour</button>
                  <button onClick={() => setActiveMenu('all-tours')} className="px-4 py-2 text-xs font-black uppercase tracking-widest rounded-lg text-gray-400 hover:bg-gray-50 flex items-center gap-2">
                    <List className="h-4 w-4" /> View Tour List
                  </button>
                </div>
                {editingId && (
                  <button onClick={resetForm} className="text-red-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-lg">
                    <X className="h-4 w-4" /> Cancel Editing
                  </button>
                )}
              </div>

              <div className="bg-white rounded-[10px] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-100 bg-gray-50/50">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-widest transition-all",
                    activeTab === tab.id 
                      ? "bg-white text-primary border-b-2 border-primary" 
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Basic Info Tab */}
              {activeTab === 'basic' && (
                <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Tour Title</label>
                        <input
                        required
                        placeholder="e.g. Bali Tropical Jungle Trek"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Tour Slug (URL)</label>
                        <input
                        required
                        placeholder="bali-tropical-jungle-trek"
                        value={formData.slug}
                        onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all bg-gray-50"
                        />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Detailed Location</label>
                      <input
                        required
                        placeholder="e.g. Ubud, Bali"
                        value={formData.location}
                        onChange={e => setFormData({ ...formData, location: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">Duration</label>
                      <input
                        required
                        placeholder="e.g. 5 Days / 4 Nights"
                        value={formData.duration}
                        onChange={e => setFormData({ ...formData, duration: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-black text-gray-900 border-l-4 border-primary pl-4">Urgency Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {urgencyPoints.map(point => (
                        <label 
                          key={point.id}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer",
                            formData.urgencyPointIds?.includes(point.id) ? "border-primary bg-emerald-50/10" : "border-gray-50 bg-gray-50/30 hover:border-emerald-100"
                          )}
                        >
                          <input 
                            type="checkbox"
                            className="hidden"
                            checked={formData.urgencyPointIds?.includes(point.id) || false}
                            onChange={(e) => {
                              const ids = formData.urgencyPointIds || [];
                              setFormData({
                                ...formData,
                                urgencyPointIds: e.target.checked ? [...ids, point.id] : ids.filter(id => id !== point.id)
                              });
                            }}
                          />
                          <div className={cn(
                            "h-5 w-5 rounded border-2 transition-all flex items-center justify-center mt-0.5",
                            formData.urgencyPointIds?.includes(point.id) ? "bg-primary border-primary text-white" : "border-gray-300"
                          )}>
                            {formData.urgencyPointIds?.includes(point.id) && <Check className="h-3 w-3" />}
                          </div>
                      <div>
                        <p className="font-bold text-sm text-gray-900">{point.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{point.description}</p>
                      </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4 pt-4">
                    <h3 className="text-sm font-black text-gray-900 border-l-4 border-primary pl-4">Available Time Slots</h3>
                    <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {TIME_SLOTS.map(time => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => {
                              const slots = formData.timeSlots || [];
                              setFormData({
                                ...formData,
                                timeSlots: slots.includes(time) ? slots.filter(s => s !== time) : [...slots, time].sort()
                              });
                            }}
                            className={cn(
                              "py-2 rounded-lg text-[10px] font-bold border transition-all",
                              formData.timeSlots?.includes(time) ? "bg-primary text-white border-primary shadow-sm" : "bg-white text-gray-500 border-gray-100 hover:border-emerald-200"
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <CheckCircle className="h-3 w-3 text-primary" />
                        <span className="text-[10px] font-bold text-gray-500">
                          {formData.timeSlots?.length || 0} time slot(s) selected
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 pt-4 border-t border-gray-50 mt-4">
                    <div className="space-y-2">
                      <label className="text-sm font-black text-primary text-[10px]">Category</label>
                      <select 
                        value={formData.categoryId}
                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none bg-white text-sm font-bold"
                      >
                        <option value="">Select Category</option>
                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-primary text-[10px]">Tour Type</label>
                      <select 
                        value={formData.tourTypeId}
                        onChange={e => setFormData({ ...formData, tourTypeId: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none bg-white text-sm font-bold"
                      >
                        <option value="">Select Type</option>
                        {tourTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-black text-primary text-[10px]">Location Zone</label>
                      <select 
                        value={formData.locationId}
                        onChange={e => setFormData({ ...formData, locationId: e.target.value })}
                        className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none bg-white text-sm font-bold"
                      >
                        <option value="">Select Zone</option>
                        {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Description</label>
                    <textarea
                      required
                      rows={6}
                      placeholder="A compelling story about this tour..."
                      value={formData.description}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Highlights & Gallery Tab */}
              {activeTab === 'content' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                      <Layout className="h-4 w-4 text-primary" /> Tour Highlights (One per line)
                    </label>
                    <textarea
                      rows={8}
                      placeholder="Visit sacred temples&#10;Sunset dinner on the beach&#10;Private jungle trek..."
                      value={highlightsText}
                      onChange={e => setHighlightsText(e.target.value)}
                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 font-medium focus:border-primary focus:outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-4 pt-6 border-t border-gray-50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-gray-900 border-l-4 border-blue-600 pl-3">Gallery (Select Featured Image)</h3>
                      <div className="relative">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFileUpload}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          disabled={isUploading}
                        />
                        <button type="button" className="text-blue-600 text-sm font-bold flex items-center gap-1 py-1 px-3 bg-blue-50 rounded-lg">
                          {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                          Upload More Images
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                       {formData.gallery?.map((url, i) => {
                        const isFeatured = formData.featuredImage === url;
                        return (
                          <div key={i} className={cn("relative aspect-square overflow-hidden rounded-[10px] bg-gray-100 group border-2 transition-all", isFeatured ? "border-primary ring-4 ring-emerald-50" : "border-gray-100")}>
                            <img src={url} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                               <button 
                                 type="button"
                                 onClick={() => setFormData({ ...formData, featuredImage: url })}
                                 className="px-3 py-1 bg-white text-gray-900 text-xs font-black uppercase rounded-[5px] hover:bg-primary hover:text-white transition-all"
                               >
                                 {isFeatured ? 'Featured' : 'Set Featured'}
                               </button>
                               <button 
                                type="button" 
                                onClick={() => {
                                  if (isFeatured) setFormData({ ...formData, featuredImage: '' });
                                  removeArrayItem('gallery', i);
                                }} 
                                className="px-3 py-1 bg-red-600 text-white text-xs font-black uppercase rounded-[5px] hover:bg-red-700 transition-all"
                              >
                                Delete
                              </button>
                            </div>
                            {isFeatured && (
                              <div className="absolute top-2 left-2 bg-primary text-white p-1 rounded-full shadow-lg">
                                <Star className="h-3 w-3 fill-current" />
                              </div>
                            )}
                          </div>
                        );
                       })}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500">Map Embed URL (iframe src)</label>
                    <input
                      placeholder="https://google.com/maps/embed/..."
                      value={formData.locationMapUrl}
                      onChange={e => setFormData({ ...formData, locationMapUrl: e.target.value })}
                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 focus:border-primary focus:outline-none transition-all"
                    />
                  </div>
                </div>
              )}

               {/* Inclusions & Exclusions Tab */}
              {activeTab === 'inclusions' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                   <div className="space-y-4">
                    <label className="text-sm font-bold text-emerald-600 flex items-center gap-2 uppercase tracking-tight text-[10px]">
                      <CheckCircle className="h-4 w-4" /> General Inclusions (One per line)
                    </label>
                    <textarea 
                      rows={8}
                      value={inclusionsText}
                      onChange={e => setInclusionsText(e.target.value)}
                      placeholder="e.g. Safety Equipment&#10;Professional Guide"
                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 text-sm focus:border-primary focus:outline-none font-medium min-h-[150px]"
                    />
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-bold text-red-600 flex items-center gap-2 uppercase tracking-tight text-[10px]">
                      <X className="h-4 w-4" /> General Exclusions (One per line)
                    </label>
                    <textarea 
                      rows={8}
                      value={exclusionsText}
                      onChange={e => setExclusionsText(e.target.value)}
                      placeholder="e.g. Personal Expenses&#10;Gratuities"
                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 text-sm focus:border-red-400 focus:outline-none font-medium min-h-[150px]"
                    />
                  </div>
                </div>
              )}

              {/* Pricing Tab */}
              {activeTab === 'pricing' && (
                <div className="space-y-12 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="grid md:grid-cols-2 gap-6 p-6 bg-gray-50 rounded-[10px] border-2 border-dashed border-gray-200">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-gray-500">Display Price (Starts From)</label>
                      <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          required
                          value={formData.regularPrice || ''}
                          onChange={e => setFormData({ ...formData, regularPrice: Number(e.target.value) })}
                          className="w-full rounded-[10px] border-2 border-white bg-white p-4 pl-12 text-2xl font-black text-primary shadow-sm focus:border-primary focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-xs font-semibold text-gray-500">Discount Info (Optional)</label>
                       <div className="relative">
                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          value={formData.discountPrice || ''}
                          onChange={e => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                          className="w-full rounded-[10px] border-2 border-white bg-white p-4 pl-12 text-2xl font-black text-secondary shadow-sm focus:border-secondary focus:outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Complex Packages Section */}
                  <div className="space-y-8">
                     <div className="flex items-center justify-between">
                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Tiered Pricing Packages</h3>
                        <button 
                          type="button" 
                          onClick={() => addArrayItem('packages', { name: '', inclusions: [], exclusions: [], tiers: [{ minParticipants: 1, maxParticipants: 1, adultPrice: 0, childPrice: 0 }] })} 
                          className="flex items-center gap-2 rounded-[10px] bg-primary px-6 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all"
                        >
                          <PlusCircle className="h-4 w-4" /> New Package
                        </button>
                    </div>

                    <div className="space-y-12">
                      {formData.packages?.map((pkg, pIdx) => (
                        <div key={pIdx} className="relative rounded-[15px] border-2 border-gray-100 bg-white shadow-sm group overflow-hidden transition-all hover:border-emerald-100">
                          <div 
                            className="p-5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100/50 transition-colors" 
                            onClick={() => setExpandedPackages(prev => prev.includes(pIdx) ? prev.filter(i => i !== pIdx) : [...prev, pIdx])}
                          >
                             <div className="flex items-center gap-4">
                                <div className={cn(
                                  "h-10 w-10 rounded-xl flex items-center justify-center font-black transition-all shadow-sm",
                                  expandedPackages.includes(pIdx) ? "bg-primary text-white scale-110" : "bg-white text-gray-400 border border-gray-100"
                                )}>
                                   {pIdx + 1}
                                </div>
                                <div>
                                   <h4 className="font-black text-gray-900 tracking-tight">{pkg.name || `Unnamed Package`}</h4>
                                   {pkg.tiers && pkg.tiers.length > 0 && !expandedPackages.includes(pIdx) && (
                                     <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-0.5">
                                       {pkg.tiers.length} Pricing {pkg.tiers.length === 1 ? 'Tier' : 'Tiers'}
                                     </p>
                                   )}
                                </div>
                             </div>
                             <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                   <button 
                                     type="button" 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       const clonedPkg = { ...pkg, name: `${pkg.name} (Copy)` };
                                       const currentPackages = [...(formData.packages || [])];
                                       currentPackages.splice(pIdx + 1, 0, clonedPkg);
                                       setFormData({ ...formData, packages: currentPackages });
                                       setExpandedPackages(prev => [...prev.map(i => i > pIdx ? i + 1 : i), pIdx + 1]);
                                     }}
                                     className="p-2 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                                     title="Clone Package"
                                   >
                                     <Copy className="h-5 w-5" />
                                   </button>
                                   <button 
                                     type="button" 
                                     onClick={(e) => { e.stopPropagation(); removeArrayItem('packages', pIdx); }}
                                     className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                     title="Delete Package"
                                   >
                                     <Trash2 className="h-5 w-5" />
                                   </button>
                                </div>
                                <div className="w-px h-6 bg-gray-200 mx-1" />
                                <ChevronDown className={cn("h-6 w-6 text-gray-400 transition-transform duration-500", expandedPackages.includes(pIdx) && "rotate-180")} />
                             </div>
                          </div>

                          {expandedPackages.includes(pIdx) && (
                            <div className="p-8 space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
                              {/* Package Header */}
                              <div className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Package Name</label>
                                    <input
                                      value={pkg.name}
                                      onChange={e => {
                                        const newPkg = { ...pkg, name: e.target.value };
                                        updateArrayItem('packages', pIdx, newPkg);
                                      }}
                                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 font-bold text-primary focus:border-primary focus:outline-none transition-all"
                                      placeholder="e.g. Silver Package"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Package Details / Intro</label>
                                    <input
                                      value={pkg.details || ''}
                                      onChange={e => {
                                        const newPkg = { ...pkg, details: e.target.value };
                                        updateArrayItem('packages', pIdx, newPkg);
                                      }}
                                      className="w-full rounded-[10px] border-2 border-gray-100 p-4 font-medium text-sm focus:border-primary focus:outline-none transition-all"
                                      placeholder="A brief explanation of this package option..."
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Tiers Table */}
                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Pricing Tiers</h4>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      const newPkg = { ...pkg, tiers: [...pkg.tiers, { minParticipants: 1, maxParticipants: 1, adultPrice: 0, childPrice: 0 }] };
                                      updateArrayItem('packages', pIdx, newPkg);
                                    }}
                                    className="text-xs font-bold text-primary hover:bg-emerald-50 px-3 py-1.5 rounded-lg transition-all"
                                  >
                                    + Add Tier
                                  </button>
                                </div>
                                <div className="overflow-hidden rounded-[15px] border border-gray-100 shadow-sm">
                                  <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                      <tr>
                                        <th className="px-6 py-4">Min Pax</th>
                                        <th className="px-6 py-4">Max Pax</th>
                                        <th className="px-6 py-4">Adult ($)</th>
                                        <th className="px-6 py-4">Child ($)</th>
                                        <th className="px-6 py-4"></th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                      {pkg.tiers.map((tier, tIdx) => (
                                        <tr key={tIdx} className="hover:bg-gray-50/50 transition-colors">
                                          <td className="px-6 py-4">
                                            <input 
                                              type="number" 
                                              value={tier.minParticipants} 
                                              onChange={e => {
                                                const newTiers = [...pkg.tiers];
                                                newTiers[tIdx] = { ...tier, minParticipants: Number(e.target.value) };
                                                updateArrayItem('packages', pIdx, { ...pkg, tiers: newTiers });
                                              }}
                                              className="w-16 rounded-[8px] border-2 border-gray-50 p-2 font-bold text-center focus:border-primary focus:outline-none" 
                                            />
                                          </td>
                                          <td className="px-6 py-4">
                                            <input 
                                              type="number" 
                                              value={tier.maxParticipants} 
                                              onChange={e => {
                                                const newTiers = [...pkg.tiers];
                                                newTiers[tIdx] = { ...tier, maxParticipants: Number(e.target.value) };
                                                updateArrayItem('packages', pIdx, { ...pkg, tiers: newTiers });
                                              }}
                                              className="w-16 rounded-[8px] border-2 border-gray-50 p-2 font-bold text-center focus:border-primary focus:outline-none" 
                                            />
                                          </td>
                                          <td className="px-6 py-4">
                                            <input 
                                              type="number" 
                                              value={tier.adultPrice} 
                                              onChange={e => {
                                                const newTiers = [...pkg.tiers];
                                                newTiers[tIdx] = { ...tier, adultPrice: Number(e.target.value) };
                                                updateArrayItem('packages', pIdx, { ...pkg, tiers: newTiers });
                                              }}
                                              className="w-24 rounded-[8px] border-2 border-gray-50 p-2 font-black text-primary focus:border-primary focus:outline-none" 
                                            />
                                          </td>
                                          <td className="px-6 py-4">
                                            <input 
                                              type="number" 
                                              value={tier.childPrice} 
                                              onChange={e => {
                                                const newTiers = [...pkg.tiers];
                                                newTiers[tIdx] = { ...tier, childPrice: Number(e.target.value) };
                                                updateArrayItem('packages', pIdx, { ...pkg, tiers: newTiers });
                                              }}
                                              className="w-24 rounded-[8px] border-2 border-gray-50 p-2 font-black text-secondary focus:border-secondary focus:outline-none" 
                                            />
                                          </td>
                                          <td className="px-6 py-4">
                                            <button 
                                              type="button" 
                                              onClick={() => {
                                                const newTiers = [...pkg.tiers];
                                                newTiers.splice(tIdx, 1);
                                                updateArrayItem('packages', pIdx, { ...pkg, tiers: newTiers });
                                              }}
                                              className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                              <MinusCircle className="h-4 w-4" />
                                            </button>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              {/* Package Inclusions/Exclusions */}
                              <div className="grid md:grid-cols-2 gap-8 pt-6 border-t border-gray-50">
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inclusions (One per line)</label>
                                   <textarea 
                                     rows={5}
                                     placeholder="e.g. Hotel pickup&#10;Mineral water"
                                     value={(pkg.inclusions || []).join('\n')}
                                     onChange={e => {
                                       updateArrayItem('packages', pIdx, { ...pkg, inclusions: e.target.value.split('\n') });
                                     }}
                                     className="w-full rounded-xl border-2 border-gray-50 p-4 text-xs font-medium focus:border-primary focus:outline-none min-h-[120px] bg-gray-50/30"
                                   />
                                </div>
                                <div className="space-y-4">
                                   <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exclusions (One per line)</label>
                                   <textarea 
                                     rows={5}
                                     placeholder="e.g. Lunch&#10;Gratuities"
                                     value={(pkg.exclusions || []).join('\n')}
                                     onChange={e => {
                                       updateArrayItem('packages', pIdx, { ...pkg, exclusions: e.target.value.split('\n') });
                                     }}
                                     className="w-full rounded-xl border-2 border-gray-50 p-4 text-xs font-medium focus:border-amber-200 focus:outline-none min-h-[120px] bg-gray-50/30"
                                   />
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Itinerary Tab */}
              {activeTab === 'itinerary' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 border-l-4 border-blue-600 pl-3 uppercase tracking-wider text-sm">Day-by-Day Journey</h3>
                    <button type="button" onClick={() => addArrayItem('itinerary', { day: (formData.itinerary?.length || 0) + 1, title: '', description: '' })} className="font-bold text-blue-600 flex items-center gap-2">
                       <PlusCircle className="h-5 w-5" /> Add New Day
                    </button>
                  </div>
                   <div className="space-y-6">
                    {formData.itinerary?.map((item, i) => (
                      <div key={i} className="group relative border-2 border-gray-100 rounded-[15px] transition-all bg-white shadow-sm overflow-hidden hover:border-blue-100">
                        <div 
                          className="p-5 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between cursor-pointer hover:bg-gray-100/50 transition-colors"
                          onClick={() => setExpandedItinerary(prev => prev.includes(i) ? prev.filter(idx => idx !== i) : [...prev, i])}
                        >
                           <div className="flex items-center gap-4">
                              <div className={cn(
                                "h-10 w-10 rounded-full flex items-center justify-center font-black transition-all shadow-sm",
                                expandedItinerary.includes(i) ? "bg-blue-600 text-white scale-110" : "bg-white text-gray-400 border border-gray-100"
                              )}>
                                 {item.day}
                              </div>
                              <div>
                                 <h4 className="font-black text-gray-900 tracking-tight">{item.title || `Day ${item.day}`}</h4>
                                 {!expandedItinerary.includes(i) && item.description && (
                                   <p className="text-[10px] font-bold text-gray-400 line-clamp-1 mt-0.5">{item.description}</p>
                                 )}
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <button 
                                type="button" 
                                onClick={(e) => { e.stopPropagation(); removeArrayItem('itinerary', i); }} 
                                className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Delete Day"
                              >
                                 <Trash2 className="h-5 w-5"/>
                              </button>
                              <div className="w-px h-6 bg-gray-200 mx-1" />
                              <ChevronDown className={cn("h-6 w-6 text-gray-400 transition-transform duration-500", expandedItinerary.includes(i) && "rotate-180")} />
                           </div>
                        </div>

                        {expandedItinerary.includes(i) && (
                          <div className="p-8 space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-top-2">
                            <input 
                              placeholder="Day Title (e.g. Arrival & Discovery)"
                              value={item.title} 
                              onChange={e => updateArrayItem('itinerary', i, { ...item, title: e.target.value })}
                              className="w-full font-black text-2xl mb-1 border-none focus:ring-0 p-0 text-gray-900 placeholder:text-gray-200"
                            />
                            
                            <div className="space-y-4 pt-4 border-t border-gray-50">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arrival / Pick-up Details</label>
                              <div className="flex gap-6 items-start">
                                <div className="flex-1 bg-gray-50/50 p-4 rounded-xl border-2 border-gray-50 focus-within:border-blue-200 focus-within:bg-white transition-all">
                                  <input 
                                    placeholder="Pick Up details (e.g. 08:30 AM at Hotel Lobby)"
                                    value={typeof item.pickup === 'object' ? item.pickup?.description : item.pickup || ''} 
                                    onChange={e => updateArrayItem('itinerary', i, { 
                                      ...item, 
                                      pickup: { ...(typeof item.pickup === 'object' ? item.pickup : {}), description: e.target.value } 
                                    })}
                                    className="w-full text-sm font-bold text-blue-600 bg-transparent border-none focus:ring-0 p-0 placeholder:text-blue-200"
                                  />
                                </div>
                                <div className="w-32 aspect-video rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 overflow-hidden relative group shadow-inner">
                                   {typeof item.pickup === 'object' && item.pickup?.image ? (
                                     <>
                                       <img src={item.pickup.image} className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                          <button type="button" onClick={() => updateArrayItem('itinerary', i, { ...item, pickup: { ...item.pickup, image: '' } })} className="bg-red-600 text-white p-2 rounded-full transform hover:scale-110 transition-transform"><Trash2 className="h-4 w-4" /></button>
                                       </div>
                                     </>
                                   ) : (
                                     <div className="h-full w-full flex items-center justify-center relative cursor-pointer hover:bg-gray-100 transition-colors">
                                       <ImageIcon className="h-6 w-6 text-gray-300" />
                                       <input 
                                        type="file" 
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            try {
                                              const url = await uploadImage(file);
                                              updateArrayItem('itinerary', i, { 
                                                ...item, 
                                                pickup: { ...(typeof item.pickup === 'object' ? item.pickup : {}), image: url, description: typeof item.pickup === 'object' ? item.pickup?.description || '' : item.pickup || '' } 
                                              });
                                            } catch (err) {
                                              alert("Failed to upload pickup image");
                                            }
                                          }
                                        }} 
                                        className="absolute inset-0 opacity-0 cursor-pointer" 
                                       />
                                     </div>
                                   )}
                                </div>
                              </div>
                            </div>

                            <div className="grid md:grid-cols-4 gap-8 pt-4 border-t border-gray-50">
                              <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Main Description</label>
                                <textarea 
                                  placeholder="What will happen on this day? Be descriptive and engaging..."
                                  rows={6}
                                  value={item.description}
                                  onChange={e => updateArrayItem('itinerary', i, { ...item, description: e.target.value })}
                                  className="w-full text-sm font-medium text-gray-600 border-none focus:ring-0 p-0 bg-transparent scrollbar-hide min-h-[150px]"
                                />
                              </div>
                              <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Featured Day Image</label>
                                <div className="relative aspect-video rounded-2xl bg-gray-100 border-4 border-white shadow-xl overflow-hidden group">
                                   {item.image ? (
                                     <>
                                       <img src={item.image} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                                          <button type="button" onClick={() => updateArrayItem('itinerary', i, { ...item, image: '' })} className="bg-red-600 text-white p-3 rounded-full transform hover:scale-110 transition-transform shadow-lg"><Trash2 className="h-6 w-6" /></button>
                                       </div>
                                     </>
                                   ) : (
                                     <div className="h-full w-full flex flex-col items-center justify-center gap-2 cursor-pointer relative hover:bg-gray-200 transition-colors">
                                       <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-gray-400 shadow-sm">
                                          <Upload className="h-6 w-6" />
                                       </div>
                                       <span className="text-[10px] text-gray-500 font-black tracking-[0.2em] uppercase">Upload Visual</span>
                                       <input type="file" onChange={(e) => handleItineraryImageUpload(i, e)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                     </div>
                                   )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-ons Selection Tab */}
              {activeTab === 'addOns' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                   <div className="bg-emerald-50 p-6 rounded-[10px] border border-emerald-100 flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center text-primary shadow-sm">
                         <PlusCircle className="h-6 w-6" />
                      </div>
                      <div>
                         <h4 className="font-black text-gray-900 text-sm tracking-tight">Global Add-ons Selection</h4>
                         <p className="text-xs text-gray-500 font-medium">Select the add-ons available for this specific tour.</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {globalAddOns.map(addon => {
                        const isSelected = formData.addOnIds?.includes(addon.id);
                        return (
                          <div 
                            key={addon.id} 
                            onClick={() => {
                              const currentIds = formData.addOnIds || [];
                              const newIds = isSelected 
                                ? currentIds.filter(id => id !== addon.id)
                                : [...currentIds, addon.id];
                              setFormData({ ...formData, addOnIds: newIds });
                            }}
                            className={cn(
                              "p-6 rounded-[10px] border-2 transition-all cursor-pointer flex items-center justify-between group",
                              isSelected ? "border-primary bg-emerald-50/20" : "border-gray-100 bg-white hover:border-emerald-200"
                            )}
                          >
                             <div className="flex items-center gap-3">
                                <div className={cn("h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all", isSelected ? "bg-primary border-primary" : "border-gray-200")}>
                                   {isSelected && <CheckCircle className="h-4 w-4 text-white" />}
                                </div>
                                <div>
                                   <p className="font-bold text-gray-900 group-hover:text-primary transition-colors text-sm">{addon.name}</p>
                                   <p className="text-xs font-bold text-primary tracking-tight">{formatPrice(addon.price)} / {addon.unit}</p>
                                </div>
                             </div>
                          </div>
                        );
                      })}
                      {globalAddOns.length === 0 && (
                        <div className="col-span-full py-12 text-center text-gray-400 font-bold border-2 border-dashed border-gray-100 rounded-[10px]">
                           No global add-ons found. Please create them in the Add-ons Menu.
                        </div>
                      )}
                   </div>
                </div>
              )}

              {/* Important Info Tab */}
              {activeTab === 'info' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-gray-900 tracking-tight">Dynamic Info Sections</h3>
                      <p className="text-sm text-gray-500 font-medium">Add sections like "What to Bring", "Cancellation Policy", etc.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => addArrayItem('infoSections', { title: '', content: [] })}
                      className="bg-primary text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" /> Add Section
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {formData.infoSections?.map((section, sIdx) => (
                      <div key={sIdx} className="p-6 bg-gray-50 rounded-[15px] border border-gray-100 relative group">
                        <button 
                          type="button" 
                          onClick={() => removeArrayItem('infoSections', sIdx)}
                          className="absolute top-4 right-4 text-red-300 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section Title</label>
                            <input 
                              placeholder="e.g. What to Bring"
                              value={section.title}
                              onChange={e => {
                                const newSections = [...(formData.infoSections || [])];
                                newSections[sIdx] = { ...newSections[sIdx], title: e.target.value };
                                setFormData({ ...formData, infoSections: newSections });
                              }}
                              className="w-full bg-white rounded-xl border-2 border-gray-100 p-4 text-lg font-black text-gray-900 focus:outline-none focus:border-primary transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Content (One item per line)</label>
                            <textarea 
                              rows={5}
                              placeholder="Point 1&#10;Point 2&#10;Point 3..."
                              value={Array.isArray(section.content) ? section.content.join('\n') : ''}
                              onChange={e => {
                                const newSections = [...(formData.infoSections || [])];
                                newSections[sIdx] = { ...newSections[sIdx], content: e.target.value.split('\n') };
                                setFormData({ ...formData, infoSections: newSections });
                              }}
                              className="w-full bg-white rounded-xl border-2 border-gray-100 p-4 text-sm font-medium focus:border-primary focus:outline-none transition-all"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!formData.infoSections || formData.infoSections.length === 0) && (
                      <div className="py-20 text-center border-2 border-dashed border-gray-200 rounded-[20px]">
                        <ShieldAlert className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase text-xs tracking-widest">No info sections added yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* FAQ Tab */}
              {activeTab === 'faq' && (
                <div className="space-y-8 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Frequently Asked Questions</h3>
                    <button 
                      type="button" 
                      onClick={() => addArrayItem('faqs', { question: '', answer: '' })} 
                      className="text-xs font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-2"
                    >
                      <PlusCircle className="h-4 w-4" /> Add Question
                    </button>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-gray-400 tracking-widest uppercase">Policy & Terms (Direct Content)</label>
                        <textarea 
                          rows={6}
                          placeholder="General policy and terms for this tour..."
                          value={formData.importantInfo || ''}
                          onChange={e => setFormData({ ...formData, importantInfo: e.target.value })}
                          className="w-full rounded-[10px] border-2 border-gray-100 p-4 text-sm font-medium focus:border-primary focus:outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-6">
                      {formData.faqs?.map((faq, fIdx) => (
                        <div key={fIdx} className="space-y-3 p-6 bg-gray-50 rounded-[15px] relative group border border-gray-100">
                          <button 
                            type="button" 
                            onClick={() => removeArrayItem('faqs', fIdx)}
                            className="absolute top-4 right-4 text-red-300 hover:text-red-600 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Question</label>
                            <input
                              placeholder="e.g. Is lunch included?"
                              value={faq.question}
                              onChange={e => {
                                const newFaqs = [...(formData.faqs || [])];
                                newFaqs[fIdx] = { ...faq, question: e.target.value };
                                setFormData({ ...formData, faqs: newFaqs });
                              }}
                              className="w-full font-bold text-gray-900 border-b-2 border-gray-200 bg-transparent py-2 focus:border-primary focus:outline-none transition-all"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Detailed Answer</label>
                            <textarea
                              placeholder="Write the response here..."
                              rows={3}
                              value={faq.answer}
                              onChange={e => {
                                const newFaqs = [...(formData.faqs || [])];
                                newFaqs[fIdx] = { ...faq, answer: e.target.value };
                                setFormData({ ...formData, faqs: newFaqs });
                              }}
                              className="w-full text-sm font-medium text-gray-600 bg-white rounded-xl p-4 focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-sm"
                            />
                          </div>
                        </div>
                      ))}
                      {(!formData.faqs || formData.faqs.length === 0) && (
                        <div className="py-12 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest">
                          No FAQs added for this tour yet.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="pt-8 border-t border-gray-100 flex justify-end gap-4">
                 <button
                  type="submit"
                  className="flex items-center gap-2 rounded-[10px] bg-primary px-12 py-4 font-black text-white transition-all hover:bg-emerald-700 hover:shadow-2xl active:scale-95 shadow-lg shadow-emerald-200"
                >
                  <Save className="h-5 w-5" />
                  {editingId ? 'UPDATE TOUR' : 'PUBLISH TOUR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        {/* Other Views Placeholders */}
        {['schedule', 'analytics', 'payments', 'users'].includes(activeMenu) && (
           <div className="h-[70vh] flex flex-col items-center justify-center bg-white rounded-[10px] border border-gray-100 border-dashed motion-safe:animate-in motion-safe:fade-in">
              <div className="h-20 w-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
                {menuItems.find(m => m.id === activeMenu)?.icon && (
                  (() => {
                    const Icon = menuItems.find(m => m.id === activeMenu)?.icon;
                    return <Icon className="h-10 w-10 text-primary" />;
                  })()
                )}
              </div>
              <h3 className="text-2xl font-black tracking-tight text-gray-900 mb-2">
                {menuItems.find(m => m.id === activeMenu)?.label} Module
              </h3>
              <p className="text-gray-400 font-medium">This professional suite is currently being optimized for your workflow.</p>
              <button className="mt-8 px-8 py-3 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-[10px] hover:shadow-xl transition-all">
                Configure Module
              </button>
           </div>
        )}

        </div>
      </main>

      {/* Global Booking Modals */}
      <AnimatePresence>
        {isAssignOpen && assignBooking && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAssignOpen(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 space-y-6"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black text-gray-900">Assign Guide</h3>
                <button onClick={() => setIsAssignOpen(false)} className="text-gray-400 hover:text-gray-900">
                  <Icons.X className="h-6 w-6" />
                </button>
              </div>
              
              <p className="text-sm text-gray-500 font-medium">Select a guide to send the tour details via WhatsApp.</p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide">
                {allGuides.map(guide => {
                  const isAlreadyBooked = bookings.some(b => 
                    b.assignedGuideId === guide.id && 
                    b.date === assignBooking.date && 
                    b.id !== assignBooking.id &&
                    b.status !== 'cancelled'
                  );

                  return (
                    <button 
                      key={guide.id}
                      disabled={isAlreadyBooked}
                      onClick={() => handleAssignToGuide(assignBooking, guide)}
                      className={cn(
                        "w-full p-4 rounded-2xl border transition-all text-left group flex items-center justify-between",
                        isAlreadyBooked 
                          ? "bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed" 
                          : "border-gray-100 hover:border-emerald-500 hover:bg-emerald-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "h-10 w-10 rounded-full flex items-center justify-center font-black transition-all",
                          isAlreadyBooked 
                            ? "bg-gray-200 text-gray-400" 
                            : "bg-emerald-50 text-primary group-hover:bg-primary group-hover:text-white"
                        )}>
                          {guide.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                             <p className={cn("font-black", isAlreadyBooked ? "text-gray-400" : "text-gray-900 group-hover:text-emerald-700")}>{guide.name}</p>
                             {isAlreadyBooked && (
                               <span className="text-[9px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Unavailable Today</span>
                             )}
                          </div>
                          <p className="text-[10px] font-bold text-gray-400">+{guide.whatsapp}</p>
                        </div>
                      </div>
                      {!isAlreadyBooked && <Icons.ArrowRight className="h-4 w-4 text-emerald-200 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
                      {isAlreadyBooked && <Icons.Ban className="h-4 w-4 text-gray-300" />}
                    </button>
                  );
                })}
                {allGuides.length === 0 && (
                  <p className="text-center py-10 text-xs font-bold text-gray-400 uppercase tracking-widest">No active guides found.</p>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isBookingDetailOpen && globalSelectedBooking && (
          <div className="fixed inset-0 z-[190] flex items-center justify-end">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookingDetailOpen(false)}
              className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col"
            >
              <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 block">Booking Reference</span>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">#{globalSelectedBooking.id.toUpperCase()}</h3>
                </div>
                <button onClick={() => setIsBookingDetailOpen(false)} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <Icons.X className="h-6 w-6 text-gray-400" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10 scrollbar-hide">
                <form id="global-booking-edit-form" onSubmit={handleSaveBookingChange} className="space-y-10">
                  {/* Status Selection */}
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Booking Status</label>
                    <div className="flex gap-3">
                      {['pending', 'confirmed', 'cancelled'].map(s => (
                        <button 
                          key={s}
                          type="button"
                          onClick={() => setGlobalSelectedBooking({ ...globalSelectedBooking, status: s as any })}
                          className={cn(
                            "flex-1 py-3 rounded-xl border-2 font-bold text-xs uppercase tracking-widest transition-all",
                            globalSelectedBooking.status === s 
                              ? (s === 'confirmed' ? "bg-emerald-50 border-primary text-primary" : 
                                 s === 'cancelled' ? "bg-red-50 border-red-500 text-red-500" : 
                                 "bg-amber-50 border-amber-500 text-amber-500")
                              : "border-gray-50 text-gray-400 hover:border-gray-200"
                          )}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8 pt-4">
                    {/* Customer Info */}
                    <div className="space-y-4 md:col-span-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Customer Information</label>
                      <div className="grid md:grid-cols-2 gap-4">
                        <input 
                          type="text"
                          value={globalSelectedBooking.customerData.fullName}
                          onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, customerData: { ...globalSelectedBooking.customerData, fullName: e.target.value } })}
                          placeholder="Full Name"
                          className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                        />
                        <input 
                          type="email"
                          value={globalSelectedBooking.customerData.email}
                          onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, customerData: { ...globalSelectedBooking.customerData, email: e.target.value } })}
                          placeholder="Email"
                          className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                        />
                        <input 
                          type="tel"
                          value={globalSelectedBooking.customerData.phone}
                          onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, customerData: { ...globalSelectedBooking.customerData, phone: e.target.value } })}
                          placeholder="Phone Number"
                          className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                        />
                        <select 
                          value={globalSelectedBooking.customerData.nationality || ''}
                          onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, customerData: { ...globalSelectedBooking.customerData, nationality: e.target.value } })}
                          className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all appearance-none"
                        >
                          <option value="">Nationality (Not Set)</option>
                          {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <textarea 
                          rows={3}
                          value={globalSelectedBooking.customerData.pickupAddress || ''}
                          onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, customerData: { ...globalSelectedBooking.customerData, pickupAddress: e.target.value } })}
                          placeholder="Pick Up Address & Google Maps Link"
                          className="w-full md:col-span-2 rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                        />
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Tour Date</label>
                      <input 
                        type="date"
                        value={globalSelectedBooking.date}
                        onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, date: e.target.value })}
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Time Slot</label>
                      <input 
                        type="text"
                        value={globalSelectedBooking.time || ''}
                        onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, time: e.target.value })}
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>

                    {/* Participants */}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Adults</label>
                      <input 
                        type="number"
                        value={globalSelectedBooking.participants.adults}
                        onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, participants: { ...globalSelectedBooking.participants, adults: Number(e.target.value) } })}
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Children</label>
                      <input 
                        type="number"
                        value={globalSelectedBooking.participants.children}
                        onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, participants: { ...globalSelectedBooking.participants, children: Number(e.target.value) } })}
                        className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-50 space-y-8">
                     <h4 className="text-sm font-black text-gray-900 border-l-4 border-primary pl-3">Payment & Tokens</h4>
                     <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Amount</label>
                          <input 
                            type="number"
                            value={globalSelectedBooking.totalAmount}
                            onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, totalAmount: Number(e.target.value) })}
                            className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-black text-sm text-primary focus:border-primary focus:bg-white outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment Method</label>
                          <div className="p-4 bg-gray-50 rounded-xl font-bold text-sm text-gray-600 border border-gray-100 uppercase tracking-tight">
                            {globalSelectedBooking.paymentMethod || 'N/A'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Payment Status</label>
                          <select 
                            value={globalSelectedBooking.paymentStatus || 'pending'}
                            onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, paymentStatus: e.target.value as any })}
                            className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-primary focus:bg-white outline-none transition-all cursor-pointer"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid / Confirmed</option>
                            <option value="failed">Failed</option>
                          </select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            Manual Payment Token/Reference <Icons.ShieldCheck className="h-3 w-3 text-secondary" />
                          </label>
                          <input 
                            type="text"
                            value={globalSelectedBooking.paymentToken || ''}
                            onChange={e => setGlobalSelectedBooking({ ...globalSelectedBooking, paymentToken: e.target.value })}
                            placeholder="e.g. BCA-TRANS-12345"
                            className="w-full rounded-xl border-2 border-gray-50 bg-gray-50/50 p-4 font-bold text-sm focus:border-secondary focus:bg-white outline-none transition-all"
                          />
                          <p className="text-[10px] text-gray-400 font-medium">Use this to track manual bank transfer references or additional payment tokens.</p>
                        </div>
                     </div>
                  </div>

                  <div className="pt-8 border-t border-gray-50 space-y-6">
                    <h4 className="text-sm font-black text-gray-900 border-l-4 border-secondary pl-3">Internal Administration</h4>
                    
                    <div className="space-y-4">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Assigned Guide/Driver</label>
                      <div className="flex flex-wrap gap-2">
                        {globalSelectedBooking.assignedGuideId ? (
                          <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-2xl w-full">
                            <div className="h-10 w-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black">
                              {globalSelectedBooking.assignedGuideName?.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <p className="font-black text-blue-900 leading-tight">{globalSelectedBooking.assignedGuideName}</p>
                              <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Currently Assigned</p>
                            </div>
                            <button 
                              type="button"
                              onClick={() => { setAssignBooking(globalSelectedBooking); setIsAssignOpen(true); }}
                              className="px-4 py-2 bg-white text-blue-600 rounded-xl font-black text-[10px] shadow-sm border border-blue-100 hover:bg-blue-100 transition-all uppercase tracking-widest"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => { setAssignBooking(globalSelectedBooking); setIsAssignOpen(true); }}
                            className="w-full p-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 hover:border-primary hover:text-primary transition-all flex flex-col items-center justify-center gap-2"
                          >
                            <Icons.UserPlus className="h-5 w-5" />
                            <span className="font-bold text-xs uppercase tracking-widest">No Guide Assigned</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* New Activity Log & Notes Section */}
                    <div className="space-y-6 pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                         <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Internal Activity & Notes</h4>
                         <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Private to Staff</span>
                      </div>
                      
                      {/* Timeline */}
                      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide py-2">
                        {globalSelectedBooking.logs && globalSelectedBooking.logs.length > 0 ? (
                          [...(globalSelectedBooking.logs || [])].reverse().map((log, lIdx) => (
                            <div key={lIdx} className="relative pl-6 pb-4 border-l-2 border-gray-50 last:pb-0">
                               <div className={cn(
                                 "absolute -left-[9px] top-0 h-4 w-4 rounded-full border-2 border-white shadow-sm",
                                 log.type === 'status_change' ? "bg-amber-400" : 
                                 log.type === 'note' ? "bg-blue-400" : 
                                 log.type === 'assignment' ? "bg-emerald-400" : "bg-gray-300"
                               )} />
                               <div className="bg-white rounded-xl p-3 border border-gray-50 shadow-sm">
                                  <div className="flex justify-between items-center mb-1">
                                     <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{log.userName || 'Admin'}</span>
                                     <span className="text-[9px] font-bold text-gray-300 italic">{new Date(log.timestamp).toLocaleString()}</span>
                                  </div>
                                  <p className="text-xs font-medium text-gray-700 leading-relaxed">{log.message}</p>
                               </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No activity logged yet</p>
                          </div>
                        )}
                      </div>

                      {/* Add Note Input */}
                      <div className="relative">
                        <textarea 
                          rows={3}
                          value={newNote}
                          onChange={e => setNewNote(e.target.value)}
                          placeholder="Type a new internal note or comment..."
                          className="w-full rounded-2xl border-2 border-gray-100 bg-white p-4 font-medium text-sm focus:border-primary outline-none transition-all pr-12"
                        />
                        <button 
                          type="button"
                          onClick={handleAddInternalNote}
                          disabled={!newNote.trim()}
                          className="absolute bottom-4 right-4 p-2 bg-primary text-white rounded-lg hover:bg-emerald-600 transition-all disabled:opacity-30 disabled:hover:bg-primary"
                        >
                          <Icons.Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </form>

                {/* Add-on Summary */}
                <div className="pt-8 border-t border-gray-50">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Experience Summary</h4>
                  <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-start text-sm">
                      <div className="space-y-1">
                         <span className="font-bold text-gray-900 block leading-none">{globalSelectedBooking.tourTitle}</span>
                         <span className="text-[10px] font-black text-primary uppercase tracking-widest">{globalSelectedBooking.packageName}</span>
                      </div>
                      <div className="text-right">
                         <span className="font-black text-gray-900 block leading-none">{formatPrice(globalSelectedBooking.totalAmount - (globalSelectedBooking.selectedAddOns?.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) || 0) + (globalSelectedBooking.discountAmount || 0))}</span>
                         <span className="text-[9px] font-bold text-gray-400 uppercase">{globalSelectedBooking.participants.adults + globalSelectedBooking.participants.children} Persons</span>
                      </div>
                    </div>
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                      {(globalSelectedBooking.selectedAddOns || []).map(addon => (
                        <div key={addon.id} className="flex justify-between items-center text-xs text-gray-500 font-medium">
                          <div className="flex flex-col">
                             <span className="font-bold text-gray-700">{addon.name}</span>
                             <span className="text-[9px] font-bold text-emerald-600">{formatPrice(addon.price)} x {addon.quantity}</span>
                          </div>
                          <span className="font-black text-gray-900">{formatPrice(addon.price * addon.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    {globalSelectedBooking.discountAmount > 0 && (
                      <div className="flex justify-between items-center text-xs pt-4 border-t border-gray-100 text-red-500 font-bold">
                         <span>Discount ({globalSelectedBooking.couponCode})</span>
                         <span>-{formatPrice(globalSelectedBooking.discountAmount)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-100 bg-gray-50">
                 <div className="flex gap-4">
                    <button 
                      type="button"
                      onClick={() => setIsBookingDetailOpen(false)}
                      className="flex-1 px-8 py-4 rounded-xl border border-gray-200 bg-white font-bold text-gray-500 hover:bg-gray-100 transition-all text-sm"
                    >
                      Cancel Changes
                    </button>
                    <button 
                      form="global-booking-edit-form"
                      type="submit"
                      className="flex-[2] bg-primary text-white px-8 py-4 rounded-xl font-black text-sm tracking-widest shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
                    >
                      SAVE BOOKING UPDATES
                    </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
