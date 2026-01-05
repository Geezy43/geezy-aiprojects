
import React from 'react';
import { Sparkles, ArrowRight, Quote } from 'lucide-react';
import { SpiritualInsight } from '../types';

interface InsightPanelProps {
  insight: SpiritualInsight | null;
  loading: boolean;
}

const InsightPanel: React.FC<InsightPanelProps> = ({ insight, loading }) => {
  if (loading) {
    return (
      <div className="p-6 bg-[#111] rounded-2xl border border-[#222] animate-pulse">
        <div className="h-4 w-32 bg-[#222] rounded mb-4"></div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-[#222] rounded"></div>
          <div className="h-3 w-3/4 bg-[#222] rounded"></div>
        </div>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="p-6 bg-[#111] rounded-2xl border border-[#222] space-y-6">
      <div className="flex items-center gap-2 text-xs text-neutral-400 uppercase tracking-widest font-semibold">
        <Sparkles size={14} className="text-white" />
        The Counselor
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Theme</span>
          <h3 className="text-xl font-serif text-white">{insight.theme}</h3>
        </div>

        <div>
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-1">Semantic Correlation</span>
          <p className="text-sm text-neutral-300 leading-relaxed font-serif italic">
            <Quote size={12} className="inline mr-2 opacity-50" />
            {insight.correlation}
          </p>
        </div>

        <div>
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest block mb-3">Deep Dives</span>
          <ul className="space-y-3">
            {insight.questions.map((q, i) => (
              <li key={i} className="flex gap-3 group cursor-pointer">
                <ArrowRight size={14} className="mt-1 text-neutral-600 group-hover:text-white transition-colors shrink-0" />
                <span className="text-sm text-neutral-400 group-hover:text-neutral-200 transition-colors">{q}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default InsightPanel;
