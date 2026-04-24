import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { SiteSettings } from '../types';

interface SettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
}

const defaultSettings: SiteSettings = {
  siteName: 'bali adventours',
  siteDescription: 'Premium Bali Tours & Adventure Experiences',
  siteKeywords: 'bali, tours, adventure, trekking, mount batur, waterfalls',
  supportEmail: 'baliadventours@gmail.com',
  supportPhone: '+62 812-3456-7890',
  whatsappNumber: '+62 812-3456-7890',
  logoURL: '',
  faviconURL: '',
  officeAddress: 'Jl. Raya Ubud, Gianyar, Bali, Indonesia 80571',
  primaryColor: '#00A651',
  secondaryColor: '#ffffff',
  bodyFont: 'Inter',
  headingFont: 'Space Grotesk'
};

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  loading: true
});

export const useSettings = () => useContext(SettingsContext);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const docRef = doc(db, 'settings', 'general');
    
    // Listen for real-time changes
    const unsubscribe = onSnapshot(docRef, 
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SiteSettings;
          setSettings(data);
          applySettings(data);
        } else {
          setSettings(defaultSettings);
          applySettings(defaultSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Firestore settings fetch failed, using defaults:", error);
        setSettings(defaultSettings);
        applySettings(defaultSettings);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const applySettings = (data: SiteSettings) => {
    // Apply SEO metadata
    document.title = data.siteName;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', data.siteDescription);
    
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) metaKeywords.setAttribute('content', data.siteKeywords);

    // Apply colors to CSS variables
    document.documentElement.style.setProperty('--primary-color', data.primaryColor);
    
    // Inject fonts if they are from Google Fonts
    if (data.headingFont || data.bodyFont) {
        const fontId = 'google-fonts-link';
        let link = document.getElementById(fontId) as HTMLLinkElement;
        if (!link) {
            link = document.createElement('link');
            link.id = fontId;
            link.rel = 'stylesheet';
            document.head.appendChild(link);
        }
        const families = [];
        if (data.headingFont) families.push(`family=${data.headingFont.replace(/ /g, '+')}:wght@400;700`);
        if (data.bodyFont) families.push(`family=${data.bodyFont.replace(/ /g, '+')}:wght@400;500;600`);
        
        if (families.length > 0) {
            link.href = `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
        }
        
        document.documentElement.style.setProperty('--font-heading', data.headingFont);
        document.documentElement.style.setProperty('--font-body', data.bodyFont);
    }

    // Apply favicon
    if (data.faviconURL) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = data.faviconURL;
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
}
