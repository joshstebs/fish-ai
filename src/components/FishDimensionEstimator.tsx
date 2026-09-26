import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  Ruler,
  Scale,
  Eye,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Bookmark,
  MapPin,
  Anchor,
  Check,
  Target,
  Compass,
  Zap,
  Crosshair,
  Maximize2,
  Minimize2,
  Info,
  RefreshCw,
  Lock,
  CreditCard,
} from 'lucide-react';
import { CatchLogItem } from '../types/catchLogTypes';
import { ProCtaModal } from './ProCtaModal';
import { getAppSecret, setAppSecret } from '../utils/apiAuth';
import { SAMPLE_FISH_PHOTOS } from '../utils/samplePhotos';
import {
  getCustomerId,
  getStoredEmail,
  fetchBillingStatus,
  startCheckout,
  openBillingPortal,
  type BillingStatus,
} from '../utils/billing';

/**
 * Downscale + JPEG-compress a photo client-side before upload.
 * Raw phone photos are 5-10MB+ as base64 and would exceed Vercel's 4.5MB
 * function body limit; compressed payloads are ~300-600KB — faster uploads,
 * cheaper/snappier AI calls. Falls back to the original on any failure so
 * the upload flow never breaks. Everything is now JPEG, matching the
 * server's default mimeType.
 */
const MAX_IMAGE_DIMENSION = 1600;
const JPEG_QUALITY = 0.85;

function compressImageForUpload(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read image file.'));
    reader.onload = () => {
      const original = typeof reader.result === 'string' ? reader.result : null;
      if (!original) return reject(new Error('Could not read image file.'));

      const img = new Image();
      img.onerror = () => resolve(original); // not a decodable image — keep original
      img.onload = () => {
        try {
          const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));

          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) return resolve(original);

          // White backdrop so PNG transparency doesn't turn black in JPEG
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);

          const compressed = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          resolve(compressed.length < original.length ? compressed : original);
        } catch {
          resolve(original);
        }
      };
      img.src = original;
    };
    reader.readAsDataURL(file);
  });
}

interface RegulatoryInfo {
  legalStatus: 'HARVEST_ALLOWED' | 'CATCH_AND_RELEASE_ONLY' | 'PROTECTED' | 'SEASONAL_RESTRICTION';
  minLegalLengthInches: number;
  maxLegalLengthInches: number | null;
  dailyBagLimit: string;
  seasonStatus: string;
  protectionNotice: string;
  isCatchLegalForEstimatedSize: boolean;
}

interface TackleRecommendations {
  topLiveBaits: string[];
  topArtificialLures: string[];
  presentationTechnique: string;
  waterColumnDepth: string;
  recommendedLineAndRod: string;
}

interface FishAnalysisResult {
  species: string;
  commonName: string;
  scientificName: string;
  confidence: number;
  visionProvider?: string;
  estimatedLength: {
    minInches: number;
    maxInches: number;
    formatted: string;
  };
  estimatedWeight: {
    minLbs: number;
    maxLbs: number;
    averageLbs: number;
    formatted: string;
  };
  referenceObject: {
    detected: boolean;
    description: string;
    scaleFactor: string;
  };
  proportionalAnalysis: string;
  keyCharacteristics: string[];
  regulatoryInfo?: RegulatoryInfo;
  tackleRecommendations?: TackleRecommendations;
}

interface FishDimensionEstimatorProps {
  onSaveCatchToLog?: (catchItem: Omit<CatchLogItem, 'id' | 'timestamp' | 'formattedDate'>) => void;
  onNavigateToLogbook?: () => void;
  openPro?: boolean;
  onProOpened?: () => void;
}

