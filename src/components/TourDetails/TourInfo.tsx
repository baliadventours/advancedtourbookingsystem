import { Check, X, MapPin, Clock, Globe, HelpCircle, MessageSquare, Info, ShieldCheck } from 'lucide-react';
import { Tour } from '../../types';
import { motion } from 'motion/react';

interface TourInfoProps {
  tour: Tour;
}

export default function TourInfo({ tour }: TourInfoProps) {
  const sections = [
    { id: 'overview', title: 'Tour Overview', content: tour.description },
    { id: 'highlights', title: 'Tour Highlights', items: tour.highlights },
    { id: 'inclusion', title: 'Inclusion & Exclusion', inclusions: tour.inclusions, exclusions: tour.exclusions },
    { id: 'itinerary', title: 'Tour Itinerary', itinerary: tour.itinerary },
    { id: 'info', title: 'Important Information', content: tour.importantInfo },
    { id: 'languages', title: 'Languages', items: tour.languages },
    { id: 'faq', title: 'FAQ', faqs: tour.faqs },
  ];

  return (
    <div className="space-y-12">
      {/* Overview */}
      <section id="overview" className="scroll-mt-[116px]">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Tour Overview</h2>
        <p className="leading-relaxed text-gray-600 whitespace-pre-wrap">{tour.description}</p>
      </section>

      {/* Highlights */}
      <section id="highlights" className="scroll-mt-[116px]">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Tour Highlights</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {(tour.highlights || []).filter(line => line.trim() !== '').map((item, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-primary">
                <Check className="h-4 w-4" />
              </div>
              <span className="text-gray-600 font-medium">{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Inclusion & Exclusion */}
      <section id="inclusion" className="scroll-mt-[116px]">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Inclusion & Exclusion</h2>
        <div className="grid gap-8 sm:grid-cols-2">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Inclusions</h3>
            <ul className="space-y-3">
              {(tour.inclusions || []).filter(line => line.trim() !== '').map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-green-500" />
                  <span className="text-sm text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">Exclusions</h3>
            <ul className="space-y-3">
              {(tour.exclusions || []).filter(line => line.trim() !== '').map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <X className="h-5 w-5 text-red-500" />
                  <span className="text-sm text-gray-600">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Itinerary */}
      <section id="itinerary" className="scroll-mt-[116px]">
        <h2 className="mb-8 text-2xl font-black text-gray-900 tracking-tight">Tour Itinerary</h2>
        <div className="space-y-12">
          {(tour.itinerary || []).map((item, idx) => (
            <div key={idx} className="relative group">
              {idx !== (tour.itinerary || []).length - 1 && (
                <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-emerald-100/50 group-hover:bg-emerald-200 transition-colors" />
              )}
              <div className="flex gap-6">
                <div className="relative z-10">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-black text-white text-xs shadow-lg shadow-emerald-100 ring-4 ring-white">
                    {item.day}
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">{item.title}</h3>
                    {item.pickup && (
                      <div className="flex items-center gap-2 text-primary font-bold text-[10px] bg-emerald-50 w-fit px-2 py-0.5 rounded-full border border-emerald-100">
                        <MapPin className="h-3 w-3" />
                        {typeof item.pickup === 'object' ? item.pickup.description : item.pickup}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-4">
                    {(item.image || (typeof item.pickup === 'object' && item.pickup?.image)) && (
                      <div className="w-full aspect-video md:aspect-[21/9] bg-gray-50 overflow-hidden rounded-xl">
                        <img 
                          src={item.image || (typeof item.pickup === 'object' ? item.pickup?.image : '')} 
                          alt={item.title} 
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                    )}
                    <div>
                      <p className="text-sm leading-relaxed text-gray-500 font-medium text-justify">{item.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Important Information */}
      <section id="info" className="scroll-mt-[116px]">
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="h-1 bg-primary flex-1 rounded-full opacity-10" />
            <h2 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <ShieldCheck className="h-6 w-6 text-primary" /> Important Information
            </h2>
            <div className="h-1 bg-primary flex-1 rounded-full opacity-10" />
          </div>

          <div className="space-y-4">
            {/* Dynamic Info Sections */}
            {(tour.infoSections || []).map((section, idx) => (
              <div key={idx} className="bg-white rounded-[10px] border border-gray-100 p-6 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-gray-900 border-l-4 border-primary pl-4 tracking-tight text-sm">
                  {section.title}
                </h3>
                <ul className="space-y-3">
                  {(section.content || []).filter(line => line.trim() !== '').map((point, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-4 text-gray-600 font-medium group text-sm">
                      <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-emerald-50 flex items-center justify-center text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                        <Check className="h-3 w-3" />
                      </div>
                      <span className="leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* General Info (Legacy support or fallback) */}
            {tour.importantInfo && (
              <div className="bg-emerald-50/30 rounded-[10px] border border-emerald-100/50 p-6 space-y-4">
                <h3 className="text-xs font-black text-primary tracking-tight flex items-center gap-2 uppercase">
                  <Info className="h-4 w-4" /> Policy & Terms
                </h3>
                <p className="text-sm leading-relaxed text-gray-700 font-medium whitespace-pre-wrap">
                  {tour.importantInfo}
                </p>
              </div>
            )}

            {/* Languages offered */}
            {tour.languages && tour.languages.length > 0 && (
              <div className="bg-gray-50 rounded-[10px] p-6 space-y-4">
                <h3 className="text-[10px] font-black text-gray-400 tracking-tight flex items-center gap-2 uppercase">
                  <Globe className="h-4 w-4" /> Languages Offered
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tour.languages.filter(l => l.trim() !== '').map((lang, idx) => (
                    <span key={idx} className="px-5 py-2 bg-white border border-gray-100 font-bold text-gray-900 rounded-full text-xs shadow-sm">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Map */}
      <section id="map" className="scroll-mt-[116px]">
        <h2 className="mb-6 text-[10px] font-black text-gray-400 tracking-[0.3em] uppercase opacity-50">Location Map</h2>
        <div className="overflow-hidden rounded-[10px] bg-gray-100 ring-1 ring-gray-100 aspect-[21/9] relative shadow-2xl shadow-gray-200/50">
          <iframe 
            src={tour.locationMapUrl || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3151.835434509374!2d144.9537353153166!3d-37.81033277975171!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0x5045675218ce6e0!2sMelbourne%20VIC%2C%20Australia!5e0!3m2!1sen!2sid!4v1625123456789!5m2!1sen!2sid"}
            width="100%" 
            height="100%" 
            style={{ border: 0 }} 
            allowFullScreen 
            loading="lazy"
            title="Location Map"
          />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="scroll-mt-[116px]">
        <h2 className="mb-6 text-2xl font-black text-gray-900 tracking-tight">FAQ</h2>
        <div className="space-y-4">
          {(tour.faqs || []).map((faq, idx) => (
            <div key={idx} className="rounded-[10px] border border-gray-100 bg-white p-5 cursor-default hover:border-emerald-100 transition-colors">
              <h3 className="mb-2 font-bold text-gray-900">{faq.question}</h3>
              <p className="text-sm leading-relaxed text-gray-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Custom Itinerary Cta */}
      <section className="rounded-[10px] bg-primary p-8 text-white">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold">Need custom itinerary and more questions?</h2>
            <p className="text-emerald-100 font-medium">Our experts are here to help you design your perfect trip.</p>
          </div>
          <button className="flex items-center gap-2 rounded-[10px] bg-white px-8 py-4 font-bold text-primary transition-all hover:bg-emerald-50 active:scale-95 shadow-lg">
            <MessageSquare className="h-5 w-5" /> Contact Experts
          </button>
        </div>
      </section>
    </div>
  );
}
