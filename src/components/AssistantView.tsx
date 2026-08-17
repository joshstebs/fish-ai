import React, { useEffect, useRef, useState } from 'react';
import { Bot, Sparkles, Send, ShieldCheck } from 'lucide-react';
import { CatchLogItem, ChatMessage, FishingSpot } from '../types/catchLogTypes';
import { AssistantContext, answerQuestion } from '../utils/assistant';
import { resolveWeatherCoords, fetchLiveWeather } from '../utils/weather';
import { getMoonInfo, getSunTimes, getSolunarPeriods } from '../utils/solunar';

interface AssistantViewProps {
  catches: CatchLogItem[];
  spots: FishingSpot[];
}

/**
 * The quick questions offered as chips on the empty chat.
 * (Same list the assistant engine suggests — kept local because
 * assistant.ts does not export its QUICK_QUESTIONS constant.)
 */
const QUICK_QUESTIONS = [
  'Where should I fish?',
  'What lure should I use?',
  'When is the best time to fish?',
  'How is today looking?',
  'Why haven\'t I caught anything?',
];

/** Small id generator (crypto.randomUUID is not guaranteed in all targets). */
function nextId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Render the assistant's plain-text markdown subset:
 * - **bold** -> <strong>
 * - lines starting with '• ' -> <li> inside a <ul>
 */
function renderInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <strong key={i} className="text-white font-bold">
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const blocks: React.ReactNode[] = [];
  let bulletGroup: string[] = [];

  const flushBullets = (key: string) => {
    if (bulletGroup.length > 0) {
      blocks.push(
        <ul key={key} className="list-disc list-inside space-y-1 pl-1">
          {bulletGroup.map((b, i) => (
            <li key={i} className="leading-relaxed">
              {renderInline(b.replace(/^\s*•\s*/, ''))}
            </li>
          ))}
        </ul>
      );
      bulletGroup = [];
    }
  };

  lines.forEach((line, idx) => {
    if (/^\s*•\s/.test(line)) {
      bulletGroup.push(line);
    } else {
      flushBullets(`ul-${idx}`);
      if (line.trim().length > 0) {
        blocks.push(
          <p key={`p-${idx}`} className="leading-relaxed">
            {renderInline(line)}
          </p>
        );
      }
    }
  });
  flushBullets('ul-end');

  return <>{blocks}</>;
}

export const AssistantView: React.FC<AssistantViewProps> = ({ catches, spots }) => {
  // Context is built synchronously with what we can compute offline; the
  // live weather + sun/solunar (which need coordinates) fill in on mount.
  const [ctx, setCtx] = useState<AssistantContext>(() => ({
    catches,
    spots,
    weather: null,
    moon: getMoonInfo(new Date()),
    sun: null,
    solunar: [],
  }));

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: nextId(),
      role: 'assistant',
      text:
        "Hey! I use **your** catch history, spots, live weather & solunar data.\n\nAsk me where to fish, what to throw, when to go, or how today looks.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<number | null>(null);

  // Keep the context's props fresh as the user logs catches / edits spots
  // (weather stays cached in the context — no refetch).
  useEffect(() => {
    setCtx((prev) => ({ ...prev, catches, spots }));
  }, [catches, spots]);

  // On mount: resolve coordinates (browser location, falling back to the
  // first saved spot), fetch live weather, and compute sun + solunar math.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const coords = await resolveWeatherCoords(spots);
      if (cancelled) return;

      const weather = coords ? await fetchLiveWeather(coords.latitude, coords.longitude) : null;
      if (cancelled) return;

      const now = new Date();
      const sun = coords ? getSunTimes(now, coords.latitude, coords.longitude) : null;
      const solunar = coords ? getSolunarPeriods(now, coords.latitude, coords.longitude) : [];

      setCtx((prev) => ({ ...prev, weather, sun, solunar }));
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only: spots are read via resolveWeatherCoords, and prop changes are handled above
  }, []);

  // Clear any pending typing timer on unmount.
  useEffect(() => {
    return () => {
      if (typingTimerRef.current !== null) window.clearTimeout(typingTimerRef.current);
    };
  }, []);

  // Keep the message list scrolled to the newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const sendMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMsg: ChatMessage = {
      id: nextId(),
      role: 'user',
      text: trimmed,
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setTyping(true);

    typingTimerRef.current = window.setTimeout(() => {
      typingTimerRef.current = null;
      const reply = answerQuestion(trimmed, ctx);
      const assistantMsg: ChatMessage = {
        id: nextId(),
        role: 'assistant',
        text: reply.text,
        suggestions: reply.suggestions,
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, assistantMsg]);
      setTyping(false);
    }, 500);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-emerald-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-3 py-1 bg-emerald-600 text-white font-black text-xs uppercase tracking-widest rounded">
            Fishing Assistant
          </span>
          <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Offline AI
          </span>
        </div>
        <h2 className="font-display text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
          <Bot className="w-6 h-6 text-emerald-400" /> Fishing Assistant
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Ask about spots, lures, timing, or conditions — from your data.
        </p>
        {/* Honest data-source label */}
        <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-t border-slate-800 pt-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>
            Your data only — no fake answers, ever.
          </span>
        </div>
      </div>

      {/* Chat Card */}
      <div className="bg-slate-900 border border-white/10 rounded-xl shadow-xl flex flex-col overflow-hidden">
        {/* Message List */}
        <div ref={scrollRef} className="p-4 space-y-4 max-h-[480px] overflow-y-auto">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[85%] sm:max-w-[75%] rounded-xl px-4 py-3 text-sm shadow-lg ${
                    isUser
                      ? 'bg-emerald-600 text-white rounded-br-sm'
                      : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-sm'
                  }`}
                >
                  {isUser ? <span className="whitespace-pre-wrap">{msg.text}</span> : renderMarkdown(msg.text)}
                </div>
                {!isUser && msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {msg.suggestions.map((s) => (
                      <button
                        key={s}
                        onClick={() => sendMessage(s)}
                        disabled={typing}
                        className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-300 hover:text-white text-[10px] font-bold uppercase tracking-wider rounded-full border border-slate-700/70 transition-all"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <span className="text-[9px] font-mono text-slate-600 mt-1">
                  {formatTime(new Date(msg.timestamp))}
                </span>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {typing && (
            <div className="flex items-start">
              <div className="bg-slate-800 border border-slate-700/60 rounded-xl rounded-bl-sm px-4 py-3 shadow-lg flex items-center gap-1.5">
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0ms' }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '120ms' }}
                />
                <span
                  className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
                  style={{ animationDelay: '240ms' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quick Questions (only on the fresh chat) */}
        {messages.length <= 1 && (
          <div className="px-4 pb-3 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                disabled={typing}
                className="px-3.5 py-2 bg-slate-800 hover:bg-emerald-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-[10px] font-black uppercase tracking-wider rounded-full border border-slate-700 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input Row */}
        <div className="p-4 pt-0 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="ASK ABOUT SPOTS, LURES, TIMING..."
            className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs font-bold uppercase tracking-wider pl-4 pr-3 py-3 rounded-lg focus:outline-none focus:border-emerald-500 font-mono placeholder:text-slate-600"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={typing || input.trim().length === 0}
            title="Send"
            className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition-all"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
