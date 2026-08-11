// ============================================================================
// FISHAI ASSISTANT — offline rule-based engine that answers from REAL app
// data: your catches, spots, live weather, solunar math, and general fishing
// knowledge. When GEMINI_API_KEY is configured the backend can enhance
// answers, but this engine always works offline and never fabricates data.
// ============================================================================
import {
  CatchLogItem,
  FishingSpot,
  LiveWeather,
  MoonInfo,
  SolunarPeriod,
  SunTimes,
} from '../types/catchLogTypes';
import { analyzeCatches, speciesOf } from './insights';
import { formatTime } from './solunar';
import { recommendLures } from './report';

export interface AssistantContext {
  catches: CatchLogItem[];
  spots: FishingSpot[];
  weather: LiveWeather | null;
  moon: MoonInfo | null;
  sun: SunTimes | null;
  solunar: SolunarPeriod[];
}

export interface AssistantReply {
  text: string;
  suggestions?: string[];
}

const QUICK_QUESTIONS = [
  'Where should I fish?',
  'What lure should I use?',
  'When is the best time to fish?',
  'How is today looking?',
  'Why haven\'t I caught anything?',
];

function windCompass(w: LiveWeather['current']): string {
  return `${w.windSpeedMph} mph ${w.windDirection}`;
}

