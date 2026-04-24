import { Mail, Phone, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';

export default function Contact() {
  const { settings } = useSettings();
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-emerald-900 pt-40 pb-24 px-4 text-center">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight mb-6">Get in Touch</h1>
        <p className="text-emerald-100/60 max-w-2xl mx-auto font-medium text-lg italic">We're here to help you plan your perfect adventure. Reach out to our experts.</p>
      </section>

      <section className="container mx-auto px-4 py-24">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Info Cards */}
          <div className="lg:col-span-1 space-y-6">
            {[
              { icon: Phone, title: 'Call Us', detail: settings?.supportPhone || '+62 123 456 789', desc: 'Mon-Sun, 8am-8pm WITA', color: 'emerald' },
              { icon: Mail, title: 'Email Us', detail: settings?.supportEmail || 'hello@baliadventours.com', desc: 'We reply within 24 hours', color: 'blue' },
              { icon: MapPin, title: 'Visit Us', detail: settings?.officeAddress || 'Jl. Raya Ubud, Gianyar', desc: 'Bali, Indonesia 80571', color: 'orange' }
            ].map((item, i) => (
              <div key={i} className="bg-gray-50 p-8 rounded-[20px] transition-all hover:shadow-xl group">
                <div className={`h-12 w-12 rounded-xl bg-${item.color}-50 flex items-center justify-center text-${item.color}-600 mb-6 group-hover:scale-110 transition-transform`}>
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-lg font-bold text-gray-900 mb-1">{item.detail}</p>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 bg-white rounded-[30px] border border-gray-100 p-10 md:p-16 shadow-2xl shadow-emerald-900/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-[0.03]">
                <Send className="h-40 w-40 rotate-12" />
             </div>
             
             <div className="relative z-10">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Send us a Message</h2>
                <form className="space-y-6">
                   <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                         <input placeholder="John Doe" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20 font-bold text-gray-900 transition-all" />
                      </div>
                      <div className="space-y-2">
                         <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                         <input type="email" placeholder="john@example.com" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20 font-bold text-gray-900 transition-all" />
                      </div>
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Subject</label>
                      <input placeholder="What are you interested in?" className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20 font-bold text-gray-900 transition-all" />
                   </div>
                   <div className="space-y-2">
                      <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Your Message</label>
                      <textarea rows={6} placeholder="Tell us about your travel plans..." className="w-full bg-gray-50 border-none rounded-xl p-4 focus:ring-2 focus:ring-primary/20 font-bold text-gray-900 transition-all" />
                   </div>
                   <button type="button" className="bg-primary text-white px-10 py-5 rounded-2xl font-black tracking-widest text-sm uppercase shadow-xl hover:shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-3">
                      Send Message <Send className="h-4 w-4" />
                   </button>
                </form>
             </div>
          </div>
        </div>
      </section>

      {/* Map Placeholder */}
      <section className="bg-gray-100 h-[400px] w-full mt-24 relative flex items-center justify-center">
         <div className="text-center">
            <MapPin className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-gray-400 font-black text-xs">Interactive map coming soon</h4>
         </div>
      </section>
    </div>
  );
}
