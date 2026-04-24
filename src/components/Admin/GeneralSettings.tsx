import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, writeBatch, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { SiteSettings } from '../../types';
import { 
  MOCK_SITE_SETTINGS, 
  MOCK_TOURS, 
  MOCK_BLOGS, 
  MOCK_REVIEWS, 
  MOCK_CATEGORIES, 
  MOCK_TOUR_TYPES, 
  MOCK_LOCATIONS, 
  MOCK_ADDONS, 
  MOCK_URGENCY_POINTS, 
  MOCK_GUIDES, 
  MOCK_COUPONS, 
  MOCK_PAGES 
} from '../../lib/mockData';
import { 
  Save, 
  Globe, 
  Palette, 
  Mail, 
  Phone, 
  MapPin,
  Type, 
  Search, 
  Image as ImageIcon,
  Loader2,
  Check,
  Database,
  AlertTriangle
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function GeneralSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    async function fetchSettings() {
      const docRef = doc(db, 'settings', 'general');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        setSettings(snap.data() as SiteSettings);
      }
      setLoading(false);
    }
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setMessage(null);

    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleSeed = async () => {
    if (!confirm("This will populate your database with initial sample data. Existing same-ID documents will be overwritten. Continue?")) return;
    
    setSeeding(true);
    setMessage(null);

    try {
      const batch = writeBatch(db);

      // 1. Settings
      batch.set(doc(db, 'settings', 'general'), MOCK_SITE_SETTINGS);

      // 2. Meta Data
      MOCK_CATEGORIES.forEach(c => batch.set(doc(db, 'categories', c.id), { name: c.name }));
      MOCK_TOUR_TYPES.forEach(t => batch.set(doc(db, 'tourTypes', t.id), { name: t.name }));
      MOCK_LOCATIONS.forEach(l => batch.set(doc(db, 'locationMeta', l.id), { name: l.name }));
      MOCK_ADDONS.forEach(a => batch.set(doc(db, 'addons', a.id), { ...a }));
      MOCK_URGENCY_POINTS.forEach(u => batch.set(doc(db, 'urgencyPoints', u.id), { ...u }));
      MOCK_GUIDES.forEach(g => batch.set(doc(db, 'guides', g.id), { ...g }));
      MOCK_COUPONS.forEach(c => batch.set(doc(db, 'coupons', c.id), { ...c, createdAt: serverTimestamp() }));

      // 3. Pages
      MOCK_PAGES.forEach(p => batch.set(doc(db, 'pages', p.id), { ...p, updatedAt: serverTimestamp() }));

      // 4. Blogs
      MOCK_BLOGS.forEach(b => batch.set(doc(db, 'posts', b.id), { ...b, createdAt: serverTimestamp(), updatedAt: serverTimestamp(), publishedAt: serverTimestamp() }));

      // 5. Tours
      MOCK_TOURS.forEach(t => batch.set(doc(db, 'tours', t.id), { ...t, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }));

      await batch.commit();

      // Individual batches for reviews since they are subcollections
      for (const r of MOCK_REVIEWS) {
        if (r.tourId) {
          const reviewRef = doc(db, 'tours', r.tourId, 'reviews', r.id);
          await setDoc(reviewRef, { ...r, createdAt: serverTimestamp() });
        }
      }

      setMessage({ type: 'success', text: 'Database seeded successfully! Please refresh the page.' });
      setSettings(MOCK_SITE_SETTINGS);
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: 'Seeding failed: ' + err.message });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <div className="h-64 flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

  return (
    <div className="space-y-8 max-w-4xl pb-20">
      <form onSubmit={handleSave} className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">General Site Settings</h2>
            <p className="text-gray-500">Configure global branding and meta settings</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-[10px] font-bold text-sm hover:brightness-90 transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Changes
          </button>
        </div>

        {message && (
          <div className={cn(
            "p-4 rounded-[12px] flex items-center gap-3",
            message.type === 'success' ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          )}>
            {message.type === 'success' ? <Check className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
            <span className="font-semibold text-sm">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Basic Info */}
          <div className="space-y-6 bg-white p-6 rounded-[24px] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              Branding
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Site Name</label>
                <input 
                  type="text" 
                  value={settings?.siteName}
                  onChange={(e) => setSettings(s => s ? {...s, siteName: e.target.value} : null)}
                  className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Logo URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={settings?.logoURL}
                      onChange={(e) => setSettings(s => s ? {...s, logoURL: e.target.value} : null)}
                      className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Favicon URL</label>
                  <div className="relative">
                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={settings?.faviconURL}
                      onChange={(e) => setSettings(s => s ? {...s, faviconURL: e.target.value} : null)}
                      className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Office Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                      type="text" 
                      value={settings?.officeAddress}
                      onChange={(e) => setSettings(s => s ? {...s, officeAddress: e.target.value} : null)}
                      className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                      placeholder="Jl. Raya Ubud, Bali..."
                    />
                  </div>
                </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-6 bg-white p-6 rounded-[24px] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              Support & Integration
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Support Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="email" 
                    value={settings?.supportEmail}
                    onChange={(e) => setSettings(s => s ? {...s, supportEmail: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Support Phone</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.supportPhone}
                    onChange={(e) => setSettings(s => s ? {...s, supportPhone: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">WhatsApp Number</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.whatsappNumber}
                    onChange={(e) => setSettings(s => s ? {...s, whatsappNumber: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="+62..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Visuals */}
          <div className="space-y-6 bg-white p-6 rounded-[24px] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              Visual Identity
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={settings?.primaryColor}
                    onChange={(e) => setSettings(s => s ? {...s, primaryColor: e.target.value} : null)}
                    className="h-10 w-10 p-0 border-none bg-transparent cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={settings?.primaryColor}
                    onChange={(e) => setSettings(s => s ? {...s, primaryColor: e.target.value} : null)}
                    className="flex-1 bg-gray-50 border-none rounded-[12px] px-4 py-2.5 text-xs font-mono uppercase focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="color" 
                    value={settings?.secondaryColor}
                    onChange={(e) => setSettings(s => s ? {...s, secondaryColor: e.target.value} : null)}
                    className="h-10 w-10 p-0 border-none bg-transparent cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={settings?.secondaryColor}
                    onChange={(e) => setSettings(s => s ? {...s, secondaryColor: e.target.value} : null)}
                    className="flex-1 bg-gray-50 border-none rounded-[12px] px-4 py-2.5 text-xs font-mono uppercase focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Heading Font (Google Font)</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.headingFont}
                    onChange={(e) => setSettings(s => s ? {...s, headingFont: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="Space Grotesk"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Body Font (Google Font)</label>
                <div className="relative">
                  <Type className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    value={settings?.bodyFont}
                    onChange={(e) => setSettings(s => s ? {...s, bodyFont: e.target.value} : null)}
                    className="w-full bg-gray-50 border-none rounded-[12px] pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                    placeholder="Inter"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEO */}
          <div className="space-y-6 bg-white p-6 rounded-[24px] border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              SEO & Social
            </h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Site Description</label>
                <textarea 
                  rows={4}
                  value={settings?.siteDescription}
                  onChange={(e) => setSettings(s => s ? {...s, siteDescription: e.target.value} : null)}
                  className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1">Keywords (Comma separated)</label>
                <input 
                  type="text" 
                  value={settings?.siteKeywords}
                  onChange={(e) => setSettings(s => s ? {...s, siteKeywords: e.target.value} : null)}
                  className="w-full bg-gray-50 border-none rounded-[12px] px-4 py-3 text-sm focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Maintenance Section */}
      <div className="bg-amber-50/50 border border-amber-100 rounded-[24px] p-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Maintenance & Setup</h3>
              <p className="text-sm text-gray-500 font-medium">Quickly setup your site with sample data</p>
            </div>
          </div>
          
          <div className="bg-white/50 p-6 rounded-xl border border-amber-100/50">
             <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
               <AlertTriangle className="h-4 w-4 text-amber-500" />
               Seed Sample Data
             </h4>
             <p className="text-sm text-gray-600 mb-6 leading-relaxed">
               This tool will populate your Firestore database with sample tours, blog posts, reviews, and categories. 
               Use this if you want to see a live preview of how the site looks with content. 
               <strong> Note: This will overwrite global settings and any matching IDs.</strong>
             </p>
             <button
               onClick={handleSeed}
               disabled={seeding}
               className="flex items-center gap-2 px-8 py-3 bg-amber-500 text-white rounded-xl font-bold text-sm hover:bg-amber-600 transition-all disabled:opacity-50 shadow-lg shadow-amber-200"
             >
               {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
               Seed Sample Database
             </button>
          </div>
      </div>
    </div>
  );
}

