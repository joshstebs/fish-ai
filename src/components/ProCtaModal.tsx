import React from 'react';
import { X, Check, Sparkles, Loader2, CreditCard } from 'lucide-react';
import {
  getStoredEmail,
  startCheckout,
  openBillingPortal,
  fetchBillingStatus,
  requestAccountRecovery,
  type BillingStatus,
} from '../utils/billing';

import { PRO_FEATURES, PRO_MONTHLY_PRICE, PRO_TRIAL_DAYS } from '../utils/proPlan';

interface ProCtaModalProps {
  onClose: () => void;
  onEntitled?: (status: BillingStatus) => void;
}

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
    if (!/^\S+@\S+\.\S+$/.test(clean) || clean.length > 254) {
      setMsg('Enter a valid email address to continue.');
      return;
    }
    setBusy(true);
    try {
      const { url } = await startCheckout(clean);
      window.location.href = url;
    } catch (e) {
      const error = e as Error & { code?: string };
      setMsg(error.code === 'ACCOUNT_EXISTS'
        ? 'A subscription already uses this email. Request a secure sign-in link below.'
        : error.message || 'Could not start checkout. Please try again.');
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
            Identify a fish and estimate its size from a catch photo.
          </p>

          <div className="mt-5 flex items-end gap-2">
            <span className="text-3xl font-black font-mono text-white">{PRO_MONTHLY_PRICE}</span>
            <span className="text-xs font-mono uppercase text-slate-400 pb-1">/month</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-emerald-400 text-xs font-black uppercase tracking-wider">
            <span>{PRO_TRIAL_DAYS}-day free trial</span>
            <span className="text-slate-500 font-mono normal-case">· cancel anytime</span>
          </div>

          <ul className="mt-5 space-y-2.5">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </span>
                <span className="text-sm text-slate-200 font-medium">{f}</span>
              </li>
            ))}
          </ul>

          <form onSubmit={(event) => { event.preventDefault(); void handleUpgrade(); }}>
            {!entitled && (
              <label className="mt-5 block text-sm font-medium text-slate-200">
                Email for your trial
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-base text-white focus:border-emerald-500 focus:outline-none"
                />
              </label>
            )}

            {msg && <p role="status" className="mt-2 text-xs text-amber-300">{msg}</p>}

            <button
              type="submit"
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
              {entitled ? 'Manage subscription' : 'Continue to Stripe'}
            </button>
          </form>

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
            {entitled ? 'Manage billing securely in Stripe.' : `After the trial, ${PRO_MONTHLY_PRICE}/month unless you cancel. Stripe shows the billing currency and renewal date before you confirm.`}
          </p>
        </div>
      </div>
    </div>
  );
};
