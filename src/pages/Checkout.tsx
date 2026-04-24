import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { db, auth } from "../lib/firebase";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { Tour, TourPackage, Booking, AddOn, Coupon } from "../types";
import {
  ChevronRight,
  ChevronDown,
  Check,
  Info,
  ShieldCheck,
  CreditCard,
  Wallet,
  Banknote,
  Loader2,
  ArrowLeft,
  Calendar,
  Users,
  Baby,
  MapPin,
  Star,
  Plus,
  Minus,
  Tag,
  Database,
} from "lucide-react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { formatPrice, cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { sendBookingEmail } from "../lib/emailService";

type CheckoutStep = "selection" | "customer" | "payment";
type PaymentMethod = "card" | "paypal" | "bank_transfer";

export default function Checkout() {
  const { tourId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tour, setTour] = useState<Tour | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<CheckoutStep>("selection");
  const [isBooking, setIsBooking] = useState(false);

  // URL Params
  const dateFromUrl = searchParams.get("date") || "";
  const adultsFromUrl = parseInt(searchParams.get("adults") || "1");
  const childrenFromUrl = parseInt(searchParams.get("children") || "0");
  const timeFromUrl = searchParams.get("time") || "";

  // Local State
  const [date, setDate] = useState(dateFromUrl);
  const [adults, setAdults] = useState(adultsFromUrl);
  const [children, setChildren] = useState(childrenFromUrl);
  const [selectedTime, setSelectedTime] = useState(timeFromUrl);
  const [selectedPackage, setSelectedPackage] = useState<TourPackage | null>(
    null,
  );
  const [selectedAddOns, setSelectedAddOns] = useState<
    { id: string; name: string; price: number; quantity: number }[]
  >([]);
  const [customerData, setCustomerData] = useState({
    fullName: auth.currentUser?.displayName || "",
    email: auth.currentUser?.email || "",
    phone: "",
    nationality: "",
    pickupAddress: "",
    specialRequirements: "",
  });

  const COUNTRIES = [
    "Australia", "United States", "United Kingdom", "Germany", "France", "Japan", 
    "Singapore", "Malaysia", "China", "Indonesia", "Canada", "Netherlands", 
    "Russia", "South Korea", "India", "Other"
  ];
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);
  const [pricingTiersExpanded, setPricingTiersExpanded] = useState<string | null>(null);
  const [expandedAddOn, setExpandedAddOn] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Coupon State
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState<{
    paypalClientId: string;
    isPaypalEnabled: boolean;
    creditCardEnabled: boolean;
    bankName?: string;
    accountNumber?: string;
    swiftCode?: string;
    accountHolder?: string;
    bankInstructions?: string;
  } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, "settings", "payment");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const settings = docSnap.data() as any;
          setPaymentSettings(settings);
        }
      } catch (err) {
        console.error("Error fetching payment settings", err);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchTour = async () => {
      if (!tourId) return;
      try {
        const docRef = doc(db, "tours", tourId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const tourData = { id: docSnap.id, ...docSnap.data() } as Tour;
          setTour(tourData);
          if (tourData.packages.length > 0) {
            setSelectedPackage(tourData.packages[0]);
            setExpandedPackage(tourData.packages[0].name);
          }
        }
      } catch (error) {
        console.error("Error fetching tour", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTour();
  }, [tourId]);

  const applicableTier = useMemo(() => {
    if (!selectedPackage?.tiers || selectedPackage.tiers.length === 0) return null;
    const totalPax = adults + children;
    const tiers = selectedPackage.tiers;
    const findTier = tiers.find(
      (t) => totalPax >= t.minParticipants && totalPax <= t.maxParticipants,
    );
    return findTier || (totalPax < (tiers[0]?.minParticipants || 0) ? tiers[0] : tiers[tiers.length - 1]);
  }, [selectedPackage, adults, children]);

  const calculatePackagePrice = (pkg: TourPackage) => {
    if (!pkg.tiers || pkg.tiers.length === 0) return 0;
    const totalPax = adults + children;
    const tiers = pkg.tiers;
    const tier = tiers.find(
      (t) => totalPax >= t.minParticipants && totalPax <= t.maxParticipants,
    );
    const appTier =
      tier ||
      (totalPax < (tiers[0]?.minParticipants || 0)
        ? tiers[0]
        : tiers[tiers.length - 1]);
    const adultRate = appTier?.adultPrice || 0;
    const childRate = appTier?.childPrice || 0;
    return adultRate * adults + childRate * children;
  };

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const q = query(
        collection(db, "coupons"),
        where("code", "==", couponInput.toUpperCase()),
        where("isActive", "==", true),
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setCouponError("Invalid or expired coupon code");
        setAppliedCoupon(null);
      } else {
        const coupon = {
          id: querySnapshot.docs[0].id,
          ...querySnapshot.docs[0].data(),
        } as Coupon;
        // Basic min value check
        const packageTotal = calculatePackagePrice(selectedPackage!);
        if (packageTotal < (coupon.minBookingValue || 0)) {
          setCouponError(
            `Min booking value for this coupon is ${formatPrice(coupon.minBookingValue || 0)}`,
          );
          setAppliedCoupon(null);
        } else {
          setAppliedCoupon(coupon);
          setCouponInput("");
        }
      }
    } catch (error) {
      setCouponError("Failed to validate coupon");
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const summary = useMemo(() => {
    if (!selectedPackage)
      return { packageTotal: 0, addonsTotal: 0, discount: 0, grandTotal: 0 };
    const packageTotal = calculatePackagePrice(selectedPackage);
    const addonsTotal = selectedAddOns.reduce(
      (sum, addon) => sum + addon.price * addon.quantity,
      0,
    );

    let discount = 0;
    if (appliedCoupon) {
      if (appliedCoupon.discountType === "percentage") {
        discount = (packageTotal * appliedCoupon.discountValue) / 100;
      } else {
        discount = appliedCoupon.discountValue;
      }
    }

    return {
      packageTotal,
      addonsTotal,
      discount,
      grandTotal: Math.max(0, packageTotal + addonsTotal - discount),
    };
  }, [selectedPackage, selectedAddOns, adults, children, appliedCoupon]);

  const toggleAddOn = (addon: AddOn) => {
    const existing = selectedAddOns.find((a) => a.id === addon.id);
    if (existing) {
      setSelectedAddOns(selectedAddOns.filter((a) => a.id !== addon.id));
    } else {
      const quantity = addon.unit === "per person" ? adults + children : 1;
      setSelectedAddOns([
        ...selectedAddOns,
        { id: addon.id, name: addon.name, price: addon.price, quantity },
      ]);
    }
  };

  const updateAddOnQuantity = (addonId: string, delta: number) => {
    setSelectedAddOns(prev => prev.map(a => {
      if (a.id === addonId) {
        return { ...a, quantity: Math.max(1, a.quantity + delta) };
      }
      return a;
    }));
  };

  const handlePayPalApprove = async (data: any, actions: any) => {
    return actions.order.capture().then((details: any) => {
      handleFinalBooking(details.id);
    });
  };

  const handleFinalBooking = async (paymentId?: string) => {
    if (!selectedPackage || !date) return;
    setIsBooking(true);
    try {
      const bookingData: Partial<Booking> = {
        tourId: tour?.id,
        tourTitle: tour?.title,
        userId: auth.currentUser?.uid || "anonymous",
        customerData,
        date,
        participants: { adults, children },
        time: selectedTime,
        packageName: selectedPackage.name,
        selectedAddOns,
        totalAmount: summary.grandTotal,
        couponCode: appliedCoupon?.code || "",
        discountAmount: summary.discount,
        status: paymentMethod === "bank_transfer" ? "pending" : "confirmed",
        createdAt: serverTimestamp(),
        paymentId: paymentId || null,
        paymentMethod,
      };
      const docRef = await addDoc(collection(db, "bookings"), bookingData);
      const newBooking = { id: docRef.id, ...bookingData } as Booking;
      
      // Send Email Notifications
      const templateType = paymentMethod === 'bank_transfer' ? 'booking_pending' : 'booking_confirmed';
      await sendBookingEmail(templateType, newBooking);
      await sendBookingEmail('admin_new_booking', newBooking);

      navigate(`/booking-success/${docRef.id}`);
    } catch (error: any) {
      console.error("Booking failed", error);
      const errorMessage = error?.message || (typeof error === 'string' ? error : "Unknown error");
      alert(`Booking Failed: ${errorMessage}`);
    } finally {
      setIsBooking(false);
    }
  };

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  if (!tour)
    return (
      <div className="p-20 text-center text-red-500 font-bold">
        Tour not found
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-[116px] z-40">
        <div className="container mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-gray-900 transition-all group"
          >
            <div className="p-2 rounded-full group-hover:bg-gray-50 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Back to Tour
          </button>
          <div className="flex gap-4 items-center">
            {[
              { id: "selection", label: "Options" },
              { id: "customer", label: "Details" },
              { id: "payment", label: "Billing" },
            ].map((s, i) => (
              <div key={s.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black",
                    step === s.id
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-400",
                  )}
                >
                  {i + 1}
                </div>
                <span
                  className={cn(
                    "text-xs font-bold hidden sm:block",
                    step === s.id ? "text-primary" : "text-gray-400",
                  )}
                >
                  {s.label}
                </span>
                {i < 2 && <ChevronRight className="h-3 w-3 text-gray-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-12 items-start">
          {/* Left Column: Flow */}
          <div className="lg:col-span-2 space-y-12">
            {/* Step 1: Selection (Packages & Add-ons) */}
            {step === "selection" && (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4">
                {/* Package Selection */}
                <section className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                      Select Your Package
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">
                      Select the best option tailored for your adventure.
                    </p>
                  </div>

                  {tour.timeSlots && tour.timeSlots.length > 0 && (
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors uppercase tracking-wider">Choose preferred time slot</h3>
                        <div className="h-0.5 flex-1 bg-gray-100 ml-4 rounded-full" />
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                        {tour.timeSlots.map(time => (
                          <button
                            key={time}
                            type="button"
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              "py-3 rounded-xl border-2 transition-all font-bold text-xs",
                              selectedTime === time
                                ? "bg-primary border-primary text-white shadow-lg shadow-emerald-100"
                                : "bg-white border-gray-100 text-gray-500 hover:border-emerald-200"
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {tour.packages.map((pkg, idx) => {
                      const isSelected = selectedPackage?.name === pkg.name;
                      const isExpanded = expandedPackage === pkg.name;
                      const price = calculatePackagePrice(pkg);

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "border-2 rounded-[15px] transition-all overflow-hidden bg-white",
                            isSelected
                              ? "border-primary shadow-xl shadow-emerald-50"
                              : "border-gray-100 hover:border-emerald-100",
                          )}
                        >
                          {/* Header Section */}
                          <div
                            onClick={() => {
                              setSelectedPackage(pkg);
                              setExpandedPackage(isExpanded ? null : pkg.name);
                            }}
                            className="p-6 cursor-pointer flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <div
                                className={cn(
                                  "h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0",
                                  isSelected
                                    ? "bg-primary border-primary text-white"
                                    : "border-gray-200",
                                )}
                              >
                                {isSelected && <Check className="h-3 w-3" />}
                              </div>
                              <div>
                                <h3 className="font-extrabold text-gray-900 group-hover:text-primary transition-colors">
                                  {pkg.name}
                                </h3>
                                <p className="text-xs font-bold text-primary tracking-tight mt-0.5">
                                  {pkg.details || "Standard Plan"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-right">
                                <span className="text-[10px] font-black text-gray-400 block tracking-tighter invisible group-hover:visible">
                                  Price
                                </span>
                                <span className="text-xl font-black text-secondary font-display tracking-tight">
                                  {formatPrice(price)}
                                </span>
                              </div>
                              <ChevronDown
                                className={cn(
                                  "h-5 w-5 text-gray-400 transition-transform",
                                  isExpanded && "rotate-180",
                                )}
                              />
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden bg-gray-50/50 border-t border-gray-100"
                              >
                                <div className="p-6 space-y-8">
                                  {/* Tiers Pricing Info Section */}
                                  {pkg.tiers && pkg.tiers.length > 0 && (
                                    <div className="space-y-4">
                                       <button 
                                         type="button"
                                         onClick={(e) => {
                                           e.stopPropagation();
                                           setPricingTiersExpanded(pricingTiersExpanded === pkg.name ? null : pkg.name);
                                         }}
                                         className="flex items-center gap-2 group w-full text-left"
                                       >
                                          <div className="h-4 w-1 bg-primary rounded-full group-hover:h-6 transition-all" />
                                          <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest flex-1">Rate Information</h4>
                                          <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", pricingTiersExpanded === pkg.name && "rotate-180")} />
                                       </button>
                                       
                                       <AnimatePresence>
                                         {pricingTiersExpanded === pkg.name && (
                                           <motion.div 
                                             initial={{ height: 0, opacity: 0 }}
                                             animate={{ height: "auto", opacity: 1 }}
                                             exit={{ height: 0, opacity: 0 }}
                                             className="overflow-hidden"
                                           >
                                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                                                {/* Adults Tiers Table */}
                                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                                   <div className="bg-gray-900 p-2.5 px-4 flex items-center justify-between">
                                                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Pricing (Adult)</span>
                                                      <Users className="h-3.5 w-3.5 text-emerald-400" />
                                                   </div>
                                                   <div className="p-3 space-y-2">
                                                      {pkg.tiers.map((tier, tIdx) => (
                                                         <div key={tIdx} className="flex justify-between items-center text-xs">
                                                            <span className="text-gray-400 font-black uppercase text-[9px] tracking-tight">
                                                               {tier.maxParticipants >= 99 
                                                                  ? `${tier.minParticipants}+ persons` 
                                                                  : tier.minParticipants === tier.maxParticipants 
                                                                    ? `${tier.minParticipants} person`
                                                                    : `${tier.minParticipants}-${tier.maxParticipants} persons`
                                                               }
                                                            </span>
                                                            <span className="font-extrabold text-gray-900">{formatPrice(tier.adultPrice)}/person</span>
                                                         </div>
                                                      ))}
                                                   </div>
                                                </div>
                                                
                                                {/* Children Pricing Section */}
                                                <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
                                                   <div className="bg-emerald-500 p-2.5 px-4 flex items-center justify-between">
                                                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">Children Pricing</span>
                                                      <Baby className="h-3.5 w-3.5 text-white" />
                                                   </div>
                                                   <div className="p-3 space-y-2">
                                                      <div className="flex justify-between items-center text-xs">
                                                         <span className="text-gray-400 font-black uppercase text-[9px] tracking-tight">1+ children</span>
                                                         <span className="font-extrabold text-gray-900">{formatPrice(pkg.tiers[0].childPrice)}/child</span>
                                                      </div>
                                                      <div className="pt-2 mt-2 border-t border-gray-50">
                                                         <p className="text-[9px] text-gray-400 font-medium leading-relaxed italic">
                                                            * Special rates for young adventurers.
                                                         </p>
                                                      </div>
                                                   </div>
                                                </div>
                                             </div>
                                           </motion.div>
                                         )}
                                       </AnimatePresence>
                                    </div>
                                  )}

                                  {/* Inclusion/Exclusion Grid */}
                                  <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                      <h4 className="text-xs font-bold text-emerald-600 flex items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-emerald-50 flex items-center justify-center">
                                          <Check className="h-3 w-3" />
                                        </div>
                                        Included in Package
                                      </h4>
                                      <ul className="grid gap-x-6 gap-y-2 grid-cols-1">
                                        {(pkg.inclusions || []).filter(l => l.trim() !== '').map((inc, i) => (
                                          <li
                                            key={i}
                                            className="text-xs text-gray-600 flex items-start gap-2 group"
                                          >
                                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0 group-hover:scale-125 transition-transform" />
                                            <span className="leading-relaxed">{inc}</span>
                                          </li>
                                        ))}
                                        {(pkg.inclusions || []).filter(l => l.trim() !== '').length === 0 && (
                                          <li className="text-[10px] text-gray-400">
                                            No inclusions specified.
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                    <div className="space-y-4">
                                      <h4 className="text-xs font-bold text-red-500 flex items-center gap-2">
                                        <div className="h-5 w-5 rounded-full bg-red-50 flex items-center justify-center">
                                          <Plus className="rotate-45 h-3 w-3" />
                                        </div>
                                        Excluded
                                      </h4>
                                      <ul className="grid gap-x-6 gap-y-2 grid-cols-1">
                                        {(pkg.exclusions || []).filter(l => l.trim() !== '').map((exc, i) => (
                                          <li
                                            key={i}
                                            className="text-xs text-gray-400 flex items-start gap-2 group"
                                          >
                                            <div className="h-1.5 w-1.5 rounded-full bg-red-200 mt-1.5 shrink-0 group-hover:bg-red-300 transition-colors" />
                                            <span className="leading-relaxed">{exc}</span>
                                          </li>
                                        ))}
                                        {(pkg.exclusions || []).filter(l => l.trim() !== '').length === 0 && (
                                          <li className="text-[10px] text-gray-400">
                                            Everything included.
                                          </li>
                                        )}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>

                {/* Add-on Selection */}
                <section className="space-y-6">
                  <div>
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                      Enhance Your Trip
                    </h2>
                    <p className="text-sm text-gray-500 font-medium">
                      Add those extra touches to make your journey perfect.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-6">
                    {tour.addOns?.map((addon, idx) => {
                      const isSelected = !!selectedAddOns.find(
                        (a) => a.id === addon.id,
                      );
                      const isExpanded = expandedAddOn === addon.id;

                      return (
                        <div
                          key={idx}
                          className={cn(
                            "border-2 rounded-[15px] p-5 transition-all bg-white relative group",
                            isSelected
                              ? "border-primary bg-emerald-50/10"
                              : "border-gray-50 hover:border-emerald-100",
                          )}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex gap-4">
                              <button
                                onClick={() => toggleAddOn(addon)}
                                className={cn(
                                  "h-6 w-6 rounded border-2 transition-all flex items-center justify-center mt-1",
                                  isSelected
                                    ? "bg-primary border-primary text-white"
                                    : "border-gray-200",
                                )}
                              >
                                {isSelected && <Check className="h-4 w-4" />}
                              </button>
                              <div>
                                <h4 className="font-extrabold text-gray-900">
                                  {addon.name}
                                </h4>
                                <p className="text-xs font-bold text-primary mt-1 tracking-tight">
                                  {formatPrice(addon.price)} / {addon.unit}
                                </p>
                                
                                {isSelected && (
                                  <div className="mt-4 flex items-center gap-4 p-2 bg-white rounded-lg border border-gray-100 shadow-sm w-fit">
                                    <span className="text-xs font-semibold text-gray-500 ml-1">Quantity:</span>
                                    <div className="flex items-center gap-3">
                                      <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); updateAddOnQuantity(addon.id, -1); }}
                                        className="h-6 w-6 rounded-md bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </button>
                                      <span className="text-sm font-black text-gray-900 w-4 text-center">
                                        {selectedAddOns.find(a => a.id === addon.id)?.quantity}
                                      </span>
                                      <button 
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); updateAddOnQuantity(addon.id, 1); }}
                                        className="h-6 w-6 rounded-md bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                setExpandedAddOn(isExpanded ? null : addon.id)
                              }
                              className="text-gray-400 hover:text-primary transition-colors p-1"
                            >
                              <Info className="h-5 w-5" />
                            </button>
                          </div>

                          <AnimatePresence>
                            {isExpanded && addon.description && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{
                                  height: "auto",
                                  opacity: 1,
                                  marginTop: 12,
                                }}
                                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="text-xs text-gray-500 font-medium leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                  {addon.description}
                                </p>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <div className="pt-8 flex justify-end">
                  <button
                    onClick={() => setStep("customer")}
                    className="bg-primary text-white px-12 py-5 rounded-[12px] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-3"
                  >
                    Continue To Details <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Customer Info */}
            {step === "customer" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    Who's Traveling?
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">
                    Please provide your details for the booking confirmation.
                  </p>
                </div>

                <div className="bg-white p-8 rounded-[20px] border border-gray-100 shadow-sm space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 px-1">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      value={customerData.fullName}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="e.g. John Alexander"
                      className="w-full rounded-[12px] border-2 border-gray-50 p-4 focus:border-primary focus:outline-none bg-gray-50/30 font-bold transition-all text-sm"
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 px-1">
                        Email Address
                      </label>
                      <input
                        required
                        type="email"
                        value={customerData.email}
                        onChange={(e) =>
                          setCustomerData({
                            ...customerData,
                            email: e.target.value,
                          })
                        }
                        placeholder="john@example.com"
                        className="w-full rounded-[12px] border-2 border-gray-50 p-4 focus:border-primary focus:outline-none bg-gray-50/30 font-bold transition-all text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 px-1 uppercase tracking-widest flex items-center gap-2">
                        Nationality
                      </label>
                      <select
                        required
                        value={customerData.nationality}
                        onChange={(e) =>
                          setCustomerData({
                            ...customerData,
                            nationality: e.target.value,
                          })
                        }
                        className="w-full rounded-[12px] border-2 border-gray-50 p-4 focus:border-primary focus:outline-none bg-gray-50/30 font-bold transition-all text-sm appearance-none"
                      >
                        <option value="">Select Country</option>
                        {COUNTRIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 px-1 uppercase tracking-widest flex items-center gap-2">
                        Phone Number
                      </label>
                      <input
                        required
                        type="tel"
                        value={customerData.phone}
                        onChange={(e) =>
                          setCustomerData({
                            ...customerData,
                            phone: e.target.value,
                          })
                        }
                        placeholder="+62 812 345 678"
                        className="w-full rounded-[12px] border-2 border-gray-50 p-4 focus:border-primary focus:outline-none bg-gray-50/30 font-bold transition-all text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 px-1 uppercase tracking-widest">
                      Pick Up Address
                    </label>
                    <textarea
                      required
                      rows={3}
                      value={customerData.pickupAddress}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          pickupAddress: e.target.value,
                        })
                      }
                      placeholder="Type full address of your villa/hotel/airbnb and Google Maps link."
                      className="w-full rounded-[12px] border-2 border-gray-50 p-4 focus:border-primary focus:outline-none bg-gray-50/30 font-bold transition-all text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 px-1 uppercase tracking-widest">
                      Special Requirements
                    </label>
                    <textarea
                      rows={4}
                      value={customerData.specialRequirements}
                      onChange={(e) =>
                        setCustomerData({
                          ...customerData,
                          specialRequirements: e.target.value,
                        })
                      }
                      placeholder="Allergies, wheelchair access, dietary preferences..."
                      className="w-full rounded-[12px] border-2 border-gray-50 p-4 focus:border-primary focus:outline-none bg-gray-50/30 font-bold transition-all text-sm"
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <button
                    onClick={() => setStep("selection")}
                    className="text-gray-400 font-bold text-sm tracking-tight hover:text-gray-600"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep("payment")}
                    className="bg-primary text-white px-12 py-5 rounded-[12px] font-black tracking-[0.2em] text-xs shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all flex items-center gap-3"
                  >
                    Continue To Payment <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment */}
            {step === "payment" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    Secure Payment
                  </h2>
                  <p className="text-sm text-gray-500 font-medium">
                    Choose your preferred way to pay securely.
                  </p>
                </div>

                <div className="grid gap-4">
                  {[
                    {
                      id: "paypal",
                      label: "PayPal",
                      icon: Wallet,
                      des: "Fast and secure payment with your PayPal account",
                      enabled: paymentSettings?.isPaypalEnabled ?? true,
                    },
                    {
                      id: "card",
                      label: "Credit Card (by PayPal)",
                      icon: CreditCard,
                      des: "All major cards accepted. Handled securely by PayPal",
                      enabled: paymentSettings?.creditCardEnabled ?? true,
                    },
                    {
                      id: "bank_transfer",
                      label: "Manual Bank Transfer",
                      icon: Banknote,
                      des: "Direct deposit to our merchant account",
                      enabled: true,
                    },
                  ]
                    .filter((m) => m.enabled)
                    .map((method) => (
                      <div
                        key={method.id}
                        onClick={() =>
                          setPaymentMethod(method.id as PaymentMethod)
                        }
                        className={cn(
                          "p-6 rounded-[20px] border-2 transition-all cursor-pointer flex items-center justify-between bg-white",
                          paymentMethod === method.id
                            ? "border-primary shadow-xl ring-4 ring-emerald-50"
                            : "border-gray-50 hover:border-emerald-100",
                        )}
                      >
                        <div className="flex items-center gap-6">
                          <div
                            className={cn(
                              "h-14 w-14 rounded-[15px] flex items-center justify-center transition-colors",
                              paymentMethod === method.id
                                ? "bg-primary text-white"
                                : "bg-gray-50 text-gray-400 group-hover:bg-emerald-50 group-hover:text-primary",
                            )}
                          >
                            <method.icon className="h-7 w-7" />
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-900">
                              {method.label}
                            </p>
                            <p className="text-xs text-gray-500 font-medium">
                              {method.des}
                            </p>
                          </div>
                        </div>
                        <div
                          className={cn(
                            "h-6 w-6 rounded-full border-2 flex items-center justify-center",
                            paymentMethod === method.id
                              ? "bg-primary border-primary text-white"
                              : "border-gray-100",
                          )}
                        >
                          {paymentMethod === method.id && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="rounded-[20px] border-2 border-emerald-100 p-8 bg-emerald-50/20 flex gap-6">
                  <ShieldCheck className="h-10 w-10 text-primary shrink-0" />
                  <div>
                    <h4 className="font-black text-primary text-sm tracking-widest mb-1">
                      Guaranteed Security
                    </h4>
                    <p className="text-xs text-gray-600 font-medium leading-relaxed">
                      Your data and payments are encrypted and protected by
                      international security standards. By proceeding, you agree
                      to our booking terms and conditions.
                    </p>
                  </div>
                </div>

                {paymentMethod === "bank_transfer" && paymentSettings && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-50 rounded-[20px] p-8 border-2 border-dashed border-gray-200 space-y-6"
                  >
                    <div className="flex items-center gap-4 text-gray-900">
                      <div className="h-12 w-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center shadow-sm">
                        <Database className="h-6 w-6 text-secondary" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm tracking-widest">
                          Direct Bank Transfer
                        </h4>
                        <p className="text-[10px] text-gray-500 font-bold">
                          DayTours Merchant Account
                        </p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8 pt-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 tracking-widest">
                          Bank Name
                        </span>
                        <p className="font-bold text-gray-900 border-b border-gray-100 pb-2">
                          {paymentSettings.bankName || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 tracking-widest">
                          Account Number
                        </span>
                        <p className="font-mono font-black text-lg text-primary border-b border-gray-100 pb-2">
                          {paymentSettings.accountNumber || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 tracking-widest">
                          SWIFT Code
                        </span>
                        <p className="font-mono font-black text-lg text-secondary border-b border-gray-100 pb-2">
                          {paymentSettings.swiftCode || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 tracking-widest">
                          Account Holder
                        </span>
                        <p className="font-bold text-gray-900 border-b border-gray-100 pb-2">
                          {paymentSettings.accountHolder || "N/A"}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-gray-400 tracking-widest">
                          Amount To Pay
                        </span>
                        <p className="font-black text-xl text-secondary border-b border-gray-100 pb-2">
                          {formatPrice(summary.grandTotal)}
                        </p>
                      </div>
                    </div>

                    {paymentSettings.bankInstructions && (
                      <div className="bg-white p-4 rounded-xl text-[11px] text-gray-500 font-medium leading-relaxed border border-gray-100">
                        " {paymentSettings.bankInstructions} "
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="space-y-6">
                  <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100 shadow-sm cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => setAgreedToTerms(!agreedToTerms)}>
                    <button
                      type="button"
                      className={cn(
                        "h-6 w-6 rounded-md border-2 flex items-center justify-center transition-all",
                        agreedToTerms ? "bg-primary border-primary text-white" : "border-gray-200"
                      )}
                    >
                      {agreedToTerms && <Check className="h-4 w-4" />}
                    </button>
                    <p className="text-xs text-gray-600 font-medium">
                      By booking this tour you agree to our <Link to="/pages/terms-and-conditions" className="text-primary font-bold hover:underline" target="_blank">Terms and Conditions</Link>
                    </p>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={() => setStep("customer")}
                      className="text-gray-400 font-black text-xs tracking-widest hover:text-gray-600"
                    >
                      Back
                    </button>
                  </div>

                  {paymentMethod === "bank_transfer" ||
                  summary.grandTotal <= 0 ? (
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleFinalBooking()}
                        disabled={isBooking || !agreedToTerms}
                        className="w-full sm:w-auto bg-secondary text-white px-16 py-6 rounded-[15px] font-black tracking-[0.2em] text-sm shadow-2xl shadow-orange-100 hover:bg-orange-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isBooking ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <>
                            Complete Booking <Check className="h-5 w-5" />
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className={cn("w-full relative z-0 min-h-[150px] flex flex-col transition-opacity", !agreedToTerms && "opacity-50 pointer-events-none")}>
                      {!agreedToTerms && (
                        <p className="text-xs font-bold text-amber-600 tracking-tight mb-4 animate-bounce">
                          Please agree to Terms & Conditions above
                        </p>
                      )}
                      {paymentSettings.isPaypalEnabled && paymentSettings.paypalClientId && (
                        <div className="w-full">
                          <PayPalScriptProvider
                            options={{
                              clientId: paymentSettings.paypalClientId.trim(),
                              currency: "USD",
                              intent: "capture",
                              components: "buttons"
                            }}
                            key={paymentSettings.paypalClientId + summary.grandTotal}
                          >
                            <PayPalButtons
                              style={{ 
                                layout: "vertical",
                                shape: "rect",
                                color: "blue",
                                label: "paypal",
                                height: 55
                              }}
                              forceReRender={[summary.grandTotal, paymentSettings.paypalClientId, agreedToTerms]}
                              createOrder={(data, actions) => {
                                return actions.order.create({
                                  intent: 'CAPTURE',
                                  purchase_units: [
                                    {
                                      amount: {
                                        value: summary.grandTotal.toFixed(2),
                                        currency_code: "USD",
                                      },
                                      description: `${tour?.title} - ${selectedPackage?.name}`,
                                    },
                                  ],
                                });
                              }}
                              onApprove={handlePayPalApprove}
                              onError={(err) => {
                                console.error("PayPal Error:", err);
                                alert("Payment failed. Please ensure your Client ID is correct in Admin settings.");
                              }}
                            />
                          </PayPalScriptProvider>
                        </div>
                      )}
                      {!paymentSettings.paypalClientId && (
                        <div className="text-gray-400 text-xs font-bold">
                          PayPal is being configured...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Checkout Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-28 space-y-8">
              {/* Main Summary Card */}
              <div className="bg-white rounded-[20px] border border-gray-100 shadow-xl overflow-hidden">
                <div className="aspect-video w-full relative">
                  <img
                    src={tour.gallery[0] || ""}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest rounded-full">
                        Experience
                      </span>
                      <div className="flex text-amber-400">
                        <Star className="h-2 w-2 fill-current" />
                      </div>
                    </div>
                    <h3 className="text-white font-black tracking-tight leading-tight">
                      {tour.title}
                    </h3>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  {/* Details Strip */}
                  <div className="flex items-center justify-between border-b border-gray-50 pb-6 gap-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-primary" />
                      <div>
                        <p className="text-[10px] font-black text-gray-400 tracking-tighter">
                          Date
                        </p>
                        <p className="font-extrabold text-gray-900 text-xs">
                          {new Date(date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <Users className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-400 tracking-tighter">
                          Travelers
                        </p>
                        <p className="font-extrabold text-gray-900 text-xs">
                          {adults + children} Total
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center group">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-gray-400 tracking-tight">
                            Package Price
                          </span>
                          <span className="font-bold text-gray-900 text-sm">
                            {selectedPackage?.name}
                          </span>
                        </div>
                      </div>
                      
                      {/* Detailed Guests Breakdown */}
                      <div className="space-y-1.5 pl-2 border-l-2 border-emerald-50">
                        {adults > 0 && (
                          <div className="flex justify-between items-center text-xs text-gray-500 font-medium">
                            <div className="flex flex-col">
                              <span>Adults (x{adults})</span>
                              <span className="text-[10px] text-primary font-black">{formatPrice(applicableTier?.adultPrice || 0)} / person</span>
                            </div>
                            <span className="font-bold">{formatPrice((applicableTier?.adultPrice || 0) * adults)}</span>
                          </div>
                        )}
                        {children > 0 && (
                          <div className="flex justify-between items-center text-xs text-gray-500 font-medium pt-1">
                            <div className="flex flex-col">
                              <span>Children (x{children})</span>
                              <span className="text-[10px] text-primary font-black">{formatPrice(applicableTier?.childPrice || 0)} / child</span>
                            </div>
                            <span className="font-bold">{formatPrice((applicableTier?.childPrice || 0) * children)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedAddOns.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-gray-50">
                        <p className="text-xs font-bold text-primary tracking-tight">
                          Added Extras
                        </p>
                        {selectedAddOns.map((a) => (
                          <div
                            key={a.id}
                            className="flex justify-between items-center animate-in fade-in slide-in-from-right-2"
                          >
                            <span className="text-xs text-gray-500 font-medium">
                              {a.name}{" "}
                              <span className="text-[8px] font-black opacity-40 ml-1">
                                x{a.quantity}
                              </span>
                            </span>
                            <span className="text-xs font-bold text-gray-600">
                              {formatPrice(a.price * a.quantity)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Total Bar */}
                  <div className="pt-8 border-t-2 border-dashed border-gray-100">
                    {summary.discount > 0 && (
                      <div className="flex justify-between items-center mb-4 text-emerald-600">
                        <span className="text-xs font-bold tracking-tight">
                          Coupon Discount
                        </span>
                        <span className="font-bold">
                          -{formatPrice(summary.discount)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-baseline mb-2">
                      <span className="text-sm font-bold text-gray-900 tracking-tight">
                        Total Estimate
                      </span>
                      <span className="text-xs font-medium text-gray-400">
                        All taxes included
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-3xl font-black text-primary font-display tracking-tighter leading-none">
                        {formatPrice(summary.grandTotal)}
                      </span>
                      <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-primary shadow-inner">
                        <Rocket className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Coupon Input */}
              <div className="bg-white rounded-[20px] border border-gray-100 p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="h-4 w-4 text-emerald-500" />
                  <h4 className="text-xs font-bold text-gray-900">
                    Have a coupon?
                  </h4>
                </div>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100 animate-in zoom-in-95">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-emerald-900">
                          {appliedCoupon.code} Applied
                        </p>
                        <p className="text-xs text-emerald-600 font-bold">
                          Saved{" "}
                          {appliedCoupon.discountType === "percentage"
                            ? `${appliedCoupon.discountValue}%`
                            : formatPrice(appliedCoupon.discountValue)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setAppliedCoupon(null)}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-800"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Coupon Code"
                        value={couponInput}
                        onChange={(e) =>
                          setCouponInput(e.target.value.toUpperCase())
                        }
                        className="flex-1 rounded-xl border-2 border-gray-50 bg-gray-50/30 p-3 pr-4 focus:border-primary focus:outline-none font-bold text-sm transition-all"
                      />
                      <button
                        onClick={handleApplyCoupon}
                        disabled={isValidatingCoupon || !couponInput}
                        className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold text-xs hover:bg-black transition-all disabled:opacity-50"
                      >
                        {isValidatingCoupon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Apply"
                        )}
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[10px] text-red-500 font-bold pl-1 animate-pulse">
                        {couponError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Assistance Card */}
              <div className="bg-gray-900 rounded-[20px] p-8 text-white relative overflow-hidden group">
                <div className="absolute -right-8 -bottom-8 h-40 w-40 bg-white/5 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-700" />
                <div className="relative z-10 space-y-4">
                  <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-emerald-400" />
                  </div>
                  <h4 className="font-black tracking-tight text-sm">
                    Need Consultation?
                  </h4>
                  <p className="text-xs text-white/60 font-medium leading-relaxed">
                    Our local experts are available 24/7 to help you refine your
                    itinerary.
                  </p>
                  <button className="flex items-center gap-2 text-xs font-bold tracking-tight text-emerald-400 hover:text-white transition-colors">
                    Chat With Us Now <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Rocket(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-5c1.62-2.2 5-4 5-4" />
      <path d="M12 15v5s3.03-.55 5-2c2.2-1.62 4-5 4-5" />
      <line x1="11.5" y1="15.5" x2="15.5" y2="11.5" />
    </svg>
  );
}
