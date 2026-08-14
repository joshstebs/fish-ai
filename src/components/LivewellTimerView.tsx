import React, { useState, useEffect } from 'react';
import { Timer, Play, Pause, RotateCcw, AlertTriangle, ShieldCheck, Waves, HeartPulse } from 'lucide-react';

export const LivewellTimerView: React.FC = () => {
  // Aerator Timer State (15 min countdown = 900 seconds)
  const [aeratorSecondsLeft, setAeratorSecondsLeft] = useState<number>(900);
  const [isAeratorRunning, setIsAeratorRunning] = useState<boolean>(false);

  // Handling Timer State (60 seconds out of water)
  const [handlingSecondsLeft, setHandlingSecondsLeft] = useState<number>(60);
  const [isHandlingRunning, setIsHandlingRunning] = useState<boolean>(false);

  // Aerator countdown interval
  useEffect(() => {
    let interval: any = null;
    if (isAeratorRunning && aeratorSecondsLeft > 0) {
      interval = setInterval(() => setAeratorSecondsLeft((prev) => prev - 1), 1000);
    } else if (aeratorSecondsLeft === 0) {
      setIsAeratorRunning(false);
    }
    return () => clearInterval(interval);
  }, [isAeratorRunning, aeratorSecondsLeft]);

  // Handling countdown interval
  useEffect(() => {
    let interval: any = null;
    if (isHandlingRunning && handlingSecondsLeft > 0) {
      interval = setInterval(() => setHandlingSecondsLeft((prev) => prev - 1), 1000);
    } else if (handlingSecondsLeft === 0) {
      setIsHandlingRunning(false);
    }
    return () => clearInterval(interval);
  }, [isHandlingRunning, handlingSecondsLeft]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-teal-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-teal-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
              FishAI Livewell Safety
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
              <HeartPulse className="w-3.5 h-3.5" /> Aeration & Handling Timers
            </span>
          </div>
          <h2 className="font-display text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            ⏱️ Livewell Aeration & Fish Health Timer
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Protect trophy fish health! Set livewell pump recirculation timers and track safe out-of-water photo handling times.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Aeration Recirculation Pump Timer */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-teal-400 font-mono">15-Min Cycle Timer</span>
              <h3 className="text-lg font-black text-white uppercase">Livewell Aerator Recirculation</h3>
            </div>
            <Waves className="w-6 h-6 text-teal-400 animate-pulse" />
          </div>

          <div className="text-center py-4 space-y-2 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-6xl font-black text-teal-400 font-mono tracking-widest block">
              {formatTime(aeratorSecondsLeft)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {aeratorSecondsLeft === 0 ? '⚠️ TIME TO RECIRCULATE AERATOR PUMP!' : 'Oxygenated Water Refresh Active'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsAeratorRunning(!isAeratorRunning)}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2"
            >
              {isAeratorRunning ? <><Pause className="w-4 h-4" /> Pause Pump</> : <><Play className="w-4 h-4" /> Start Aeration Cycle</>}
            </button>
            <button
              onClick={() => { setAeratorSecondsLeft(900); setIsAeratorRunning(false); }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-lg border border-slate-700 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {/* Safe Out-of-Water Handling Timer */}
        <div className="bg-slate-900 border border-white/10 p-6 rounded-xl space-y-4 shadow-xl flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 font-mono">60-Sec Handling Limit</span>
              <h3 className="text-lg font-black text-white uppercase">Out-Of-Water Handling Timer</h3>
            </div>
            <ShieldCheck className="w-6 h-6 text-amber-400" />
          </div>

          <div className="text-center py-4 space-y-2 bg-slate-950 rounded-xl border border-slate-800">
            <span className={`text-6xl font-black font-mono tracking-widest block ${handlingSecondsLeft < 15 ? 'text-red-400 animate-bounce' : 'text-amber-400'}`}>
              {formatTime(handlingSecondsLeft)}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {handlingSecondsLeft === 0 ? '🚨 RETURN FISH TO WATER IMMEDIATELY!' : 'Safe Photo & Measurement Window'}
            </span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setIsHandlingRunning(!isHandlingRunning)}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2"
            >
              {isHandlingRunning ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start Photo Timer</>}
            </button>
            <button
              onClick={() => { setHandlingSecondsLeft(60); setIsHandlingRunning(false); }}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-lg border border-slate-700 flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
