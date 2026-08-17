import React, { useState, useId } from 'react';
import { ChevronDown } from 'lucide-react';

interface FoldProps {
  /** Header label shown on the fold button. */
  title: string;
  /** Optional leading icon (pass a lucide element). */
  icon?: React.ReactNode;
  /** Open by default? Defaults to closed. */
  defaultOpen?: boolean;
  /** Optional small badge (e.g. a count) on the right side of the label. */
  badge?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Accessible collapsible section ("fold") used to declutter long views.
 * Smooth open/close via CSS grid rows so no JS height measurement is needed,
 * and the button exposes aria-expanded / aria-controls for screen readers.
 */
export const Fold: React.FC<FoldProps> = ({
  title,
  icon,
  defaultOpen = false,
  badge,
  children,
  className = '',
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const panelId = `fold-panel-${id}`;

  return (
    <div className={`bg-slate-900 border border-white/10 rounded-xl shadow-xl ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] rounded-xl cursor-pointer"
      >
        <span className="flex items-center gap-2.5 min-w-0">
          {icon && <span className="text-emerald-400 shrink-0">{icon}</span>}
          <span className="text-xs font-black uppercase tracking-wider text-white truncate">{title}</span>
          {badge && (
            <span className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
              {badge}
            </span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <div id={panelId} className={`fold-panel ${open ? 'fold-panel-open' : ''}`}>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
};

export default Fold;
