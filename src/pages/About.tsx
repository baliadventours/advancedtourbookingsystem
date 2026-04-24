import { Target, Users, ShieldCheck, Heart, Award, Sparkles } from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';

export default function About() {
  const { settings } = useSettings();
  
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <img src="https://picsum.photos/seed/bali-about/1920/1080" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
           <span className="inline-block px-4 py-1.5 bg-emerald-500 text-white rounded-full text-[10px] font-black mb-6">Our story</span>
           <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight">Crafting memories <br/> beyond destinations</h1>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="container mx-auto px-4 py-24">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
           <div className="space-y-8">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight">Experience Bali Like <br/> A Local Expert</h2>
              <p className="text-lg text-gray-500 font-medium leading-relaxed">
                Founded with a passion for authentic exploration, {settings?.siteName} has been at the forefront of sustainable and immersive tourism for over a decade. We don't just sell tours; we curate life-changing experiences that connect you with the soul of Indonesia.
              </p>
              <div className="grid sm:grid-cols-2 gap-8 pt-8">
                 <div className="space-y-3">
                    <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center text-primary">
                       <Target className="h-5 w-5" />
                    </div>
                    <h4 className="font-black text-gray-900 text-xs">Our mission</h4>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">To provide world-class travel services while preserving local culture and environment.</p>
                 </div>
                 <div className="space-y-3">
                    <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                       <Sparkles className="h-5 w-5" />
                    </div>
                    <h4 className="font-black text-gray-900 text-xs">Our vision</h4>
                    <p className="text-sm text-gray-400 font-medium leading-relaxed">Becoming the most trusted gateway for travelers to discover the hidden gems of Indonesia.</p>
                 </div>
              </div>
           </div>
           <div className="relative">
              <div className="aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl">
                 <img src="https://picsum.photos/seed/bali-nature/800/1000" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
              </div>
              <div className="absolute -bottom-10 -left-10 bg-white p-8 rounded-[30px] shadow-2xl hidden md:block max-w-[280px]">
                 <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-white font-black text-xl">10+</div>
                    <span className="font-black text-gray-900 leading-none">Years of <br/> Excellence</span>
                 </div>
                 <p className="text-xs text-gray-400 font-medium">Serving over 50,000 satisfied travelers from 80+ countries worldwide.</p>
              </div>
           </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-24">
        <div className="container mx-auto px-4">
           <div className="text-center max-w-2xl mx-auto mb-20">
              <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-4">Our Core Values</h2>
              <p className="text-gray-500 font-medium">The principles that guide every decision we make and every tour we create.</p>
           </div>
           
           <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { icon: Users, title: 'People First', desc: 'Our guests and our local community are the heart of our business.', color: 'blue' },
                { icon: ShieldCheck, title: 'Safety Always', desc: 'Uncompromising standards of safety and professional guidance.', color: 'emerald' },
                { icon: Heart, title: 'Authenticity', desc: 'Real experiences, real people, and real connections.', color: 'orange' },
                { icon: Award, title: 'Quality Service', desc: 'Continuous improvement in every touchpoint of our journey.', color: 'purple' }
              ].map((val, i) => (
                <div key={i} className="bg-white p-10 rounded-[30px] border border-gray-100 shadow-sm hover:shadow-xl transition-all text-center">
                   <div className={`h-16 w-16 bg-${val.color}-50 flex items-center justify-center text-${val.color}-600 rounded-2xl mx-auto mb-8`}>
                      <val.icon className="h-8 w-8" />
                   </div>
                   <h3 className="text-xl font-black text-gray-900 mb-4">{val.title}</h3>
                   <p className="text-sm text-gray-500 font-medium leading-relaxed">{val.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
}
