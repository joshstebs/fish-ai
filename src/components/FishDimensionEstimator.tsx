import React from 'react';
import {
  AlertTriangle,
  Bookmark,
  Camera,
  CheckCircle2,
  Eye,
  Fish,
  Info,
  RefreshCw,
  Ruler,
  Scale,
  Sparkles,
  Upload,
} from 'lucide-react';
import { CatchLogItem } from '../types/catchLogTypes';
import { ProCtaModal } from './ProCtaModal';
import {
  fetchBillingStatus,
  openBillingPortal,
  type BillingStatus,
} from '../utils/billing';

const MAX_SOURCE_BYTES = 12 * 1024 * 1024;
const ANALYSIS_MAX_DIMENSION = 1600;
const ANALYSIS_JPEG_QUALITY = 0.82;
const THUMB_MAX_DIMENSION = 640;
const THUMB_JPEG_QUALITY = 0.68;

interface MeasurementRange {
  minInches: number;
  maxInches: number;
  formatted: string;
}

interface WeightRange {
  minLbs: number;
  maxLbs: number;
  averageLbs: number;
  formatted: string;
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
  estimatedLength: MeasurementRange | null;
  estimatedWeight: WeightRange | null;
  measurementConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  referenceObject: {
    detected: boolean;
    description: string;
  };
  proportionalAnalysis: string;
  keyCharacteristics: string[];
  tackleRecommendations: TackleRecommendations;
  warnings: string[];
}

interface FishDimensionEstimatorProps {
  onSaveCatchToLog?: (catchItem: Omit<CatchLogItem, 'id' | 'timestamp' | 'formattedDate'>) => void;
  onNavigateToLogbook?: () => void;
  openPro?: boolean;
  onProOpened?: () => void;
}

function resizeDataUrl(
  source: string,
  maxDimension: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new Error('This image format could not be decoded by your browser.'));
    image.onload = () => {
      try {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Image processing is unavailable in this browser.');

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch (error) {
        reject(error);
      }
    };
    image.src = source;
  });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Choose an image file.'));
      return;
    }
    if (file.size > MAX_SOURCE_BYTES) {
      reject(new Error('The original photo is too large. Choose an image under 12 MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.onload = async () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Could not read the selected image.'));
        return;
      }
      try {
        resolve(await resizeDataUrl(reader.result, ANALYSIS_MAX_DIMENSION, ANALYSIS_JPEG_QUALITY));
      } catch (error) {
        reject(error);
      }
    };
    reader.readAsDataURL(file);
  });
}

function confidenceLabel(confidence: number): string {
  if (confidence >= 85) return 'High';
  if (confidence >= 65) return 'Moderate';
  return 'Low';
}

