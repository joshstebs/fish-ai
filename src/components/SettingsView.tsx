import React, { useEffect, useState } from 'react';
import { CreditCard, Mail, RefreshCw, Settings, ShieldCheck } from 'lucide-react';
import {
  fetchBillingStatus,
  getStoredEmail,
  openBillingPortal,
  requestAccountRecovery,
  startCheckout,
  type BillingStatus,
} from '../utils/billing';

export function SettingsView() {
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [email, setEmail] = useState(getStoredEmail());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    setBilling(await fetchBillingStatus());
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function start() {
    const clean = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(clean)) {
      setMessage('Enter a valid email address.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const { url } = await startCheckout(clean);
      window.location.href = url;
    } catch (error) {
      setMessage((error as Error).message || 'Could not start checkout.');
    } finally {
      setBusy(false);
    }
  }

  async function manage() {
    setBusy(true);
    setMessage(null);
    try {
      window.location.href = await openBillingPortal();
    } catch (error) {
      setMessage((error as Error).message || 'Could not open billing.');
    } finally {
      setBusy(false);
    }
  }

  async function recover() {
    const clean = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(clean)) {
      setMessage('Enter the email used for the subscription.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      setMessage(await requestAccountRecovery(clean));
    } catch (error) {
      setMessage((error as Error).message || 'Could not start secure recovery.');
    } finally {
      setBusy(false);
    }
  }

  const label = billing?.entitled
    ? billing.status === 'trialing' && billing.trialEndsAt
      ? `Trial active until ${new Date(billing.trialEndsAt * 1000).toLocaleDateString()}`
      : 'Subscription active'
    : billing
      ? 'No active subscriber session'
      : 'Loading...';

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border-l-4 border-sky-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-3 py-1 bg-sky-600 text-white font-black text-xs uppercase tracking-widest rounded">Settings</span>
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Secure billing session
          </span>
        </div>
        <h2 className="font-display text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-sky-400" /> Plan & Account
        </h2>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <CreditCard className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Status</span>
              <span className={`text-sm font-black uppercase tracking-wide ${billing?.entitled ? 'text-emerald-400' : 'text-slate-300'}`}>{label}</span>
            </div>
          </div>
          <button onClick={() => void refresh()} className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {message && <div className="bg-slate-950 border border-white/10 p-3 rounded-xl text-slate-300 text-xs font-mono">{message}</div>}

        {billing?.entitled ? (
          <button onClick={() => void manage()} disabled={busy} className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg disabled:opacity-50">
            {busy ? 'Opening...' : 'Manage Subscription'}
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-slate-400 text-xs font-mono">Start a 7-day trial or recover an existing subscription securely by email.</p>
            <div className="flex flex-wrap gap-2">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@email.com"
                autoComplete="email"
                className="flex-1 min-w-[190px] bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-lg px-3 py-2.5 focus:border-emerald-500 outline-none"
              />
              <button onClick={() => void start()} disabled={busy} className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg disabled:opacity-50">
                Start Free Trial
              </button>
            </div>
            <button onClick={() => void recover()} disabled={busy} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400">
              Email secure sign-in link for an existing subscription
            </button>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-3">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <Mail className="w-3.5 h-3.5 text-sky-400" /> Local account hint
        </span>
        <p className="text-sm text-slate-300 font-mono">{email || 'No subscription email stored on this device.'}</p>
        <p className="text-[10px] font-mono text-slate-500">
          Stripe customer IDs and the owner password are never used as browser authorization credentials.
        </p>
      </div>
    </div>
  );
}
