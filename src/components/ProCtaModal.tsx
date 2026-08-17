import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Zap,
  Camera,
  Ruler,
  Scale,
  ShieldCheck,
  MapPin,
  Crosshair,
  CreditCard,
  Fish,
  Lock,
} from 'lucide-react';
import {
  getCustomerId,
  getStoredEmail,
  fetchBillingStatus,
  startCheckout,
  openBillingPortal,
  type BillingStatus,
} from '../utils/billing';

/**
 * ProCtaModal — redesigned PRO upgrade modal for FishAI.
 *
 * Concept-driven redesign: photo-gallery asset strip on the left (real
 * underwater species shots), value props + email capture + trial CTA on the
 * right. Replaces the old inline billing card. Self-contained: owns its
 * email/busy/error state and calls the same billing utils the estimator uses,
 * so checkout + portal behaviour is unchanged. No fabricated data, no fake
 * reviews, no invented metrics.
 */

const GALLERY = [
  { src: '/assets/pro-cta/muskie.jpg', label: 'Musky' },
  { src: '/assets/pro-cta/catfish.jpg', label: 'Catfish' },
  { src: '/assets/pro-cta/bluegill.jpg', label: 'Bluegill' },
  { src: '/assets/pro-cta/walleye.jpg', label: 'Walleye' },
  { src: '/assets/pro-cta/trout.jpg', label: 'Trout' },
];

interface ProCtaModalProps {
  onClose: () => void;
  onEntitled: (status: BillingStatus) => void;
}

export const ProCtaModal: React.FC<ProCtaModalProps> = ({ onClose, onEntitled }) => {
  const isRenewal = Boolean(getCustomerId());
  const [email, setEmail] = useState<string>(getStoredEmail());
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [activePhoto, setActivePhoto] = useState<number>(0);

  const handleStartTrial = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Enter a valid email address to start your free trial.');
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const { url } = await startCheckout(trimmed);
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message || 'Could not start checkout. Please try again.');
      setBusy(false);
    }
  };

  const handleManage = async () => {
    setBusy(true);
    setError(null);
    try {
      const url = await openBillingPortal();
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message || 'Could not open the billing portal.');
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (busy) return; // never close mid-checkout
    onClose();
  };

  const benefits = [
    { icon: <Camera className="w-4 h-4" />, text: 'Species ID with confidence score from any photo' },
    { icon: <Ruler className="w-4 h-4" />, text: 'Length & weight estimates using photo scale' },
    { icon: <ShieldCheck className="w-4 h-4" />, text: 'Local harvest rules: size limits, bag limits, legality' },
    { icon: <Crosshair className="w-4 h-4" />, text: 'Scale reference detection with calibration overlay' },
    { icon: <MapPin className="w-4 h-4" />, text: 'Spot tagging with GPS-backed location cards' },
    { icon: <Sparkles className="w-4 h-4" />, text: 'Tackle recommendations tuned to the catch' },
  ];

  return (
    <div className="fixed inset-0 z-[60] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2 relative">
        {/* Close */}
        <button
          onClick={handleClose}
          aria-label="Close"
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-slate-800/90 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT — Photo gallery asset strip */}
        <div className="relative bg-slate-950 hidden lg:flex flex-col">
          <div className="relative flex-1 min-h-[320px]">
            <img
              src={GALLERY[activePhoto].src}
              alt={GALLERY[activePhoto].label}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-4 left-4 z-10">
              <div className="inline-flex items-center gap-1.5 bg-slate-950/80 border border-emerald-500/40 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                <Fish className="w-3 h-3" /> {GALLERY[activePhoto].label}
              </div>
            </div>
          </div>

          {/* Thumbnail strip */}
          <div className="bg-slate-950/95 border-t border-white/10 p-2.5 flex gap-2">
            {GALLERY.map((g, i) => (
              <button
                key={g.src}
                onClick={() => setActivePhoto(i)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all shrink-0 ${
                  activePhoto === i
                    ? 'border-emerald-400 shadow-lg shadow-emerald-500/20'
                    : 'border-slate-700 opacity-70 hover:opacity-100'
                }`}
                aria-label={g.label}
              >
                <img src={g.src} alt={g.label} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          <div className="bg-slate-950/95 border-t border-white/10 px-4 py-3 flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Real underwater photos
            </span>
            <span className="text-[10px] font-mono text-slate-600">•</span>
            <span className="text-[10px] font-mono text-slate-500">No fake data. Ever.</span>
          </div>
        </div>

        {/* RIGHT — Value props + capture */}
        <div className="p-6 sm:p-8 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
                FishAI Pro
              </span>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> AI Vision
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-black uppercase text-white tracking-tight">
              {isRenewal ? 'Your Trial Has Ended' : 'Unlock AI Fish Identification'}
            </h2>
            <p className="text-slate-400 text-sm font-mono">
              {isRenewal
                ? 'Resubscribe to keep analyzing your catches.'
                : 'One photo. Species, size, harvest rules, tackle — in seconds.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {benefits.map((b, idx) => (
              <div key={idx} className="flex items-center gap-2.5 bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2.5">
                <span className="w-7 h-7 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                  {b.icon}
                </span>
                <span className="text-[11px] font-mono text-slate-300 leading-snug">{b.text}</span>
              </div>
            ))}
          </div>

          {/* Email capture */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleStartTrial(); }}
                placeholder="you@email.com"
                className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs font-bold uppercase tracking-wider font-mono rounded-lg px-3 py-3 focus:border-emerald-500 outline-none"
              />
              <button
                onClick={handleStartTrial}
                disabled={busy}
                className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg shadow-xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {busy ? (
                  'Opening...'
                ) : isRenewal ? (
                  <>
                    <CreditCard className="w-4 h-4" /> Subscribe $7.99/mo
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" /> Start Free Trial
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-lg text-red-300 text-xs font-mono">
                {error}
              </div>
            )}
            {msg && (
              <div className="bg-emerald-950/40 border border-emerald-500/30 p-3 rounded-lg text-emerald-300 text-xs font-mono">
                {msg}
              </div>
            )}
            <p className="text-center text-[10px] text-slate-500 font-mono">
              {isRenewal ? 'Manage or cancel your plan anytime.' : '7-day free trial · $7.99/mo after · Cancel anytime'}
            </p>
          </div>

          {isRenewal && (
            <button
              onClick={handleManage}
              disabled={busy}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider rounded-lg border border-slate-700 flex items-center justify-center gap-2 transition-all"
            >
              <CreditCard className="w-4 h-4 text-emerald-400" /> Manage subscription
            </button>
          )}

          <div className="flex items-center justify-center gap-2 pt-1">
            <Lock className="w-3 h-3 text-slate-600" />
            <span className="text-[10px] font-mono text-slate-600">
              Secure Stripe checkout · No app password needed
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};