export const FishDimensionEstimator: React.FC<FishDimensionEstimatorProps> = ({
  onSaveCatchToLog,
  onNavigateToLogbook,
  openPro,
  onProOpened,
}) => {
  const [selectedImage, setSelectedImage] = useState<string>(SAMPLE_FISH_PHOTOS[0].url);
  const [refHint, setRefHint] = useState<string>(SAMPLE_FISH_PHOTOS[0].refHint);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<FishAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState<boolean>(false);
  const [authInput, setAuthInput] = useState<string>(getAppSecret());
  const [needsBilling, setNeedsBilling] = useState<boolean>(false);
  const [billingEmail, setBillingEmail] = useState<string>(getStoredEmail());
  const [billingBusy, setBillingBusy] = useState<boolean>(false);
  const [billingMsg, setBillingMsg] = useState<string | null>(null);

  // Header "Try PRO" trigger — opens the PRO upgrade modal from anywhere in the app.
  React.useEffect(() => {
    if (openPro) {
      setNeedsBilling(true);
      onProOpened?.();
    }
  }, [openPro, onProOpened]);
  const [billing, setBilling] = useState<BillingStatus | null>(null);

  // After returning from Stripe Checkout (?checkout=success|canceled), refresh
  // entitlement once and clean the URL so a refresh doesn't re-trigger it.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const outcome = params.get('checkout');
    if (outcome) {
      history.replaceState({}, '', window.location.pathname);
      fetchBillingStatus().then((status) => {
        setBilling(status);
        if (status.entitled) {
          setNeedsBilling(false);
          setBillingMsg('Your free trial is active — AI analysis is unlocked.');
        } else if (outcome === 'canceled') {
          setBillingMsg('Checkout canceled — no charge was made. You can try again anytime.');
        }
      });
    } else if (getCustomerId()) {
      fetchBillingStatus().then(setBilling);
    }
  }, []);

  // Interactive Measurement Tool State
  const [isOverlayActive, setIsOverlayActive] = useState<boolean>(true);
  const [rulerPoints, setRulerPoints] = useState<{ start: { x: number; y: number } | null; end: { x: number; y: number } | null }>({
    start: { x: 18, y: 52 },
    end: { x: 84, y: 52 },
  });
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const photoContainerRef = useRef<HTMLDivElement>(null);

  // Log Modal State — intentionally EMPTY by default. No fabricated defaults.
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [baitUsed, setBaitUsed] = useState('');
  const [locationName, setLocationName] = useState('');
  const [waterClarity, setWaterClarity] = useState<'CLEAR' | 'STAINED' | 'MUDDY'>('STAINED');
  const [notes, setNotes] = useState('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Species correction — the AI can be wrong; the angler knows better.
  const [showCorrection, setShowCorrection] = useState(false);
  const [customSpecies, setCustomSpecies] = useState('');
  const CORRECTABLE_SPECIES = [
    'Largemouth Bass',
    'Smallmouth Bass',
    'Northern Pike',
    'Walleye',
    'Rainbow Trout',
    'Brown Trout',
    'Catfish',
    'Crappie',
    'Bluegill',
    'Yellow Perch',
    'Red Drum',
    'Snook',
    'Tarpon',
    'Muskellunge',
  ];

  const applySpeciesCorrection = (commonName: string) => {
    if (!result || !commonName) return;
    setResult({
      ...result,
      commonName,
      species: commonName,
      scientificName: '',
      confidence: Math.min(result.confidence, 85), // corrected IDs carry slightly lower auto-confidence
    });
    setShowCorrection(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    compressImageForUpload(file)
      .then(setSelectedImage)
      .catch((err) => console.error('Image load failed:', err));
  };

  const handleAnalyzePhoto = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Demo sample photos are remote URLs — convert to base64 so the server
      // accepts them (it rejects tiny payloads that can't be a real photo).
      let imagePayload = selectedImage;
      if (!imagePayload.startsWith('data:')) {
        try {
          const imgResp = await fetch(imagePayload);
          const blob = await imgResp.blob();
          imagePayload = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Could not read the sample photo.'));
            reader.readAsDataURL(blob);
          });
        } catch {
          throw new Error('Could not load the sample photo — try uploading your own instead.');
        }
      }

      const resp = await fetch('/api/ai/analyze-fish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fish-app-secret': getAppSecret(),
          'x-fish-customer-id': getCustomerId(),
        },
        body: JSON.stringify({
          imageBase64: imagePayload,
          referenceObjectHint: refHint,
        }),
      });

      if (resp.status === 401) {
        setNeedsAuth(true);
        setAuthInput(getAppSecret());
        throw new Error('AI analysis is locked — enter your app password to unlock.');
      }

      if (resp.status === 402) {
        setNeedsBilling(true);
        throw new Error('AI analysis requires an active subscription.');
      }

      if (!resp.ok) {
        let serverMsg = `Analysis failed with status ${resp.status}`;
        try {
          const errBody = await resp.json();
          if (errBody?.error) serverMsg = errBody.error;
        } catch {
          /* keep default message */
        }
        if (resp.status === 503) {
          serverMsg =
            'Real AI vision isn\u2019t configured yet. Set OPENAI_API_KEY (preferred), ANTHROPIC_API_KEY, or GEMINI_API_KEY. ' +
            'FishAI never fakes an analysis. ' +
            'You can still log a catch manually from the Logbook tab.';
        }
        throw new Error(serverMsg);
      }

      const data = await resp.json();
      setResult(data);
      // Refresh entitlement so the Premium bar / Manage link appears promptly.
      fetchBillingStatus().then(setBilling).catch(() => {});
    } catch (err: any) {
      console.error('Error analyzing fish:', err);
      setError(err?.message || 'Failed to estimate fish physical dimensions.');
    } finally {
      setIsLoading(false);
    }
  };

  // Unlock the AI API with the app password (stored on this device only).
  const handleUnlock = async () => {
    const secret = authInput.trim();
    if (!secret) {
      setError('Enter the app password to unlock AI analysis.');
      return;
    }
    setAppSecret(secret);
    setNeedsAuth(false);
    setError(null);
    await handleAnalyzePhoto();
  };

  // Start the 7-day free trial (or resubscribe) via Stripe Checkout.
  const handleStartTrial = async () => {
    const email = billingEmail.trim();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address to start your free trial.');
      return;
    }
    setBillingBusy(true);
    setError(null);
    setBillingMsg(null);
    try {
      const { url } = await startCheckout(email);
      window.location.href = url; // redirect to Stripe Checkout
    } catch (err: any) {
      setError(err?.message || 'Could not start checkout. Please try again.');
    } finally {
      setBillingBusy(false);
    }
  };

  // Manage / cancel the subscription via the Stripe Customer Portal.
  const handleManageBilling = async () => {
    setBillingBusy(true);
    setError(null);
    try {
      const url = await openBillingPortal();
      window.location.href = url;
    } catch (err: any) {
      setError(err?.message || 'Could not open the billing portal.');
    } finally {
      setBillingBusy(false);
    }
  };

  // Handle interactive ruler drag
  const handlePointerDown = (pointType: 'start' | 'end') => (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(pointType);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !photoContainerRef.current) return;
    const rect = photoContainerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));

    setRulerPoints((prev) => ({
      ...prev,
      [isDragging]: { x, y },
    }));
  };

  const handlePointerUp = () => {
    setIsDragging(null);
  };

  // Calculate pixel distance %
  const rulerDistance = rulerPoints.start && rulerPoints.end
    ? Math.round(Math.hypot(rulerPoints.end.x - rulerPoints.start.x, rulerPoints.end.y - rulerPoints.start.y))
    : 0;

  return (
    <div className="fishai-premium-vision space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-emerald-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
              FishAI Multi-Modal Vision
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Spatial Calibration Scale Active
            </span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight flex items-center gap-2">
            Catch <span className="text-emerald-400">Snapshot</span>
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Snap a photo — species ID, size estimate, and harvest rules in seconds.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Image Selector & Interactive Canvas Calibration */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-white/10 p-5 rounded-xl space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" /> Photo & Ruler
              </span>
              <button
                onClick={() => setIsOverlayActive(!isOverlayActive)}
                className={`px-2.5 py-1 text-[10px] font-mono font-bold uppercase rounded border transition-all ${
                  isOverlayActive ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {isOverlayActive ? 'Ruler Overlay ON' : 'Ruler Overlay OFF'}
              </button>
            </div>

            {/* Photo Interactive Canvas */}
            <div
              ref={photoContainerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              className="relative aspect-4/3 rounded-lg overflow-hidden bg-black border border-slate-800 flex items-center justify-center select-none touch-none"
            >
              <img
                src={selectedImage}
                alt="Selected Catch"
                className="w-full h-full object-cover"
              />

              {/* Interactive Scale Ruler Overlay */}
              {isOverlayActive && rulerPoints.start && rulerPoints.end && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                  {/* Calibrated Line */}
                  <line
                    x1={`${rulerPoints.start.x}%`}
                    y1={`${rulerPoints.start.y}%`}
                    x2={`${rulerPoints.end.x}%`}
                    y2={`${rulerPoints.end.y}%`}
                    stroke="#10b981"
                    strokeWidth="3"
                    strokeDasharray="6 3"
                  />

                  {/* Bounding Box Outline */}
                  <rect
                    x={`${Math.min(rulerPoints.start.x, rulerPoints.end.x) - 2}%`}
                    y={`${Math.min(rulerPoints.start.y, rulerPoints.end.y) - 10}%`}
                    width={`${Math.abs(rulerPoints.end.x - rulerPoints.start.x) + 4}%`}
                    height="20%"
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.4)"
                    strokeWidth="1.5"
                    rx="4"
                  />
                </svg>
              )}

              {/* Interactive Handles */}
              {isOverlayActive && rulerPoints.start && rulerPoints.end && (
                <>
                  <div
                    onPointerDown={handlePointerDown('start')}
                    style={{ left: `${rulerPoints.start.x}%`, top: `${rulerPoints.start.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-lg cursor-grab active:cursor-grabbing z-20 flex items-center justify-center text-slate-950 font-black text-[9px]"
                  >
                    A
                  </div>
                  <div
                    onPointerDown={handlePointerDown('end')}
                    style={{ left: `${rulerPoints.end.x}%`, top: `${rulerPoints.end.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white shadow-lg cursor-grab active:cursor-grabbing z-20 flex items-center justify-center text-slate-950 font-black text-[9px]"
                  >
                    B
                  </div>
                </>
              )}

              {/* Calibration Hint Banner */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 flex items-center justify-between z-10">
                <span className="text-[11px] font-mono font-bold text-emerald-400 flex items-center gap-1">
                  <Crosshair className="w-3.5 h-3.5" /> Span: {rulerDistance}% Photo Vector
                </span>
                <span className="text-[10px] text-slate-400 font-mono">Drag A & B to align nose to tail</span>
              </div>
            </div>

            {/* Preset Samples Selector */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Try a demo:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_FISH_PHOTOS.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImage(sample.url);
                      setRefHint(sample.refHint);
                    }}
                    className={`relative rounded-lg overflow-hidden border transition-all ${
                      selectedImage === sample.url
                        ? 'border-emerald-500 ring-2 ring-emerald-500/30'
                        : 'border-slate-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-full h-16 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-end p-1">
                      <span className="text-[9px] font-bold text-white truncate font-mono">
                        {sample.name.split(' ')[1] || sample.name}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Scale Landmark Hint Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Ruler className="w-3.5 h-3.5 text-blue-400" /> Reference Object:
              </label>
              <input
                type="text"
                value={refHint}
                onChange={(e) => setRefHint(e.target.value)}
                placeholder="e.g. Human hand holding lip, rod handle, boat ruler..."
                className="w-full bg-slate-950 border border-slate-800 text-xs font-mono text-white px-3 py-2 rounded focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Custom File Upload */}
            <div className="flex gap-2">
              <label className="flex-1 py-2.5 bg-slate-950 hover:bg-slate-800 text-slate-300 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-800 text-center cursor-pointer transition-all flex items-center justify-center gap-2">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Run Analysis CTA */}
            <button
              onClick={handleAnalyzePhoto}
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-slate-950" />
                  <span>Analyze Catch</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Output & Regulatory Analysis */}
        <div className="lg:col-span-7 space-y-4">
          {needsAuth && (
            <div className="bg-slate-900 border-l-4 border-amber-500 p-5 rounded-xl border-y border-r border-white/10 shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">
                    AI Analysis Locked
                  </h3>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">
                    Enter the app password to unlock Gemini vision. Stored on this device only.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={authInput}
                  onChange={(e) => setAuthInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleUnlock(); }}
                  placeholder="App password"
                  autoFocus
                  className="flex-1 bg-slate-950 border border-slate-800 text-white text-xs font-bold uppercase tracking-wider font-mono rounded-lg px-3 py-2.5 focus:border-amber-500 outline-none"
                />
                <button
                  onClick={handleUnlock}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg transition-all active:scale-95"
                >
                  Unlock
                </button>
              </div>
            </div>
          )}

          {needsBilling && !billing?.entitled && (
                      <ProCtaModal
                        onClose={() => setNeedsBilling(false)}
                        onEntitled={(status) => {
                          setBilling(status);
                          setNeedsBilling(false);
                          setBillingMsg('Your free trial is active — AI analysis is unlocked.');
                        }}
                      />
                    )}

          {billing?.entitled && (
            <div className="flex items-center justify-between bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                ✓ Premium active — AI analysis unlocked
                {billing.status === 'trialing' && billing.trialEndsAt
                  ? ` (trial ends ${new Date(billing.trialEndsAt * 1000).toLocaleDateString()})`
                  : ''}
              </span>
              <button
                onClick={handleManageBilling}
                className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400 transition-colors"
              >
                Manage
              </button>
            </div>
          )}

          {billingMsg && !error && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl text-emerald-300 text-xs font-mono">
              {billingMsg}
            </div>
          )}

          {/* PRO Trial CTA — visible pre-sign-in, the #1 conversion lever */}
          {!billing?.entitled && !needsBilling && !needsAuth && !result && !isLoading && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 rounded-xl p-5 shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-display font-black uppercase text-white tracking-tight">
                      AI Fish Identification
                    </h3>
                    <p className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">
                      PRO Feature
                    </p>
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Species ID with confidence score</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Length & weight estimates from your photo</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Local harvest rules & tackle recommendations</span>
                  </div>
                </div>
                <button
                  onClick={() => setNeedsBilling(true)}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Zap className="w-4 h-4" />
                  Try PRO Free 7 Days
                </button>
                <p className="text-center text-[10px] text-slate-500 mt-2 font-mono">
                  Then $7.99/mo · Cancel anytime
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-xl text-red-300 text-xs font-mono flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!result && !isLoading && !error && (
            <div className="bg-slate-900 border border-white/10 rounded-xl p-12 text-center space-y-4 shadow-xl">
              <Eye className="w-12 h-12 text-slate-600 mx-auto animate-pulse" />
              <h3 className="text-base font-black uppercase tracking-wider text-white">
                Ready to Analyze
              </h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto font-mono">
                Upload a catch photo or try a demo — get species ID, size estimate, and harvest rules.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-12 text-center space-y-4 shadow-2xl">
              <Sparkles className="w-10 h-10 text-emerald-400 mx-auto animate-spin" />
              <h3 className="text-base font-black uppercase tracking-wider text-emerald-400">
                Analyzing Your Catch...
              </h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto font-mono">
                Identifying species • Estimating dimensions • Checking harvest rules...
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-5">
              {/* Catch Report — Species Block */}
              <div className="bg-slate-900 border border-white/10 rounded-xl shadow-xl overflow-hidden">
                <div className="p-6 space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Species
                  </span>
                  <h3 className="text-3xl sm:text-4xl font-display font-black uppercase text-white tracking-tight leading-tight">
                    {result.commonName || result.species}
                  </h3>
                  <p className="text-sm italic font-mono text-slate-400">
                    {result.scientificName}
                  </p>
                  {result.visionProvider && (
                    <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      via {result.visionProvider}
                    </p>
                  )}
                  <div className="pt-2">
                    <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" /> High Confidence
                    </span>
                  </div>
                </div>

                <div className="border-t border-white/10 bg-slate-950/60 px-6 py-3 flex flex-wrap items-center justify-end gap-2">
                  <button
                    onClick={() => setShowCorrection(true)}
                    className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition-all shrink-0 border border-slate-700"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-400" />
                    <span>Wrong Species?</span>
                  </button>

                  <button
                    onClick={() => setIsLogModalOpen(true)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition-all shrink-0"
                  >
                    <Bookmark className="w-4 h-4 text-emerald-400" />
                    <span>Save to Log</span>
                  </button>
                </div>
              </div>

              {/* Species Correction Panel */}
              {showCorrection && (
                <div className="bg-slate-900 border-l-4 border-amber-500 p-5 rounded-xl border-y border-r border-white/10 shadow-2xl space-y-3">
                  <h4 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-amber-400" /> Correct the Species
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    AI identification can be wrong. Pick the actual species — your correction improves your personal stats.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {CORRECTABLE_SPECIES.map((s) => (
                      <button
                        key={s}
                        onClick={() => applySpeciesCorrection(s)}
                        className={`px-2.5 py-2 rounded-lg border text-xs font-bold uppercase tracking-wider transition-all ${
                          result.commonName === s
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                            : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-amber-500/50'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSpecies}
                      onChange={(e) => setCustomSpecies(e.target.value)}
                      placeholder="Or type a custom species name..."
                      className="flex-1 bg-slate-950 border border-slate-800 rounded p-2.5 text-white text-xs font-mono focus:outline-none focus:border-amber-500"
                    />
                    <button
                      onClick={() => applySpeciesCorrection(customSpecies.trim())}
                      disabled={!customSpecies.trim()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black text-xs uppercase rounded-lg"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}

              {/* Estimated Stat Blocks */}
              <div className="grid grid-cols-3 gap-2">
                {/* Length Stat */}
                <div className="bg-slate-900 border border-white/10 border-t-2 border-t-emerald-500 rounded-xl p-3 space-y-1.5 shadow-xl">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Ruler className="w-3 h-3 text-emerald-400" /> Est. Length
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-2xl font-black text-white font-mono leading-none">
                      {result.estimatedLength.minInches}″–{result.estimatedLength.maxInches}″
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    {Math.round(result.estimatedLength.minInches * 2.54)}–{Math.round(result.estimatedLength.maxInches * 2.54)} cm
                  </div>
                </div>

                {/* Weight Stat */}
                <div className="bg-slate-900 border border-white/10 border-t-2 border-t-emerald-500 rounded-xl p-3 space-y-1.5 shadow-xl">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Scale className="w-3 h-3 text-emerald-400" /> Est. Weight
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-2xl font-black text-white font-mono leading-none">
                      ~{result.estimatedWeight.averageLbs}
                    </span>
                    <span className="text-[9px] font-mono uppercase text-slate-400">lbs</span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500">
                    {result.estimatedWeight.minLbs}–{result.estimatedWeight.maxLbs} lbs
                  </div>
                </div>

                {/* Confidence Stat */}
                <div className="bg-slate-900 border border-white/10 border-t-2 border-t-emerald-500 rounded-xl p-3 space-y-1.5 shadow-xl">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-400" /> Confidence
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono leading-none">
                      {result.confidence}%
                    </span>
                  </div>
                  <div className="text-[9px] font-mono text-slate-500 truncate">
                    measurement confidence
                  </div>
                </div>
              </div>

              {/* Harvest / Legality Status Row */}
              {result.regulatoryInfo && (
                <div className="bg-slate-900 border border-white/10 rounded-xl px-5 py-4 shadow-xl flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Harvest Legality
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border ${
                      result.regulatoryInfo.legalStatus === 'HARVEST_ALLOWED'
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      {result.regulatoryInfo.legalStatus.replace(/_/g, ' ')}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wider border ${
                      result.estimatedLength.minInches >= result.regulatoryInfo.minLegalLengthInches
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      {result.estimatedLength.minInches >= result.regulatoryInfo.minLegalLengthInches
                        ? '✓ Meets Min Size'
                        : '⚠ Below Legal Size'}
                    </span>
                  </div>
                </div>
              )}

              {/* Scale Reference Object */}
              {result.referenceObject && (
                <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <Crosshair className="w-4 h-4 text-emerald-400" />
                      <h4 className="text-sm font-black uppercase tracking-wider text-white">
                        Scale Reference
                      </h4>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-wider border ${
                      result.referenceObject.detected
                        ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                    }`}>
                      {result.referenceObject.detected ? 'Detected' : 'None Found'}
                    </span>
                  </div>
                  <p className="text-xs font-mono text-slate-400 leading-relaxed">
                    {result.referenceObject.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                      Scale Factor
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      {result.referenceObject.scaleFactor}
                    </span>
                  </div>
                </div>
              )}

              {/* Key Characteristics */}
              {result.keyCharacteristics && result.keyCharacteristics.length > 0 && (
                <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-3">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">
                      Key Features
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {result.keyCharacteristics.map((c, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-950 border border-slate-800 rounded-full px-3 py-1.5 text-[11px] font-mono text-slate-300"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Harvest Rules Card */}
              {result.regulatoryInfo && (
                <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">
                      Harvest Rules
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
                    <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Min Legal Size</span>
                      <span className="text-base font-black text-white">
                        {result.regulatoryInfo.minLegalLengthInches}″ ({Math.round(result.regulatoryInfo.minLegalLengthInches * 2.54)} cm)
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Daily Bag Limit</span>
                      <span className="text-xs font-bold text-emerald-400">
                        {result.regulatoryInfo.dailyBagLimit}
                      </span>
                    </div>

                    <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Legality Check</span>
                      <span className={`text-xs font-black flex items-center gap-1 ${
                        result.estimatedLength.minInches >= result.regulatoryInfo.minLegalLengthInches
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}>
                        {result.estimatedLength.minInches >= result.regulatoryInfo.minLegalLengthInches
                          ? '✓ Meets Min Size Limit'
                          : '⚠ Below Legal Size Limit'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recommended Tackle Card */}
              {result.tackleRecommendations && (
                <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Target className="w-5 h-5 text-emerald-400" />
                    <h4 className="text-sm font-black uppercase tracking-wider text-white">
                      Recommended Tackle
                    </h4>
                  </div>

                  {result.tackleRecommendations.topLiveBaits.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Anchor className="w-3.5 h-3.5 text-emerald-400" /> Live Baits:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {result.tackleRecommendations.topLiveBaits.map((bait, idx) => (
                          <div key={idx} className="bg-slate-950 px-3 py-2 rounded border border-slate-800 text-xs font-mono text-emerald-300 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <span>{bait}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.tackleRecommendations.topArtificialLures.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-emerald-400" /> Artificial Lures:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {result.tackleRecommendations.topArtificialLures.map((lure, idx) => (
                          <div key={idx} className="bg-slate-950 px-3 py-2 rounded border border-slate-800 text-xs font-mono text-emerald-300 font-bold flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                            <span>{lure}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                    {result.tackleRecommendations.presentationTechnique && (
                      <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Presentation</span>
                        <span className="text-white font-bold">{result.tackleRecommendations.presentationTechnique}</span>
                      </div>
                    )}
                    {result.tackleRecommendations.waterColumnDepth && (
                      <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Water Column</span>
                        <span className="text-white font-bold">{result.tackleRecommendations.waterColumnDepth}</span>
                      </div>
                    )}
                    {result.tackleRecommendations.recommendedLineAndRod && (
                      <div className="bg-slate-950 p-3 rounded border border-slate-800 space-y-1 sm:col-span-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Line & Rod</span>
                        <span className="text-white font-bold">{result.tackleRecommendations.recommendedLineAndRod}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Save to Logbook Modal Dialog */}
      {isLogModalOpen && result && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-emerald-400" /> Save to Logbook
              </h3>
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-mono font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 flex items-center gap-3">
              <img
                src={selectedImage}
                alt={result.species}
                className="w-14 h-14 object-cover rounded border border-slate-700"
              />
              <div className="text-xs font-mono space-y-0.5">
                <div className="font-bold text-white uppercase">{result.species}</div>
                <div className="text-emerald-400 font-bold">{result.estimatedLength.formatted} • ~{result.estimatedWeight.averageLbs} lbs</div>
                <div className="text-slate-500 text-[10px]">Add conditions from the Logbook after saving.</div>
              </div>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Spot</label>
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. North Lake Point"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Bait / Lure</label>
                <input
                  type="text"
                  value={baitUsed}
                  onChange={(e) => setBaitUsed(e.target.value)}
                  placeholder="e.g. Green Pumpkin Senko"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Clarity</label>
                <select
                  value={waterClarity}
                  onChange={(e) => setWaterClarity(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none"
                >
                  <option value="CLEAR">Clear</option>
                  <option value="STAINED">Stained</option>
                  <option value="MUDDY">Muddy</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Water clarity clear, caught near weed line on 12lb line."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsLogModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-lg"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (onSaveCatchToLog && result) {
                    onSaveCatchToLog({
                      species: result.species,
                      commonName: result.commonName,
                      scientificName: result.scientificName,
                      photoUrl: selectedImage,
                      estimatedLength: result.estimatedLength.formatted,
                      estimatedWeight: `${result.estimatedWeight.averageLbs} lbs avg`,
                      // Weather intentionally omitted — no fabricated conditions.
                      // Use the Logbook quick entry to attach real conditions.
                      baitUsed: baitUsed || 'Unspecified Bait',
                      locationName: locationName || 'Unspecified Location',
                      waterClarity,
                      notes,
                      legalStatus: result.regulatoryInfo?.legalStatus,
                    });
                  }
                  setIsSavedSuccess(true);
                  setTimeout(() => {
                    setIsSavedSuccess(false);
                    setIsLogModalOpen(false);
                    if (onNavigateToLogbook) onNavigateToLogbook();
                  }, 800);
                }}
                className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1.5"
              >
                {isSavedSuccess ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Saved to Logbook!</span>
                  </>
                ) : (
                  <>
                    <Bookmark className="w-4 h-4" />
                    <span>Confirm & Save</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
