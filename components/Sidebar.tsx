
import React, { memo } from 'react';
import { Flame, History, BarChart2, BookOpen, Settings } from 'lucide-react';
import { JournalEntry, StreakData } from '../types';

interface SidebarProps {
  streak: StreakData;
  history: JournalEntry[];
  onSelectEntry: (entry: JournalEntry) => void;
  activeId?: string;
}

const HistoryItem = memo(({ entry, isActive, onClick }: { entry: JournalEntry, isActive: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all group gpu content-visibility-auto ${
      isActive ? 'bg-[#171717] text-white' : 'text-neutral-500 hover:text-neutral-300'
    }`}
  >
    <div className="truncate font-medium group-hover:translate-x-1 transition-transform">{entry.content || "Empty entry"}</div>
    <div className="text-[10px] opacity-60">{entry.date}</div>
  </button>
));

const Sidebar: React.FC<SidebarProps> = ({ streak, history, onSelectEntry, activeId }) => {
  return (
    <aside className="w-80 h-screen border-r border-[#1a1a1a] bg-[#0a0a0a] flex flex-col p-6 hidden md:flex shrink-0">
      <div className="flex items-center gap-3 mb-10 gpu">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-inner">
          <BookOpen className="text-black" size={20} />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Lumina</h1>
          <p className="text-[10px] text-neutral-500 uppercase tracking-[0.2em]">Spiritual Journal</p>
        </div>
      </div>

      <div className="mb-10 bg-[#111] p-4 rounded-2xl border border-[#222] gpu hover:border-[#333] transition-colors shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-neutral-400 font-medium">Burning Bush Streak</span>
          <Flame className={streak.count > 0 ? "text-orange-500 animate-pulse" : "text-neutral-700"} size={18} />
        </div>
        <div className="text-3xl font-serif font-bold text-white flex items-baseline gap-2">
          {streak.count} <span className="text-xs text-neutral-500 uppercase tracking-widest font-sans">Days</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto space-y-8 smooth-scroll-container">
        <div>
          <div className="flex items-center gap-2 text-neutral-500 text-[10px] uppercase tracking-widest mb-4 sticky top-0 bg-[#0a0a0a] py-1 z-10">
            <History size={12} />
            Historical Entries
          </div>
          <div className="space-y-1">
            {history.length > 0 ? history.map(entry => (
              <HistoryItem 
                key={entry.id} 
                entry={entry} 
                isActive={activeId === entry.id} 
                onClick={() => onSelectEntry(entry)} 
              />
            )) : (
              <p className="text-[10px] text-neutral-700 italic px-3">No history yet.</p>
            )}
          </div>
        </div>
      </nav>

      <div className="pt-6 border-t border-[#1a1a1a] flex flex-col gap-4 gpu">
        <button className="flex items-center gap-3 text-neutral-500 hover:text-white transition-colors text-sm">
          <BarChart2 size={18} />
          Weekly Synthesis
        </button>
        <button className="flex items-center gap-3 text-neutral-500 hover:text-white transition-colors text-sm">
          <Settings size={18} />
          Settings
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
