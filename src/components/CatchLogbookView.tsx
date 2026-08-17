import React, { useState } from 'react';
import { CatchLogItem, FishingSpot, WeatherSnapshot } from '../types/catchLogTypes';
import { exportCatchesToCSV } from '../utils/storage';
import { fetchLiveWeather, resolveWeatherCoords } from '../utils/weather';
import { SPECIES_OPTIONS } from '../utils/species';
import {
  BookOpen,
  Search,
  Trash2,
  CloudSun,
  MapPin,
  Anchor,
  Ruler,
  Scale,
  PlusCircle,
  Sparkles,
  Award,
  TrendingUp,
  Filter,
  Download,
  X,
  Loader2,
  Fish,
} from 'lucide-react';

interface CatchLogbookViewProps {
  catches: CatchLogItem[];
  spots: FishingSpot[];
  onDeleteCatch: (id: string) => void;
  onAddCatch: (catchItem: Omit<CatchLogItem, 'id' | 'timestamp' | 'formattedDate'>) => void;
  onNavigateToFishVision: () => void;
}

const MANUAL_SPECIES = SPECIES_OPTIONS;

export const CatchLogbookView: React.FC<CatchLogbookViewProps> = ({
  catches,
  spots,
  onDeleteCatch,
  onAddCatch,
  onNavigateToFishVision,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpeciesFilter, setSelectedSpeciesFilter] = useState('ALL');
  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);

  // Quick log form state
  const [qSpecies, setQSpecies] = useState('');
  const [qCustomSpecies, setQCustomSpecies] = useState('');
  const [qLength, setQLength] = useState('');
  const [qWeight, setQWeight] = useState('');
  const [qBait, setQBait] = useState('');
  const [qLureColor, setQLureColor] = useState('');
  const [qTechnique, setQTechnique] = useState('');
  const [qLocation, setQLocation] = useState('');
  const [qClarity, setQClarity] = useState<'CLEAR' | 'STAINED' | 'MUDDY'>('STAINED');
  const [qNotes, setQNotes] = useState('');
  const [qAttachWeather, setQAttachWeather] = useState(false);
  const [qWeather, setQWeather] = useState<WeatherSnapshot | null>(null);
  const [qWeatherLoading, setQWeatherLoading] = useState(false);
  const [qWeatherError, setQWeatherError] = useState<string | null>(null);
  const [qTemp, setQTemp] = useState('');
  const [qCondition, setQCondition] = useState('');
  const [qSaveMsg, setQSaveMsg] = useState<string | null>(null);

  // Unique species list for filter dropdown
  const speciesList = Array.from(new Set(catches.map((c) => c.commonName || c.species)));

  // Filter catches by search and species filter
  const filteredCatches = catches.filter((item) => {
    const matchesSearch =
      item.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.baitUsed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpecies =
      selectedSpeciesFilter === 'ALL' ||
      item.species.includes(selectedSpeciesFilter) ||
      item.commonName.includes(selectedSpeciesFilter);

    return matchesSearch && matchesSpecies;
  });

  // Render-only grouping of the filtered log by date (date part of formattedDate, e.g. "Jul 12, 2026")
  const groupedCatches = filteredCatches.reduce<Record<string, CatchLogItem[]>>((groups, item) => {
    const dateKey = (item.formattedDate.split('•')[0] || item.formattedDate).trim() || 'Unknown Date';
    (groups[dateKey] = groups[dateKey] || []).push(item);
    return groups;
  }, {});

  // Analytics metrics calculation — real, from logged data
  const totalCatches = catches.length;

  const speciesCounts: Record<string, number> = {};
  const baitCounts: Record<string, number> = {};
  const spotCounts: Record<string, number> = {};

  catches.forEach((c) => {
    const s = c.commonName || c.species;
    speciesCounts[s] = (speciesCounts[s] || 0) + 1;
    if (c.baitUsed) baitCounts[c.baitUsed] = (baitCounts[c.baitUsed] || 0) + 1;
    if (c.locationName) spotCounts[c.locationName] = (spotCounts[c.locationName] || 0) + 1;
  });

  const topSpecies = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const topBait = Object.entries(baitCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const topSpot = Object.entries(spotCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

  const attachLiveWeather = async () => {
    setQWeatherLoading(true);
    setQWeatherError(null);
    try {
      const coords = await resolveWeatherCoords(spots);
      if (!coords) {
        setQWeatherError('Location unavailable — allow browser location or add a spot with coordinates.');
        return;
      }
      const w = await fetchLiveWeather(coords.latitude, coords.longitude);
      if (!w) {
        setQWeatherError('Live weather service unreachable — enter conditions manually below.');
        return;
      }
      setQWeather({
        temperatureF: w.current.temperatureF,
        condition: w.current.condition,
        windSpeedMph: w.current.windSpeedMph,
        windDirection: w.current.windDirection,
        barometricPressureInHg: w.current.pressureInHg,
        waterTempF: undefined,
        source: 'live',
        fetchedAt: w.fetchedAt,
      });
      setQAttachWeather(true);
    } catch (e) {
      setQWeatherError('Could not fetch live weather.');
    } finally {
      setQWeatherLoading(false);
    }
  };

  const handleQuickLogSave = () => {
    const commonName = qSpecies === 'Other / Custom' ? qCustomSpecies.trim() : qSpecies;
    if (!commonName) {
      setQSaveMsg('Pick a species first.');
      return;
    }

    const weather: WeatherSnapshot | undefined = qAttachWeather
      ? qWeather || {
          temperatureF: Number(qTemp) || 0,
          condition: qCondition || 'Not Recorded',
          windSpeedMph: 0,
          windDirection: 'N',
          barometricPressureInHg: 0,
          source: 'manual',
        }
      : undefined;

    const lengthStr = qLength ? `${qLength} inches` : 'Not measured';
    const weightStr = qWeight ? `${qWeight} lbs` : 'Not weighed';

    onAddCatch({
      species: commonName,
      commonName,
      scientificName: '',
      photoUrl: '',
      estimatedLength: lengthStr,
      estimatedWeight: weightStr,
      weather,
      baitUsed: qBait || 'Unspecified Bait',
      locationName: qLocation || 'Unspecified Location',
      waterClarity: qClarity,
      notes: qNotes,
      lureColor: qLureColor || undefined,
      technique: qTechnique || undefined,
    });

    setQSaveMsg('Catch logged!');
    setTimeout(() => {
      setIsQuickLogOpen(false);
      setQSaveMsg(null);
      // reset form
      setQSpecies('');
      setQCustomSpecies('');
      setQLength('');
      setQWeight('');
      setQBait('');
      setQLureColor('');
      setQTechnique('');
      setQLocation('');
      setQClarity('STAINED');
      setQNotes('');
      setQAttachWeather(false);
      setQWeather(null);
      setQWeatherError(null);
      setQTemp('');
      setQCondition('');
    }, 700);
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-blue-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-blue-600 text-white font-black text-xs uppercase tracking-widest rounded">
              FishAI Angler Logbook
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Pattern & Spot History Active
            </span>
          </div>
          <h2 className="text-2xl font-display font-black uppercase text-white tracking-tight flex items-center gap-2">
            📖 Personal Catch Logbook & Spot Analytics
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Record identified catches, track weather conditions, analyze bait productivity, and log successful fishing spots over time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportCatchesToCSV(catches)}
            disabled={catches.length === 0}
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 font-bold text-xs uppercase tracking-wider rounded-lg border border-slate-700 flex items-center gap-1.5 transition-all"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsQuickLogOpen(true)}
            className="px-3.5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Quick Log Catch</span>
          </button>

          <button
            onClick={onNavigateToFishVision}
            className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Identify & Log New Catch</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Row — every metric is computed from logged catches */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5 text-blue-400" /> Total Catches Logged
          </span>
          <span className="text-2xl font-black text-white font-mono">{totalCatches}</span>
        </div>

        <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-emerald-400" /> Top Species
          </span>
          <span className="text-base font-black text-emerald-400 truncate block">{topSpecies}</span>
        </div>

        <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Anchor className="w-3.5 h-3.5 text-amber-400" /> Top Bait / Lure
          </span>
          <span className="text-base font-black text-amber-400 truncate block">{topBait}</span>
        </div>

        <div className="bg-slate-900 border border-white/10 p-4 rounded-xl space-y-1 shadow-xl">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Top Spot
          </span>
          <span className="text-base font-black text-cyan-400 truncate block">{topSpot}</span>
        </div>
      </div>

      {/* Control Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 p-4 border border-white/10 rounded-xl shadow-lg">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="SEARCH SPECIES, SPOT, BAIT, OR NOTES..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-bold uppercase tracking-wider pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-blue-500 font-mono"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedSpeciesFilter}
            onChange={(e) => setSelectedSpeciesFilter(e.target.value)}
            className="bg-slate-950 text-white text-xs font-bold uppercase tracking-wider px-3 py-2 rounded-lg border border-slate-800 focus:outline-none cursor-pointer w-full sm:w-auto font-mono"
          >
            <option value="ALL">All Species ({catches.length})</option>
            {speciesList.map((sp) => (
              <option key={sp} value={sp}>
                {sp}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Catches Grid */}
      {filteredCatches.length === 0 ? (
        <div className="bg-slate-900 border border-white/10 rounded-xl p-12 text-center space-y-4 shadow-xl">
          <BookOpen className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-black uppercase tracking-wider text-white">
            No Catch Records Found
          </h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            {catches.length === 0
              ? 'Your catch logbook is currently empty. Log your first catch — the FishAI Vision Estimator (photo ID) or Quick Log (fast manual entry) both work.'
              : 'No catch entries match your search or filter query.'}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={onNavigateToFishVision}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-md inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Open FishAI Vision Estimator</span>
            </button>
            <button
              onClick={() => setIsQuickLogOpen(true)}
              className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-md inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Quick Log a Catch</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Emerald summary strip — every catch teaches FishAI */}
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-2 shadow-lg">
            <span className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">
              {filteredCatches.length} catch{filteredCatches.length === 1 ? '' : 'es'} logged
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400/80 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Every Catch Teaches FishAI
            </span>
          </div>

          {/* Catches grouped by date */}
          {Object.entries(groupedCatches).map(([date, items]) => (
            <div key={date} className="space-y-3">
              {/* Group header by date */}
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{date}</span>
                <span className="flex-1 h-px bg-slate-800" />
                <span className="text-[10px] font-mono text-slate-500">
                  {items.length} catch{items.length === 1 ? '' : 'es'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900 border border-white/10 rounded-xl p-4 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all"
                  >
                    {/* Header row: species badge + name, photo thumb, delete */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                          <Fish className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-white uppercase tracking-tight truncate leading-tight">
                            {item.species}
                          </h3>
                          {item.scientificName && (
                            <span className="text-[10px] text-slate-500 font-mono italic block truncate">
                              {item.scientificName}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.photoUrl && (
                          <img
                            src={item.photoUrl}
                            alt={item.species}
                            className="w-11 h-11 object-cover rounded-lg border border-slate-800"
                          />
                        )}
                        <button
                          onClick={() => onDeleteCatch(item.id)}
                          title="Delete Catch Entry"
                          className="p-2 text-slate-500 hover:text-red-400 bg-slate-950 hover:bg-red-500/10 rounded-lg border border-slate-800 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Key numbers: weight as a big emerald mono figure */}
                    <div className="flex items-end justify-between gap-3 mt-3">
                      <div className="min-w-0">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                          <Scale className="w-3 h-3 text-emerald-400 inline -mt-0.5 mr-1" /> Weight
                        </span>
                        <span
                          className={`font-mono font-black block truncate ${
                            item.estimatedWeight === 'Not weighed'
                              ? 'text-sm text-slate-500'
                              : 'text-2xl text-emerald-400'
                          }`}
                        >
                          {item.estimatedWeight}
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 block">
                          <Ruler className="w-3 h-3 text-blue-400 inline -mt-0.5 mr-1" /> Length
                        </span>
                        <span className="text-xs font-mono font-bold text-white block">{item.estimatedLength}</span>
                      </div>
                    </div>

                    {/* Meta row: location + date + bait — small slate-400 */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 text-[11px] font-mono text-slate-400">
                      {item.locationName && (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{item.locationName}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1.5 shrink-0">{item.formattedDate}</span>
                      {item.baitUsed && (
                        <span className="flex items-center gap-1.5 min-w-0">
                          <Anchor className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">Bait: {item.baitUsed}</span>
                        </span>
                      )}
                    </div>

                    {/* Weather Snapshot */}
                    {item.weather && (
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono mt-3">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                          <CloudSun className="w-4 h-4 text-amber-400" />
                          <span>{item.weather.temperatureF}°F • {item.weather.condition}</span>
                          {item.weather.source === 'live' && (
                            <span className="text-[9px] uppercase text-emerald-400 border border-emerald-500/40 rounded px-1 py-0.5">live</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-slate-400 text-[10px]">
                          <span>Wind: {item.weather.windSpeedMph} mph {item.weather.windDirection}</span>
                          <span>Pressure: {item.weather.barometricPressureInHg} inHg</span>
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {item.notes && (
                      <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300 italic mt-3">
                        "{item.notes}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Log Modal */}
      {isQuickLogOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-white/10 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-cyan-400" /> Quick Log Catch
              </h3>
              <button
                onClick={() => setIsQuickLogOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-mono font-bold"
              >
                ✕
              </button>
            </div>

            {qSaveMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/40 p-3 rounded-xl text-emerald-300 text-xs font-mono text-center">
                {qSaveMsg}
              </div>
            )}

            <div className="space-y-3 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Species *</label>
                <select
                  value={qSpecies}
                  onChange={(e) => setQSpecies(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none"
                >
                  <option value="">Select species...</option>
                  {MANUAL_SPECIES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {qSpecies === 'Other / Custom' && (
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Custom Species Name *</label>
                  <input
                    type="text"
                    value={qCustomSpecies}
                    onChange={(e) => setQCustomSpecies(e.target.value)}
                    placeholder="e.g. Chain Pickerel"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Length (in, optional)</label>
                  <input
                    type="number"
                    value={qLength}
                    onChange={(e) => setQLength(e.target.value)}
                    placeholder="e.g. 18.5"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Weight (lbs, optional)</label>
                  <input
                    type="number"
                    value={qWeight}
                    onChange={(e) => setQWeight(e.target.value)}
                    placeholder="e.g. 3.2"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Bait / Lure</label>
                  <input
                    type="text"
                    value={qBait}
                    onChange={(e) => setQBait(e.target.value)}
                    placeholder="e.g. Green Pumpkin Senko"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Lure Color</label>
                  <input
                    type="text"
                    value={qLureColor}
                    onChange={(e) => setQLureColor(e.target.value)}
                    placeholder="e.g. Green Pumpkin"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Technique</label>
                  <input
                    type="text"
                    value={qTechnique}
                    onChange={(e) => setQTechnique(e.target.value)}
                    placeholder="e.g. Wacky rig, slow drag"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Water Clarity</label>
                  <select
                    value={qClarity}
                    onChange={(e) => setQClarity(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none"
                  >
                    <option value="CLEAR">Clear</option>
                    <option value="STAINED">Stained</option>
                    <option value="MUDDY">Muddy</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Location / Spot</label>
                <input
                  type="text"
                  value={qLocation}
                  onChange={(e) => setQLocation(e.target.value)}
                  placeholder="e.g. North Lake Point"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Weather attach */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold uppercase text-slate-300 text-[11px] flex items-center gap-1.5">
                    <CloudSun className="w-3.5 h-3.5 text-cyan-400" /> Conditions
                  </label>
                  <button
                    type="button"
                    onClick={attachLiveWeather}
                    disabled={qWeatherLoading}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-black text-[10px] uppercase rounded-lg flex items-center gap-1.5"
                  >
                    {qWeatherLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CloudSun className="w-3 h-3" />}
                    {qWeather ? 'Live Weather Attached' : 'Attach Live Weather'}
                  </button>
                </div>

                {qWeatherError && (
                  <p className="text-[10px] text-amber-300 font-mono">{qWeatherError}</p>
                )}

                {qWeather ? (
                  <p className="text-[11px] font-mono text-emerald-300">
                    {qWeather.temperatureF}°F • {qWeather.condition} • wind {qWeather.windSpeedMph} mph {qWeather.windDirection} • {qWeather.barometricPressureInHg} inHg
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={qTemp}
                      onChange={(e) => setQTemp(e.target.value)}
                      placeholder="Temp °F (optional)"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-[11px] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={qCondition}
                      onChange={(e) => setQCondition(e.target.value)}
                      placeholder="Condition (e.g. Overcast)"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-white font-mono text-[11px] focus:outline-none"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Notes</label>
                <textarea
                  value={qNotes}
                  onChange={(e) => setQNotes(e.target.value)}
                  rows={2}
                  placeholder="Optional — technique details, fight notes..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setIsQuickLogOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs uppercase rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleQuickLogSave}
                className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg flex items-center gap-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Log Catch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