export const FishDimensionEstimator: React.FC<FishDimensionEstimatorProps> = ({
  onSaveCatchToLog,
  onNavigateToLogbook,
  openPro,
  onProOpened,
}) => {
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [fileName, setFileName] = React.useState('');
  const [referenceHint, setReferenceHint] = React.useState('');
  const [result, setResult] = React.useState<FishAnalysisResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [needsBilling, setNeedsBilling] = React.useState(false);
  const [billing, setBilling] = React.useState<BillingStatus | null>(null);
  const [showCorrection, setShowCorrection] = React.useState(false);
  const [customSpecies, setCustomSpecies] = React.useState('');

  const [logOpen, setLogOpen] = React.useState(false);
  const [baitUsed, setBaitUsed] = React.useState('');
  const [locationName, setLocationName] = React.useState('');
  const [waterClarity, setWaterClarity] = React.useState<'' | 'CLEAR' | 'STAINED' | 'MUDDY'>('');
  const [notes, setNotes] = React.useState('');
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    fetchBillingStatus().then((status) => {
      if (status.entitled) setBilling(status);
    });
  }, []);

  React.useEffect(() => {
    if (openPro) {
      setNeedsBilling(true);
      onProOpened?.();
    }
  }, [openPro, onProOpened]);

  async function chooseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);
    setResult(null);
    setSaved(false);
    try {
      const image = await fileToDataUrl(file);
      setSelectedImage(image);
      setFileName(file.name);
    } catch (cause) {
      setSelectedImage(null);
      setFileName('');
      setError(cause instanceof Error ? cause.message : 'Could not prepare this photo.');
    }
  }

  async function analyze() {
    if (!selectedImage) {
      setError('Upload a real fish photo first.');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);

    try {
      const response = await fetch('/api/ai/analyze-fish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          imageBase64: selectedImage,
          referenceObjectHint: referenceHint.trim(),
        }),
      });

      const body = await response.json().catch(() => ({}));

      if (response.status === 401 || response.status === 402) {
        setNeedsBilling(true);
      }
      if (!response.ok) {
        throw new Error(body?.error || `Analysis failed (${response.status}).`);
      }

      setResult(body as FishAnalysisResult);
      fetchBillingStatus().then((status) => { if (status.entitled) setBilling(status); });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  }

  function correctSpecies(name: string) {
    const clean = name.trim();
    if (!result || !clean) return;
    setResult({
      ...result,
      species: clean,
      commonName: clean,
      scientificName: '',
      confidence: Math.min(result.confidence, 85),
    });
    setCustomSpecies('');
    setShowCorrection(false);
  }

  async function manageBilling() {
    try {
      window.location.href = await openBillingPortal();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open billing.');
    }
  }

  async function saveCatch() {
    if (!result || !selectedImage || !onSaveCatchToLog) return;
    setSaving(true);
    setError(null);

    try {
      const thumbnail = await resizeDataUrl(
        selectedImage,
        THUMB_MAX_DIMENSION,
        THUMB_JPEG_QUALITY,
      ).catch(() => '');

      onSaveCatchToLog({
        species: result.species,
        commonName: result.commonName,
        scientificName: result.scientificName,
        photoUrl: thumbnail,
        estimatedLength: result.estimatedLength?.formatted || 'Not estimated',
        estimatedWeight: result.estimatedWeight?.formatted || 'Not estimated',
        baitUsed: baitUsed.trim(),
        locationName: locationName.trim(),
        waterClarity: waterClarity || undefined,
        notes: notes.trim(),
      });

      setSaved(true);
      setLogOpen(false);
      setBaitUsed('');
      setLocationName('');
      setWaterClarity('');
      setNotes('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this catch.');
    } finally {
      setSaving(false);
    }
  }

  const confidence = result ? confidenceLabel(result.confidence) : '';
  const tackle = result?.tackleRecommendations;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border-l-4 border-emerald-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="px-3 py-1 bg-emerald-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
            AI Vision
          </span>
          <span className="text-xs font-mono text-slate-400 uppercase">Real uploads only</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-black uppercase text-white tracking-tight">
          Identify your catch
        </h2>
        <p className="text-slate-400 text-sm mt-2 max-w-3xl">
          Upload your own fish photo. FishAI returns a species hypothesis, confidence,
          visual size estimate when supportable, and tackle suggestions. It does not
          invent a demo result and it does not determine fishing legality.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl space-y-4">
          <div className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Camera className="w-4 h-4 text-emerald-400" /> Your photo
          </div>

          {selectedImage ? (
            <div className="relative aspect-4/3 overflow-hidden rounded-xl border border-slate-800 bg-black">
              <img src={selectedImage} alt="Uploaded catch" className="w-full h-full object-contain" />
              <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 text-[10px] font-mono text-slate-300 truncate">
                {fileName}
              </div>
            </div>
          ) : (
            <label className="aspect-4/3 rounded-xl border border-dashed border-slate-700 bg-slate-950 flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-emerald-500/60 transition-colors">
              <Upload className="w-8 h-8 text-emerald-400" />
              <div className="text-center">
                <div className="text-sm font-black uppercase tracking-wider text-white">Upload a fish photo</div>
                <div className="text-xs text-slate-500 mt-1">No sample or mock photo is preloaded.</div>
              </div>
              <input type="file" accept="image/*" onChange={chooseFile} className="hidden" />
            </label>
          )}

          {selectedImage && (
            <label className="block">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Replace photo</span>
              <span className="mt-2 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-300 cursor-pointer hover:border-emerald-500/50">
                <Upload className="w-4 h-4" /> Choose another
                <input type="file" accept="image/*" onChange={chooseFile} className="hidden" />
              </span>
            </label>
          )}

          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <Ruler className="w-3.5 h-3.5 text-sky-400" /> Known-size reference, optional
            </span>
            <input
              value={referenceHint}
              onChange={(event) => setReferenceHint(event.target.value)}
              maxLength={180}
              placeholder="Example: 12-inch ruler visible beside the fish"
              className="mt-2 w-full bg-slate-950 border border-slate-800 text-white text-xs font-mono rounded-lg px-3 py-2.5 focus:border-emerald-500 outline-none"
            />
            <span className="mt-1 block text-[10px] text-slate-500">
              Only enter something actually visible with a known size. FishAI will not pretend a scale exists.
            </span>
          </label>

          <button
            onClick={() => void analyze()}
            disabled={!selectedImage || loading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
            {loading ? 'Analyzing...' : 'Analyze real photo'}
          </button>

          <div className="rounded-lg border border-amber-500/20 bg-amber-950/20 p-3 flex gap-2 text-[11px] text-amber-200/80 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            Visual dimensions can be inaccurate, especially without a ruler or other known-size object in the same plane as the fish.
          </div>
        </section>

        <section className="lg:col-span-7 space-y-4">
          {needsBilling && !billing?.entitled && (
            <ProCtaModal
              onClose={() => setNeedsBilling(false)}
              onEntitled={(status) => {
                setBilling(status);
                setNeedsBilling(false);
              }}
            />
          )}

          {billing?.entitled && billing.status !== 'owner' && (
            <div className="flex items-center justify-between gap-3 bg-emerald-950/30 border border-emerald-500/20 p-3 rounded-xl">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                Pro session active
              </span>
              <button onClick={() => void manageBilling()} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-emerald-400">
                Manage
              </button>
            </div>
          )}

          {error && (
            <div className="bg-red-950/40 border border-red-500/30 p-4 rounded-xl text-red-300 text-xs font-mono flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {saved && !error && (
            <div className="bg-emerald-950/40 border border-emerald-500/30 p-4 rounded-xl text-emerald-300 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Catch saved to your local logbook.
              {onNavigateToLogbook && (
                <button onClick={onNavigateToLogbook} className="underline font-bold ml-1">Open logbook</button>
              )}
            </div>
          )}

          {!result && !loading && (
            <div className="bg-slate-900 border border-white/10 rounded-xl p-10 sm:p-14 text-center shadow-xl">
              <Fish className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="mt-4 text-base font-black uppercase tracking-wider text-white">No analysis yet</h3>
              <p className="mt-2 text-slate-400 text-xs max-w-md mx-auto font-mono">
                Results appear only after you upload and analyze your own photo.
              </p>
            </div>
          )}

          {loading && (
            <div className="bg-slate-900 border border-emerald-500/30 rounded-xl p-12 text-center shadow-xl">
              <Sparkles className="w-9 h-9 text-emerald-400 mx-auto animate-pulse" />
              <h3 className="mt-4 text-sm font-black uppercase tracking-wider text-emerald-400">Analyzing image</h3>
              <p className="mt-2 text-xs text-slate-500 font-mono">
                Provider fallbacks are deliberately bounded to protect quota.
              </p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-white/10 rounded-xl p-6 shadow-xl">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Species hypothesis</span>
                    <h3 className="mt-1 text-3xl font-display font-black uppercase text-white tracking-tight">
                      {result.commonName || result.species}
                    </h3>
                    {result.scientificName && <p className="text-sm italic font-mono text-slate-400">{result.scientificName}</p>}
                    {result.visionProvider && <p className="mt-2 text-[9px] font-mono text-slate-600">provider: {result.visionProvider}</p>}
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black font-mono text-emerald-400">{result.confidence}%</div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-500">{confidence} ID confidence</div>
                  </div>
                </div>

                {result.proportionalAnalysis && (
                  <p className="mt-4 text-sm text-slate-300 leading-relaxed">{result.proportionalAnalysis}</p>
                )}

                {result.keyCharacteristics.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {result.keyCharacteristics.map((item) => (
                      <span key={item} className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-300">
                        {item}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button onClick={() => setShowCorrection((value) => !value)} className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-black uppercase tracking-wider text-white">
                    Wrong species?
                  </button>
                  <button onClick={() => setLogOpen(true)} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-black uppercase tracking-wider text-white flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5" /> Save to log
                  </button>
                </div>
              </div>

              {showCorrection && (
                <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
                  <label className="text-[10px] font-black uppercase tracking-widest text-amber-300">Manual species correction</label>
                  <div className="mt-2 flex gap-2">
                    <input
                      value={customSpecies}
                      onChange={(event) => setCustomSpecies(event.target.value)}
                      placeholder="Enter the species you identified"
                      className="flex-1 min-w-0 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-amber-500"
                    />
                    <button onClick={() => correctSpecies(customSpecies)} disabled={!customSpecies.trim()} className="px-4 rounded-lg bg-amber-500 disabled:opacity-40 text-slate-950 text-xs font-black uppercase">
                      Apply
                    </button>
                  </div>
                </div>
              )}

              <div className="grid sm:grid-cols-3 gap-3">
                <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Ruler className="w-3 h-3" /> Visual length
                  </span>
                  <div className="mt-2 text-xl font-black font-mono text-white">
                    {result.estimatedLength
                      ? `${result.estimatedLength.minInches}″–${result.estimatedLength.maxInches}″`
                      : 'Not supported'}
                  </div>
                </div>
                <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1">
                    <Scale className="w-3 h-3" /> Visual weight
                  </span>
                  <div className="mt-2 text-xl font-black font-mono text-white">
                    {result.estimatedWeight ? `~${result.estimatedWeight.averageLbs} lb` : 'Not supported'}
                  </div>
                </div>
                <div className="bg-slate-900 border border-white/10 rounded-xl p-4">
                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Measurement confidence</span>
                  <div className={`mt-2 text-xl font-black font-mono ${
                    result.measurementConfidence === 'HIGH'
                      ? 'text-emerald-400'
                      : result.measurementConfidence === 'MEDIUM'
                        ? 'text-amber-400'
                        : 'text-slate-400'
                  }`}>
                    {result.measurementConfidence}
                  </div>
                </div>
              </div>

              {result.referenceObject.detected && (
                <div className="bg-slate-900 border border-sky-500/20 rounded-xl p-4 text-xs text-slate-300">
                  <span className="font-black uppercase tracking-widest text-sky-400">Visible scale reference: </span>
                  {result.referenceObject.description || 'Detected'}
                </div>
              )}

              {tackle && (
                <div className="bg-slate-900 border border-white/10 rounded-xl p-5 shadow-xl">
                  <h4 className="text-xs font-black uppercase tracking-widest text-white">General tackle suggestions</h4>
                  <div className="mt-4 grid sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 uppercase font-black tracking-wider">Artificial</span>
                      <p className="mt-1 text-slate-300">{tackle.topArtificialLures.join(', ') || 'No suggestion returned.'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-black tracking-wider">Live bait</span>
                      <p className="mt-1 text-slate-300">{tackle.topLiveBaits.join(', ') || 'No suggestion returned.'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-black tracking-wider">Presentation</span>
                      <p className="mt-1 text-slate-300">{tackle.presentationTechnique || 'No suggestion returned.'}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-black tracking-wider">Rod / line</span>
                      <p className="mt-1 text-slate-300">{tackle.recommendedLineAndRod || 'No suggestion returned.'}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-5">
                <h4 className="text-xs font-black uppercase tracking-widest text-amber-300">Important limits</h4>
                <ul className="mt-3 space-y-2 text-xs text-amber-100/70 leading-relaxed">
                  {result.warnings.map((warning) => <li key={warning}>• {warning}</li>)}
                </ul>
              </div>
            </div>
          )}
        </section>
      </div>

      {logOpen && result && (
        <div className="fixed inset-0 z-[70] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Save catch">
          <div className="w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl p-6 shadow-2xl">
            <h3 className="text-lg font-black uppercase tracking-wider text-white">Save real catch</h3>
            <p className="mt-1 text-xs text-slate-500">Only fields you enter or the analysis returned are saved. No weather, location, bait, or regulation data is invented.</p>

            <div className="mt-5 grid sm:grid-cols-2 gap-3">
              <input value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder="Location, optional" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500" />
              <input value={baitUsed} onChange={(event) => setBaitUsed(event.target.value)} placeholder="Bait / lure, optional" className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500" />
              <select value={waterClarity} onChange={(event) => setWaterClarity(event.target.value as typeof waterClarity)} className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500">
                <option value="">Water clarity, optional</option>
                <option value="CLEAR">Clear</option>
                <option value="STAINED">Stained</option>
                <option value="MUDDY">Muddy</option>
              </select>
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes, optional" rows={3} className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-emerald-500" />
            </div>

            <div className="mt-5 flex gap-2 justify-end">
              <button onClick={() => setLogOpen(false)} className="px-4 py-2.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-wider">Cancel</button>
              <button onClick={() => void saveCatch()} disabled={saving} className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-black uppercase tracking-wider disabled:opacity-50">
                {saving ? 'Saving...' : 'Save catch'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FishDimensionEstimator;
