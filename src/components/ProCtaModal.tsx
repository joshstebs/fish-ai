import React from 'react';
import { Check, CreditCard, Loader2, ShieldCheck, Sparkles, X } from 'lucide-react';
import {
  fetchBillingStatus,
  getStoredEmail,
  openBillingPortal,
  requestAccountRecovery,
  setStoredEmail,
  startCheckout,
  type BillingStatus,
} from '../utils/billing';

interface ProCtaModalProps {
  onClose: () => void;
  onEntitled?: (status: BillingStatus) => void;
}

const FEATURES = [
  'AI species identification with a confidence score',
  'Visual length and weight estimates with explicit uncertainty',
  'Species-appropriate tackle suggestions',
  'No fabricated result when configured providers fail',
];

export const ProCtaModal: React.FC<ProCtaModalProps> = ({ onClose, onEntitled }) => {
  const [email, setEmail] = React.useState(getStoredEmail());
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [entitled, setEntitled] = React.useState(false);

  React.useEffect(() => {
    fetchBillingStatus().then((status) => {
      setEntitled(status.entitled);
      if (status.entitled) onEntitled?.(status);
    });
  }, [onEntitled]);

  React.useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handlePrimary() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      if (entitled) {
        window.location.href = await openBillingPortal();
        return;
      }
      const clean = email.trim().toLowerCase();
      if (!/^\S+@\S+\.\S+$/.test(clean)) {
        throw new Error('Enter a valid email address.');
      }
      setStoredEmail(clean);
      const { url } = await startCheckout(clean);
      window.location.href = url;
    } catch (error) {
      const e = error as Error & { code?: string };
      setMsg(e.message || 'Could not start checkout.');
    } finally {
      setBusy(false);
    }
  }

  async function recover() {
    const clean = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(clean)) {
      setMsg('Enter the subscription email first.');
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      setMsg(await requestAccountRecovery(clean));
    } catch (error) {
      setMsg((error as Error).message || 'Could not start secure recovery.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="FishAI Pro">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-slate-900 border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
        <button onClick={onClose} aria-label="Close" className="absolute top-3 right-3 p-2 rounded-full bg-slate-800/80 text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>

        <div className="p-6 sm:p-7">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">FishAI Pro</span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase tracking-tight text-white">AI catch analysis</h2>
          <p className="mt-1 text-xs text-slate-400">7-day free trial, then $7.99 USD/month. Cancel through Stripe.</p>

          <ul className="mt-5 space-y-2.5">
            {FEATURES.map((feature) => (
              <li key={feature} className="flex items-start gap-2.5">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center shrink-0">
                  <Check className="w-2.5 h-2.5 text-emerald-400" />
                </span>
                <span className="text-sm text-slate-200">{feature}</span>
              </li>
            ))}
          </ul>

          {!entitled && (
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Email for checkout or recovery"
              autoComplete="email"
              className="mt-5 w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono focus:outline-none focus:border-emerald-500"
            />
          )}

          {msg && <p className="mt-3 text-xs text-amber-300 font-mono leading-relaxed">{msg}</p>}

          <button
            onClick={() => void handlePrimary()}
            disabled={busy}
            className="mt-4 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-60 text-slate-950 font-black uppercase text-sm tracking-wider flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : entitled ? <CreditCard className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {entitled ? 'Manage Subscription' : 'Start Secure Checkout'}
          </button>

          {!entitled && (
            <button
              onClick={() => void recover()}
              disabled={busy}
              className="mt-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" /> Already subscribed? Email secure sign-in link
            </button>
          )}

          <p className="mt-4 text-center text-[10px] font-mono text-slate-500 leading-relaxed">
            AI estimates are not legal or regulatory determinations. By continuing you agree to the{' '}
            <a className="underline hover:text-slate-300" href="/terms.html">Terms</a> and{' '}
            <a className="underline hover:text-slate-300" href="/privacy.html">Privacy Policy</a>.
          </p>
        </div>
      </div>
    </div>
  );
};
