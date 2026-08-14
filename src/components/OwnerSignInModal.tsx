import React, { useState, useEffect } from 'react';
import { X, Lock, LogIn, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { verifyOwnerPassword, setAppSecret } from '../utils/apiAuth';

interface OwnerSignInModalProps {
  open: boolean;
  onClose: () => void;
  onSignedIn: () => void;
}

// Owner sign-in modal — validates the app password against the server
// before storing it on this device (localStorage).
export const OwnerSignInModal: React.FC<OwnerSignInModalProps> = ({ open, onClose, onSignedIn }) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // All hooks must run unconditionally (rules of hooks) — the early return
  // below is fine ONLY because it comes after every hook.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  // Close on Escape or backdrop tap (X button also works).
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSubmit = async () => {
    const pw = password.trim();
    if (!pw) {
      setError('Enter your app password.');
      return;
    }
    setBusy(true);
    setError(null);
    const result = await verifyOwnerPassword(pw);
    setBusy(false);
    if (result.ok) {
      setAppSecret(pw);
      setSuccess(true);
      setTimeout(() => {
        onSignedIn();
        onClose();
        setPassword('');
        setSuccess(false);
      }, 600);
    } else {
      setError(result.error || 'Sign-in failed.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={handleBackdrop}
    >
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-blue-600 flex items-center justify-center text-slate-950">
              <Lock className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white">Owner Sign In</h3>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">Unlocks AI analysis — free, no subscription</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSubmit();
            }}
            placeholder="App password"
            autoFocus
            className="w-full bg-slate-950 border border-slate-800 text-white text-sm font-mono rounded-lg px-3 py-3 focus:border-emerald-500 outline-none transition-colors"
          />
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-60"
          >
            {busy ? (
              <span className="animate-pulse">Verifying...</span>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </div>

        {success && (
          <div className="flex items-center gap-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg px-3 py-2.5 text-emerald-300 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> Signed in — AI analysis unlocked
          </div>
        )}
        {error && !success && (
          <div className="flex items-center gap-2 bg-red-950/40 border border-red-500/30 rounded-lg px-3 py-2.5 text-red-300 text-xs font-mono">
            <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerSignInModal;
