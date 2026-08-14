import React, { useState, useEffect } from 'react';
import { Package, PlusCircle, CheckCircle2, AlertCircle, Trash2, Tag, Search, Sparkles } from 'lucide-react';
import { TackleItem } from '../types/catchLogTypes';
import { loadStoredTackle, saveStoredTackle } from '../utils/storage';

export const TackleBoxInventoryView: React.FC = () => {
  const [items, setItems] = useState<TackleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Load persisted tackle box on mount — a new user starts EMPTY.
  useEffect(() => {
    setItems(loadStoredTackle());
  }, []);

  // Persist every change.
  useEffect(() => {
    saveStoredTackle(items);
  }, [items]);

  // New Item Form
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<TackleItem['category']>('SOFT_PLASTICS');
  const [newColor, setNewColor] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newNotes, setNewNotes] = useState('');

  const filteredItems = items.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.colorPattern.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddItem = () => {
    if (!newName) return;
    const newItem: TackleItem = {
      id: `tackle-${Date.now()}`,
      name: newName,
      category: newCategory,
      colorPattern: newColor || 'Standard',
      quantity: newQty,
      notes: newNotes,
    };
    setItems([newItem, ...items]);
    setIsAddModalOpen(false);
    setNewName('');
    setNewColor('');
    setNewNotes('');
  };

  const handleDeleteItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6 font-sans text-slate-900">
      {/* Header Banner */}
      <div className="bg-slate-900 border-l-4 border-amber-500 p-6 border-y border-r border-white/10 shadow-2xl rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest rounded">
              FishAI Tackle Box Manager
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold uppercase flex items-center gap-1">
              <Package className="w-3.5 h-3.5" /> Personal Gear & Lure Inventory
            </span>
          </div>
          <h2 className="font-display text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            🧰 Digital Tackle Box Inventory
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Catalog your lures, hooks, lines, and terminal tackle. Track quantities and cross-reference with AI lure recommendations.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black uppercase text-xs tracking-wider rounded-lg shadow-lg flex items-center gap-2 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Tackle Item</span>
        </button>
      </div>

      {/* Control Toolbar */}
      <div className="bg-slate-900 p-4 border border-white/10 rounded-xl shadow-lg flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="SEARCH TACKLE BOX..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 text-white text-xs font-bold uppercase tracking-wider pl-9 pr-3 py-2 rounded-lg focus:outline-none focus:border-amber-500 font-mono"
          />
        </div>
        <span className="text-xs font-mono text-slate-400">{filteredItems.length} Total Gear Types Logged</span>
      </div>

      {/* Inventory Grid */}
      {items.length === 0 ? (
        <div className="bg-slate-900 border border-white/10 rounded-xl p-12 text-center space-y-4 shadow-xl">
          <Package className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="text-base font-black uppercase tracking-wider text-white">Your Tackle Box is Empty</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto font-mono">
            Add the lures, hooks, and lines you actually own. Your box is saved on this device and cross-referenced with your catch history in the Insights tab.
          </p>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-md inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Your First Tackle Item</span>
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => (
          <div key={item.id} className="bg-slate-900 border border-white/10 p-5 rounded-xl space-y-3 shadow-xl relative group">
            <div className="flex items-start justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-[9px] font-black uppercase text-amber-400 font-mono block">
                  {item.category.replace(/_/g, ' ')}
                </span>
                <h4 className="text-base font-black text-white uppercase">{item.name}</h4>
              </div>
              <button onClick={() => handleDeleteItem(item.id)} className="text-slate-500 hover:text-red-400 p-1">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs font-mono">
              <div className="flex items-center justify-between text-slate-300">
                <span>Color Pattern:</span>
                <span className="text-emerald-300 font-bold">{item.colorPattern}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>In Stock Quantity:</span>
                <span className="text-white font-bold">{item.quantity} in Box</span>
              </div>
            </div>

            {item.notes && (
              <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] font-mono text-slate-400 italic">
                "{item.notes}"
              </div>
            )}
          </div>
        ))}
      </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Package className="w-5 h-5 text-amber-400" /> Add Tackle to Digital Box
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white text-sm font-mono font-bold">✕</button>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Lure / Item Name:</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. 1/2 oz Jig"
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Category:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none"
                  >
                    <option value="SOFT_PLASTICS">Soft Plastics</option>
                    <option value="HARD_BAITS">Hard Baits</option>
                    <option value="SPINNERS_SPOONS">Spinners & Spoons</option>
                    <option value="HOOKS_RIGS">Hooks & Rigs</option>
                    <option value="LINE_REELS">Line & Reels</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold uppercase text-slate-400">Color Pattern:</label>
                  <input
                    type="text"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="e.g. Black & Blue"
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Quantity in Box:</label>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold uppercase text-slate-400">Notes:</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Heavy cover flipping jig."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
              <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs uppercase rounded-lg">Cancel</button>
              <button onClick={handleAddItem} className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-lg shadow-lg">Save Tackle Item</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
