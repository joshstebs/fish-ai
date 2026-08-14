import React, { useEffect, useState } from 'react';
import { CreditCard, Mail, RefreshCw, Settings, ShieldCheck } from 'lucide-react';
import {
  fetchBillingStatus,
  getStoredEmail,
  getCustomerId,
  startCheckout,
  openBillingPortal,
  type BillingStatus,
} from '../utils/billing';

/**
 * Settings tab — account & subscription management.
 * Billing state comes live from Stripe (via /api/billing/status); the Manage
 * button opens the Stripe Customer Portal for cancel / payment / invoices.
 */
export function SettingsView() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [email, setEmail] = useState<string>(getStoredEmail());
  const [busy, setBusy] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingStatus().then(setBilling);
  }, []);

  const handleStartTrial = async () => {
    const trimmed = email.trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) {
      setError('Enter a valid email address to start your free trial.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const { url } = await startCheckout(trimmed);
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message || 'Could not start checkout. Please try again.');
    } finally {
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
    } finally {
      setBusy(false);
    }
  };

  const statusLabel = billing?.entitled
    ? billing.status === 'trialing' && billing.trialEndsAt
      ? `Premium trial active — ends ${new Date(billing.trialEndsAt * 1000).toLocaleDateString()}`
      : 'Premium subscription active'
    : billing
      ? 'No active subscription'
      : 'Loading...';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-sky-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-3 py-1 bg-sky-600 text-white font-black text-xs uppercase tracking-widest rounded">
            FishAI Settings
          </span>
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Account & Subscription
          </span>
        </div>
        <h2 className="font-display text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-sky-400" /> Your Plan & Device
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Manage your FishAI Premium subscription — billing is handled securely by Stripe.
        </p>
      </div>

      {/* Subscription Status */}
      <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Subscription Status
              </span>
              <span
                className={`text-sm font-black uppercase tracking-wide ${
                  billing?.entitled ? 'text-emerald-400' : 'text-slate-300'
                }`}
              >
                {statusLabel}
              </span>
            </div>
          </div>
          <button
            onClick={() => fetchBillingStatus().then(setBilling)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-950/40 border border-red-500/30 p-3 rounded-xl text-red-300 text-xs font-mono">
            {error}
          </div>
        )}

        {getCustomerId() && billing?.entitled && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleManage}
              disabled={busy}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg transition-all active:scale-95 disabled:opacity-50"
            >
              {busy ? 'Opening...' : 'Manage Subscription'}
            </button>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              Cancel, update payment method, or view invoices
            </span>
          </div>
        )}

        {!billing?.entitled && (
          <div className="space-y-3">
            <p className="text-slate-400 text-xs font-mono">
              {getCustomerId()
                ? 'Your trial has ended or the subscription was canceled.'
                : 'Start a 7-day free trial — $7.99/mo after. Cancel anytime.'}
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleStartTrial(); }}
                placeholder="you@email.com"
                className="flex-1 min-w-[180px] bg-slate-950 border border-slate-800 text-white text-xs font-bold uppercase tracking-wider font-mono rounded-lg px-3 py-2.5 focus:border-emerald-500 outline-none"
              />
              <button
                onClick={handleStartTrial}
                disabled={busy}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg transition-all active:scale-95 disabled:opacity-50"
              >
                {busy ? 'Opening...' : getCustomerId() ? 'Subscribe $7.99/mo' : 'Start Free Trial'}
              </button>
            </div>
            {getCustomerId() && (
              <button
                onClick={handleManage}
                disabled={busy}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-colors"
              >
                Manage subscription
              </button>
            )}
          </div>
        )}
      </div>

      {/* Device / Account Info */}
      <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-sky-400" /> Account on this device
        </span>
        <p className="text-sm text-slate-300 font-mono">
          {email ? email : 'No email set yet — start a free trial to link one.'}
        </p>
        <p className="text-[10px] font-mono text-slate-500">
          Your subscription is tied to this device via Stripe. Clearing browser data
          will remove it — use Manage Subscription first if you switch devices.
        </p>
      </div>
    </div>
  );
}
