import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Lock, LogIn, X } from 'lucide-react';
import { verifyOwnerPassword } from '../utils/apiAuth';

interface OwnerSignInModalProps {
  open: boolean;
  onClose: () => void;
  onSignedIn: () => void;
}

export const OwnerSignInModal: React.FC<OwnerSignInModalProps> = ({
  open,
  onClose,
  onSignedIn,
}) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function submit() {
    const clean = password.trim();
    if (!clean) {
      setError('Enter the owner password.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await verifyOwnerPassword(clean);
    setBusy(false);

    if (!result.ok) {
      setError(result.error || 'Sign-in failed.');
      return;
    }

    setPassword('');
    setSuccess(true);
    onSignedIn();
    window.setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 450);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Owner sign in"
    >
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Owner Sign In</h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Password is exchanged for a short-lived encrypted session.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          onKeyDown={(event) => { if (event.key === 'Enter') void submit(); }}
          placeholder="Owner password"
          autoComplete="current-password"
          autoFocus
          className="w-full bg-slate-950 border border-slate-800 text-white text-sm font-mono rounded-lg px-3 py-3 focus:border-emerald-500 outline-none"
        />

        <button
          onClick={() => void submit()}
          disabled={busy}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <LogIn className="w-4 h-4" />
          {busy ? 'Verifying...' : 'Sign In'}
        </button>

        {success && (
          <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-3 py-2.5 text-emerald-300 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4" /> Secure owner session created.
          </div>
        )}
        {error && !success && (
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2.5 text-red-300 text-xs font-mono">
            <AlertTriangle className="w-4 h-4" /> {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerSignInModal;
