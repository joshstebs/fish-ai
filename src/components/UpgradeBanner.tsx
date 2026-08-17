import React, { useEffect, useState } from 'react';
import { Sparkles, Check } from 'lucide-react';
import { fetchBillingStatus, startCheckout } from '../utils/billing';

/**
 * Conversion CTA shown only to non-entitled (free) users.
 * Wires into the EXISTING Stripe trial flow (startCheckout in utils/billing.ts)
 * — no new backend, no fake data. Hidden automatically once entitled.
 */
export const UpgradeBanner: React.FC = () => {
  const [entitled, setEntitled] = useState<boolean | null>(null);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchBillingStatus().then((s) => {
      if (!cancelled) setEntitled(s.entitled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (entitled === null || entitled === true) return null;

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { url } = await startCheckout(email.trim());
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message || 'Could not start the trial. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-start gap-3 min-w-0">
        <span className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 shadow shrink-0">
          <Sparkles className="w-5 h-5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-black uppercase tracking-wider text-white">
            Unlock AI Estimates & Personal Reports
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            <Check className="w-3 h-3 inline text-emerald-400" /> 7-day free trial · then $7.99/mo · cancel anytime
          </p>
        </div>
      </div>
      <form onSubmit={handleStart} className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          className="flex-1 sm:w-44 bg-slate-950 border border-slate-800 text-white text-xs px-3 py-2.5 rounded-lg focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg transition-all shrink-0"
        >
          {busy ? 'Starting…' : 'Start Free Trial'}
        </button>
      </form>
      {error && <p className="text-[11px] text-red-400 font-mono w-full">{error}</p>}
    </div>
  );
};

export default UpgradeBanner;
