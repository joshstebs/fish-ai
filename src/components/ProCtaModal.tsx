import React from 'react';
import { X, Check, Sparkles, Loader2, CreditCard } from 'lucide-react';
import {
  getCustomerId,
  getStoredEmail,
  setStoredEmail,
  startCheckout,
  openBillingPortal,
  fetchBillingStatus,
} from '../utils/billing';

interface ProCtaModalProps {
  open: boolean;
  onClose: () => void;
}

const FEATURES = [
  'Unlimited Fish Species Recognition',
  'Advanced Fishing Tactics',
  'Personalized Fishing Reports',
  'Exclusive Fishing Community',
];

/** PRO upgrade modal — design per Josh's mockup (dark card, feature list, Upgrade Now). */
const ProCtaModal: React.FC<ProCtaModalProps> = ({ open, onClose }) => {
  const [email, setEmail] = React.useState<string>(getStoredEmail());
  const [busy, setBusy] = React.useState<boolean>(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [entitled, setEntitled] = React.useState<boolean>(false);

  // Hooks MUST come before any early return (React hook rules — regression trap from earlier).
  React.useEffect(() => {
    if (!open) return;
    setMsg(null);
    const cus = getCustomerId();
    if (!cus) { setEntitled(false); return; }
    fetchBillingStatus()
      .then((b) => setEntitled(!!b.entitled))
      .catch(() => setEntitled(false));
  }, [open]);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleUpgrade = async () => {
    const clean = email.trim();
    const cus = getCustomerId();
    if (busy) return;
    setMsg(null);
    if (cus) {
      // returner — send to the customer portal (manage/cancel)
      setBusy(true);
      try {
        const url = await openBillingPortal();
        window.location.href = url;
      } catch (e) {
        setMsg((e as Error)?.message || 'Could not open billing. Please try again.');
        setBusy(false);
      }
      return;
    }
    if (!clean) {
      setMsg('Enter your email to start your free trial.');
      return;
    }
    setBusy(true);
    try {
      setStoredEmail(clean);
      const { url } = await startCheckout(clean);
      window.location.href = url;
    } catch (e) {
      setMsg((e as Error)?.message || 'Could not start checkout. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Upgrade to FishAI Pro"
    >
      {/* dim backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* card */}
      <div className="relative w-full sm:max-w-sm bg-slate-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-[none]">
        {/* top accent */}
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />

        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
              FishAI Pro
            </span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase tracking-tight text-white leading-tight">
            Upgrade to FishAI Pro
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            AI catch intelligence that makes every trip better.
          </p>

          {/* pricing — annual emphasized (per mockup) */}
          <div className="mt-5 flex items-end gap-2">
            <span className="text-3xl font-black font-mono text-white">$9.99</span>
            <span className="text-xs font-mono uppercase text-slate-400 pb-1">/month</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-black font-mono">$99.99</span>
            <span className="text-xs font-mono uppercase text-slate-400">/year — save 17%</span>
          </div>

          {/* features */}
          <ul className="mt-5 space-y-2.5">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </span>
                <span className="text-sm text-slate-200 font-medium">{f}</span>
              </li>
            ))}
          </ul>

          {/* email for trial start */}
          {!getCustomerId() && (
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email for your free trial"
              className="mt-5 w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-emerald-500 placeholder:text-slate-500"
            />
          )}

          {msg && (
            <p className="mt-2 text-xs text-amber-400 font-mono">{msg}</p>
          )}

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={busy}
            className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-slate-950 font-black uppercase text-sm tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            {busy ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : entitled ? (
              <CreditCard className="w-4 h-4" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {entitled ? 'Manage Subscription' : 'Upgrade Now'}
          </button>

          <button
            onClick={onClose}
            className="mt-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black uppercase text-xs tracking-wider transition-all"
          >
            Cancel
          </button>

          <p className="mt-3 text-center text-[10px] font-mono text-slate-500">
            7-day free trial on the monthly plan · cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProCtaModal;
