import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Booking } from '../types';
import { CheckCircle, Calendar, Users, Package, CreditCard, ArrowRight, Plane, Landmark, Info, Clock } from 'lucide-react';
import { formatPrice } from '../lib/utils';
import { motion } from 'motion/react';
import { useSettings } from '../lib/SettingsContext';

export default function BookingSuccess() {
  const { settings } = useSettings();
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentSettings, setPaymentSettings] = useState<any>(null);
  const [tour, setTour] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;
      try {
        const [bookingSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, 'bookings', id)),
          getDoc(doc(db, 'settings', 'payment'))
        ]);

        if (bookingSnap.exists()) {
          const bookingData = { id: bookingSnap.id, ...bookingSnap.data() } as Booking;
          setBooking(bookingData);
          
          // Fetch tour data to get pricing tiers
          if (bookingData.tourId) {
            const tourSnap = await getDoc(doc(db, 'tours', bookingData.tourId));
            if (tourSnap.exists()) {
              setTour(tourSnap.data());
            }
          }
        }
        if (settingsSnap.exists()) {
          setPaymentSettings(settingsSnap.data());
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const pricingBreakdown = () => {
    if (!booking || !tour) return null;
    
    const pkg = tour.packages?.find((p: any) => p.name === booking.packageName);
    if (!pkg?.tiers) return null;

    const totalPax = booking.participants.adults + booking.participants.children;
    const tier = pkg.tiers.find((t: any) => totalPax >= t.minParticipants && totalPax <= t.maxParticipants) 
                 || (totalPax < pkg.tiers[0].minParticipants ? pkg.tiers[0] : pkg.tiers[pkg.tiers.length - 1]);

    return {
      adultRate: tier.adultPrice,
      childRate: tier.childPrice,
      adultTotal: tier.adultPrice * booking.participants.adults,
      childTotal: tier.childPrice * booking.participants.children
    };
  };

  const rates = pricingBreakdown();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl font-bold text-gray-900">Booking Not Found</h1>
        <p className="mt-4 text-gray-500 text-lg">We couldn't find the booking you were looking for.</p>
        <Link to="/" className="mt-8 inline-block rounded-[10px] bg-primary px-8 py-3 font-bold text-white uppercase tracking-widest text-sm">
          Return Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-12 px-4 selection:bg-primary/20">
      <div className="mx-auto max-w-4xl">
        {/* Step Indicator - Modern & Subtle */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-gray-200" />
             <div className="h-2 w-12 rounded-full bg-primary" />
             <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
          className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-0 bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.08)] overflow-hidden border border-gray-100"
        >
          {/* Main Content Area */}
          <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-gray-100">
            {/* Header Content */}
            <div className="mb-12">
              <motion.div 
                initial={{ rotate: -10, scale: 0.5 }}
                animate={{ rotate: 0, scale: 1 }}
                className="mb-6 h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center"
              >
                <CheckCircle className="h-6 w-6 text-primary" />
              </motion.div>
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-3">
                Adventure Awaits!
              </h1>
              <p className="text-gray-500 font-medium leading-relaxed max-w-md">
                Your booking for <span className="text-primary font-bold">{booking.tourTitle}</span> is confirmed and secured.
              </p>
            </div>

            {/* Structured Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-10 gap-x-12 mb-12">
              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <Calendar className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Date & Time</span>
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-bold text-gray-900">{booking.date}</p>
                  <p className="text-sm text-gray-500 font-medium">{booking.time || "To be confirmed"}</p>
                </div>
              </div>

              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Group Size</span>
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {booking.participants.adults + booking.participants.children} <span className="text-sm font-medium text-gray-500">Travelers</span>
                </p>
              </div>

              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <Package className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Selected Package</span>
                </div>
                <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 text-xs font-bold text-gray-700">
                  {booking.packageName}
                </div>
              </div>

              <div className="group">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="h-4 w-4 text-primary opacity-40 group-hover:opacity-100 transition-opacity" />
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Reference</span>
                </div>
                <code className="text-sm font-mono font-bold text-primary bg-primary/5 px-2 py-0.5 rounded">
                  #{booking.id.slice(-8).toUpperCase()}
                </code>
              </div>
            </div>

            {/* Bank Transfer Box - Modern "Card" Style */}
            {booking.paymentMethod === 'bank_transfer' && paymentSettings && (
              <div className="relative overflow-hidden bg-gray-900 rounded-2xl p-8 text-white">
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                     <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Payment Instructions</span>
                     <div className="px-2 py-1 bg-primary/20 border border-primary/30 rounded text-[10px] font-bold text-primary animate-pulse">
                        PENDING TRANSFER
                     </div>
                  </div>

                  <div className="space-y-6 mb-8">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">Bank Name</span>
                        <p className="text-sm font-bold tracking-tight">{paymentSettings.bankName}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">SWIFT / BIC</span>
                        <p className="text-sm font-bold tracking-tight">{paymentSettings.swiftCode || "N/A"}</p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">Account Number</span>
                      <p className="text-2xl font-bold font-mono tracking-wider">{paymentSettings.accountNumber}</p>
                    </div>

                    <div>
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-1">Account Holder</span>
                      <p className="text-sm font-medium italic opacity-80">{paymentSettings.accountHolder}</p>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-white/30 uppercase tracking-wider block mb-0.5">Final Amount</span>
                      <p className="text-xl font-black text-primary">{formatPrice(booking.totalAmount)}</p>
                    </div>
                    {paymentSettings.bankInstructions && (
                      <div className="flex items-center gap-2 text-[10px] text-white/50 bg-white/5 px-3 py-2 rounded-lg italic">
                        <Info className="h-3 w-3" />
                        "{paymentSettings.bankInstructions}"
                      </div>
                    )}
                  </div>
                </div>
                {/* Decorative mesh */}
                <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 h-64 w-64 bg-primary/20 blur-[100px] rounded-full" />
                <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 h-64 w-64 bg-secondary/10 blur-[100px] rounded-full" />
              </div>
            )}
            
            {/* Customer Contact */}
            <div className="mt-12 pt-12 border-t border-gray-100">
               <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] block mb-6">Contact Information</span>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block mb-1">Guest Name</span>
                    <p className="text-sm font-bold text-gray-900">{booking.customerData.fullName}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-gray-400 block mb-1">Email / WhatsApp</span>
                    <p className="text-sm font-medium text-gray-600 truncate">{booking.customerData.email}</p>
                    <p className="text-xs text-gray-400 mt-1">{booking.customerData.phone}</p>
                  </div>
               </div>
            </div>
          </div>

          {/* Sidebar / Summary Area */}
          <div className="bg-gray-50/50 p-8 md:p-10 flex flex-col justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-8">Summary</h2>
              
              <div className="space-y-6 mb-12">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-gray-900">{booking.packageName}</p>
                    {!rates && (
                      <span className="text-xs font-mono font-bold text-gray-900">
                        {formatPrice(booking.totalAmount - (booking.selectedAddOns?.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) || 0) + (booking.discountAmount || 0))}
                      </span>
                    )}
                  </div>
                  
                  {rates ? (
                    <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                      {booking.participants.adults > 0 && (
                        <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                          <div className="flex flex-col">
                            <span>Adults (x{booking.participants.adults})</span>
                            <span className="text-[10px] text-primary font-bold">{formatPrice(rates.adultRate)} / person</span>
                          </div>
                          <span className="font-bold text-gray-900">{formatPrice(rates.adultTotal)}</span>
                        </div>
                      )}
                      {booking.participants.children > 0 && (
                        <div className="flex justify-between items-center text-xs text-gray-500 font-medium pt-1">
                          <div className="flex flex-col">
                            <span>Children (x{booking.participants.children})</span>
                            <span className="text-[10px] text-primary font-bold">{formatPrice(rates.childRate)} / child</span>
                          </div>
                          <span className="font-bold text-gray-900">{formatPrice(rates.childTotal)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-medium">Standard rate for {booking.participants.adults + booking.participants.children} travelers</p>
                  )}
                </div>

                {booking.selectedAddOns?.map((addon, i) => (
                  <div key={i} className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-gray-900">{addon.name}</p>
                      <p className="text-[10px] text-primary font-bold">{addon.quantity} × {formatPrice(addon.price)}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-500">
                      {formatPrice(addon.price * addon.quantity)}
                    </span>
                  </div>
                ))}

                {booking.discountAmount > 0 && (
                  <div className="flex justify-between items-center pt-2 text-red-500">
                     <div className="flex items-center gap-1.5">
                       <CreditCard className="h-3 w-3" />
                       <span className="text-[10px] font-bold">Promo ({booking.couponCode})</span>
                     </div>
                     <span className="text-xs font-mono font-bold">-{formatPrice(booking.discountAmount)}</span>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-gray-200">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
                  <span className="text-2xl font-black text-gray-900 tracking-tight">{formatPrice(booking.totalAmount)}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-medium">All taxes and fees included</p>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-12 space-y-3">
              <button 
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-900 text-white py-4 font-bold text-xs uppercase tracking-widest hover:bg-black transition-all hover:shadow-xl active:scale-95"
              >
                Print Voucher <ArrowRight className="h-4 w-4" />
              </button>
              <Link 
                to="/" 
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-200 text-gray-600 py-4 font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all hover:border-gray-300"
              >
                Back to Explore
              </Link>
            </div>
          </div>
        </motion.div>
        
        <div className="mt-12 text-center space-y-6">
          <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.3em] inline-flex items-center gap-3">
             <span className="h-px w-8 bg-gray-200" />
             Confirmation sent
             <span className="h-px w-8 bg-gray-200" />
          </p>
          <p className="text-sm text-gray-500 font-medium max-w-sm mx-auto leading-relaxed">
            A copy of this voucher has been sent to 
            <span className="text-gray-900 font-bold block mt-1 mb-4">{booking.customerData.email}</span>
            Need help? Contact us at <span className="text-primary font-bold">{settings?.supportEmail}</span> or call <span className="text-primary font-bold">{settings?.supportPhone}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
