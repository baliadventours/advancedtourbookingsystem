import { Plane, Instagram, Facebook, Twitter, Mail, Phone, MapPin, Leaf } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSettings } from '../lib/SettingsContext';

export default function Footer() {
  const { settings } = useSettings();
  
  return (
    <footer className="bg-gray-900 pt-16 pb-8 text-white">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-2 text-2xl font-black tracking-tighter">
              {settings?.logoURL ? (
                <img src={settings.logoURL} alt={settings.siteName} className="h-10 w-auto object-contain brightness-0 invert" />
              ) : (
                <>
                  <Leaf className="h-8 w-8 text-secondary" />
                  <span className="text-primary font-black tracking-tighter text-2xl group flex items-center">
                    {settings?.siteName || 'DayTours'}
                  </span>
                </>
              )}
            </Link>
            <p className="text-sm font-medium leading-relaxed text-gray-400">
              {settings?.siteDescription}
            </p>
            <div className="flex gap-4">
              <a href="#" className="rounded-xl bg-gray-800 p-3 transition-all hover:bg-primary hover:-translate-y-1">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-xl bg-gray-800 p-3 transition-all hover:bg-primary hover:-translate-y-1">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="rounded-xl bg-gray-800 p-3 transition-all hover:bg-primary hover:-translate-y-1">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-6 text-sm font-black text-white">Explore</h3>
            <ul className="space-y-4 text-xs font-bold text-gray-400">
              <li><Link to="/" className="hover:text-primary transition-colors">Home</Link></li>
              <li><Link to="/tours" className="hover:text-primary transition-colors">All tours</Link></li>
              <li><Link to="/destinations" className="hover:text-primary transition-colors">Destinations</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About us</Link></li>
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-sm font-black text-white">Trust & safety</h3>
            <ul className="space-y-4 text-xs font-bold text-gray-400">
               <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 text-secondary" />
                <span>{settings?.officeAddress}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-secondary" />
                <a href={`tel:${settings?.supportPhone}`} className="hover:text-primary transition-colors">{settings?.supportPhone}</a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-secondary" />
                <a href={`mailto:${settings?.supportEmail}`} className="hover:text-primary transition-colors">{settings?.supportEmail}</a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-6 text-lg font-bold">Newsletter</h3>
            <p className="mb-4 text-sm text-gray-400">Subscribe to get the latest travel updates and offers.</p>
            <form className="flex gap-2">
              <input 
                type="email" 
                placeholder="Your email" 
                className="w-full rounded-lg bg-gray-800 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold transition-colors hover:bg-blue-700">
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} {settings?.siteName}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
