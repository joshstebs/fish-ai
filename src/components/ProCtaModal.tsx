import React from 'react';
import { X, Check, Sparkles, Loader2, CreditCard } from 'lucide-react';
import {
  getStoredEmail,
  setStoredEmail,
  startCheckout,
  openBillingPortal,
  fetchBillingStatus,
  requestAccountRecovery,
  type BillingStatus,
} from '../utils/billing';

interface ProCtaModalProps {
  onClose: () => void;
  onEntitled?: (status: BillingStatus) => void;
}

const FEATURES = [
  'AI fish species recognition',
  'Size and weight estimation',
  'Catch confidence scoring',
  'Typical size limit reminders',
];

/**
 * ProCtaModal — PRO upgrade modal, faithful to Josh's design mockup
 * (dark card, emerald accent, "Upgrade to FishAI Pro", $7.99/mo with
 * 7-day trial (matches live Stripe price), 4 green-check features, Upgrade Now +
 * Cancel). Reuses the existing billing utils only — no backend changes.
 * Invocation contract preserved from the merged estimator wiring
 * (onClose + onEntitled, no `open` prop).
 */
export const ProCtaModal: React.FC<ProCtaModalProps> = ({ onClose, onEntitled }) => {
  const [email, setEmail] = React.useState<string>(getStoredEmail());
  const [busy, setBusy] = React.useState<boolean>(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [entitled, setEntitled] = React.useState<boolean>(false);

  const onEntitledRef = React.useRef(onEntitled);
  onEntitledRef.current = onEntitled;
  React.useEffect(() => {
    fetchBillingStatus()
      .then((b) => {
        setEntitled(!!b.entitled);
        if (b.entitled) onEntitledRef.current?.(b);
      })
      .catch(() => setEntitled(false));
  }, []);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleUpgrade = async () => {
    const clean = email.trim();
    if (busy) return;
    setMsg(null);
    if (entitled) {
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
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-sm bg-slate-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
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

          <div className="mt-5 flex items-end gap-2">
            <span className="text-3xl font-black font-mono text-white">$7.99</span>
            <span className="text-xs font-mono uppercase text-slate-400 pb-1">/month</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <span>✓ 7-day free trial</span>
            <span className="text-slate-500 font-mono normal-case">· cancel anytime</span>
          </div>

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

          {!entitled && (
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

          {!entitled && (
            <button
              onClick={async () => {
                if (busy) return;
                const clean = email.trim();
                if (!/^\S+@\S+\.\S+$/.test(clean)) { setMsg('Enter your subscription email.'); return; }
                setBusy(true);
                try { setMsg(await requestAccountRecovery(clean)); }
                catch (e) { setMsg((e as Error)?.message || 'Could not send sign-in link.'); }
                finally { setBusy(false); }
              }}
              disabled={busy}
              className="mt-2 w-full py-2 text-emerald-300 hover:text-white text-xs font-bold"
            >
              Already subscribed? Email me a secure sign-in link
            </button>
          )}

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