export function answerQuestion(q: string, ctx: AssistantContext): AssistantReply {
  const ql = q.toLowerCase();
  const insights = analyzeCatches(ctx.catches);
  const weather = ctx.weather;
  const moon = ctx.moon;
  const solunar = ctx.solunar;

  const speciesMentioned = Object.keys({
    'largemouth': 'Largemouth Bass',
    'bass': 'Bass',
    'smallmouth': 'Smallmouth Bass',
    'pike': 'Northern Pike',
    'walleye': 'Walleye',
    'trout': 'Trout',
    'catfish': 'Catfish',
    'crappie': 'Crappie',
    'bluegill': 'Bluegill',
    'perch': 'Yellow Perch',
    'salmon': 'Salmon',
    'redfish': 'Red Drum',
    'snook': 'Snook',
    'tarpon': 'Tarpon',
    'musky': 'Muskellunge',
  }).find((k) => ql.includes(k));

  // --- WHERE ---
  if (ql.includes('where') || ql.includes('spot') || ql.includes('lake') || ql.includes('go fish')) {
    if (insights.bestSpot) {
      return {
        text: `Based on your log, your best spot is **${insights.bestSpot.name}** — ${insights.bestSpot.catches} of your ${insights.totalCatches} catches came from there.${ctx.spots.length ? ` You also have ${ctx.spots.length - 1} other saved spot${ctx.spots.length > 2 ? 's' : ''} to rotate through.` : ''}`,
        suggestions: ['What lure should I use?', 'When is the best time to fish?'],
      };
    }
    if (ctx.spots.length > 0) {
      return {
        text: `You have ${ctx.spots.length} saved spot${ctx.spots.length > 1 ? 's' : ''}: ${ctx.spots.slice(0, 4).map((s) => s.name).join(', ')}${ctx.spots.length > 4 ? '…' : ''}. Log some catches and I'll tell you which one produces best for you.`,
        suggestions: ['Where should I fish?', 'How is today looking?'],
      };
    }
    return {
      text: 'You haven\'t saved any fishing spots yet. Add your first spot in the **Spot Map** tab, then come back and ask me again.',
      suggestions: ['How is today looking?'],
    };
  }

  // --- WHAT LURE ---
  if (ql.includes('lure') || ql.includes('bait') || ql.includes('throw') || ql.includes('use') || ql.includes('tackle')) {
    const target = speciesMentioned || insights.speciesStats[0]?.commonName || 'Largemouth Bass';
    const lures = recommendLures(ctx.catches, target, weather, 3);
    if (lures.length > 0) {
      return {
        text: `For **${target}** right now:\n${lures.map((l) => `• ${l.name} — ${l.reason}`).join('\n')}${weather ? `\n\nConditions: ${weather.current.temperatureF}°F, ${weather.current.condition}, wind ${windCompass(weather.current)}.` : ''}`,
        suggestions: ['When is the best time to fish?', 'Why haven\'t I caught anything?'],
      };
    }
    return {
      text: `You haven't logged any ${target} catches yet, so I'll fall back to general knowledge: try a soft plastic (Senko or jig) in natural colors, or a spinnerbait on windy days. Log your catches and my lure picks will be based on your own success.`,
      suggestions: ['Where should I fish?', 'How is today looking?'],
    };
  }

  // --- WHEN / BEST TIME ---
  if (ql.includes('when') || ql.includes('time') || ql.includes('tomorrow') || ql.includes('tonight') || ql.includes('morning') || ql.includes('best hour')) {
    const parts: string[] = [];
    if (insights.bestHourRange !== '—') {
      parts.push(`your personal best window is **${insights.bestHourRange}** (${insights.totalCatches} logged catches)`);
    }
    if (solunar.length) {
      const next = solunar.find((p) => p.end.getTime() > Date.now());
      if (next) parts.push(`the next solunar ${next.type.toLowerCase()} period is **${formatTime(next.start)} – ${formatTime(next.end)}**`);
    }
    if (ctx.sun) parts.push(`sunrise is ${formatTime(ctx.sun.sunrise)}, sunset ${formatTime(ctx.sun.sunset)}`);
    return {
      text: parts.length ? `Best times to fish:\n• ${parts.join('\n• ')}` : 'Log some catches and I can find your personal best fishing window.',
      suggestions: ['How is today looking?', 'What lure should I use?'],
    };
  }

  // --- TODAY / CONDITIONS ---
  if (ql.includes('today') || ql.includes('tonight') || ql.includes('condition') || ql.includes('weather') || ql.includes('forecast') || ql.includes('how is')) {
    if (!weather) {
      return {
        text: 'I can\'t fetch live weather without location access (browser permission). Allow location or add a spot with coordinates, and I\'ll give you a full conditions read.',
        suggestions: ['When is the best time to fish?', 'Where should I fish?'],
      };
    }
    const trendText = weather.pressureTrend === 'FALLING' ? 'pressure is falling — classic pre-front feeding trigger' : weather.pressureTrend === 'RISING' ? 'pressure is rising — post-front fish can be sluggish' : 'pressure is steady';
    const moonText = moon ? `${moon.phaseName} (${moon.illuminationPct}% illuminated)` : 'moon data unavailable';
    return {
      text: `Right now: **${weather.current.temperatureF}°F**, ${weather.current.condition}, wind ${windCompass(weather.current)}, ${weather.current.pressureInHg} inHg and ${trendText}.\n\nMoon: ${moonText}.\n\n${insights.bestSkyCondition ? `Your history says you catch more in ${insights.bestSkyCondition.condition.toLowerCase()} conditions.` : 'Log catches with weather and I\'ll learn your best conditions.'}`,
      suggestions: ['What lure should I use?', 'When is the best time to fish?'],
    };
  }

  // --- WHY NOT CATCHING ---
  if (ql.includes('why') || ql.includes('not catching') || ql.includes('nothing') || ql.includes('skunk') || ql.includes('no luck')) {
    const parts: string[] = [];
    if (weather) {
      if (weather.pressureTrend === 'RISING') parts.push('pressure has been rising, which typically slows feeding — downsize and slow down (finesse presentations)');
      if (weather.current.windSpeedMph > 15) parts.push('it\'s windy — fish hold tight to cover; target protected banks');
      if (weather.current.temperatureF < 50) parts.push('it\'s cold — fish are sluggish; fish slow and deep');
      if (weather.current.temperatureF > 88) parts.push('it\'s hot — fish are deep or shaded; fish early or late');
      if (parts.length === 0) parts.push('conditions look neutral — consider time of day, depth change, or lure size/color change');
    } else {
      parts.push('I can\'t see live weather (no location access) — allow location for condition-based advice');
    }
    if (insights.bestHourRange !== '—') parts.push(`your own best window is ${insights.bestHourRange} — are you fishing then?`);
    return {
      text: `Possible reasons:\n• ${parts.join('\n• ')}\n\nTry changing one variable at a time: time, depth, lure size, or speed.`,
      suggestions: ['What lure should I use?', 'When is the best time to fish?'],
    };
  }

  // --- PERSONAL HISTORY ---
  if (ql.includes('catch') || ql.includes('history') || ql.includes('record') || ql.includes('biggest') || ql.includes('pb') || ql.includes('best')) {
    if (insights.totalCatches === 0) {
      return {
        text: 'Your logbook is empty — that\'s the most important thing to fix! Log a catch from the Vision tab (photo) or the Logbook tab (quick entry) and I\'ll start learning your patterns.',
        suggestions: ['Where should I fish?'],
      };
    }
    const pb = insights.personalBests[0];
    return {
      text: `You've logged **${insights.totalCatches} catches** across **${insights.speciesCount} species**.${pb ? `\n\nBiggest fish: **${pb.weightLbs} lb ${pb.commonName}** at ${pb.catch.locationName}.` : ''}${insights.bestLure ? `\nTop lure: **${insights.bestLure.name}** (${insights.bestLure.catches} catches).` : ''}${insights.bestSpot ? `\nTop spot: **${insights.bestSpot.name}** (${insights.bestSpot.catches} catches).` : ''}`,
      suggestions: ['When is the best time to fish?', 'How is today looking?'],
    };
  }

  // --- GREETING / FALLBACK ---
  if (ql.includes('hi') || ql.includes('hello') || ql.includes('hey') || ql.includes('help') || ql.length < 4) {
    return {
      text: `Hey! I'm your personal fishing assistant. I use **your** catch history, your saved spots, live weather, and solunar data — no generic advice unless you haven't logged enough yet.\n\nTry asking me:`,
      suggestions: QUICK_QUESTIONS,
    };
  }

  return {
    text: `I can help with things like:\n• **Where** to fish (based on your spot history)\n• **What lure** to throw (your top producers + conditions)\n• **When** to go (your best hours + solunar windows)\n• **Today's conditions** (live weather + moon + pressure)\n• **Why you're not catching** (condition + history checks)\n\nTry one of these:`,
    suggestions: QUICK_QUESTIONS,
  };
}

/** All species the user has logged, for autocomplete. */
export function loggedSpecies(catches: CatchLogItem[]): string[] {
  return [...new Set(catches.map((c) => speciesOf(c)))];
}
