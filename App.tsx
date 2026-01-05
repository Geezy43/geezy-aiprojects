
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import BibleTrigger from './components/BibleTrigger';
import InsightPanel from './components/InsightPanel';
import { JournalEntry, Verse, StreakData, SpiritualInsight, Translation } from './types';
import { getCounselorInsight, getDurationSummary } from './services/gemini';
import { fetchVerseFromApi } from './services/bible';
import { TRANSLATIONS } from './constants';
import { Plus, Send, X, Layers, Sparkles, ChevronLeft, Calendar, BookOpen, Clock, Loader2, Quote, Wand2, History as HistoryIcon, ChevronUp, ChevronDown, Info } from 'lucide-react';

type View = 'home' | 'editor';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [entries, setEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('lumina_entries');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [currentContent, setCurrentContent] = useState('');
  const [activeVerses, setActiveVerses] = useState<Verse[]>([]);
  const [streak, setStreak] = useState<StreakData>(() => {
    const saved = localStorage.getItem('lumina_streak');
    return saved ? JSON.parse(saved) : { count: 0, lastEntryDate: '' };
  });

  const [insight, setInsight] = useState<SpiritualInsight | null>(null);
  const [insightLoading, setInsightLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showBibleMenu, setShowBibleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Synthesis Module State
  const [synthesisDuration, setSynthesisDuration] = useState(7);
  const [synthesisText, setSynthesisText] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  const [isSwitchingTranslation, setIsSwitchingTranslation] = useState<number | null>(null);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('lumina_entries', JSON.stringify(entries));
    localStorage.setItem('lumina_streak', JSON.stringify(streak));
  }, [entries, streak]);

  // Calculate available span of history in days
  const availableDaysSpan = useMemo(() => {
    if (entries.length === 0) return 0;
    // Entries are stored newest first. Oldest is the last one.
    const oldestEntry = entries[entries.length - 1];
    const oldestTimestamp = parseInt(oldestEntry.id);
    const now = Date.now();
    const diffMs = now - oldestTimestamp;
    // We add 1 to ensure even a same-day entry allows a "1 day" summary
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }, [entries]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCurrentContent(val);

    const cursor = e.target.selectionStart;
    const textBefore = val.substring(0, cursor);
    const lastAt = textBefore.lastIndexOf('@');

    if (lastAt !== -1 && !textBefore.substring(lastAt).includes(' ')) {
      const query = textBefore.substring(lastAt + 1);
      setSearchQuery(query);
      setShowBibleMenu(true);
    } else {
      setShowBibleMenu(false);
    }
  };

  const handleVerseSelect = (verse: Verse) => {
    const newVerses = [...activeVerses, verse];
    setActiveVerses(newVerses);
    
    const cursor = editorRef.current?.selectionStart || 0;
    const lastAt = currentContent.substring(0, cursor).lastIndexOf('@');
    const newContent = 
      currentContent.substring(0, lastAt) + 
      `[${verse.fullReference}] ` + 
      currentContent.substring(cursor);
    
    setCurrentContent(newContent);
    setShowBibleMenu(false);
    
    setTimeout(() => {
        editorRef.current?.focus();
    }, 50);
  };

  const handleTranslationChange = async (idx: number, newTranslation: Translation) => {
    const verse = activeVerses[idx];
    setIsSwitchingTranslation(idx);
    
    const updatedVerse = await fetchVerseFromApi(verse.fullReference, newTranslation);
    
    if (updatedVerse) {
      const newVerses = [...activeVerses];
      newVerses[idx] = updatedVerse;
      setActiveVerses(newVerses);
    }
    
    setIsSwitchingTranslation(null);
  };

  const saveEntry = async () => {
    if (!currentContent.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        content: currentContent,
        verses: activeVerses,
        tags: []
      };

      const today = new Date().toDateString();
      if (streak.lastEntryDate !== today) {
        setStreak(prev => ({
          count: prev.count + 1,
          lastEntryDate: today
        }));
      }

      setEntries([newEntry, ...entries]);
      
      setInsightLoading(true);
      const aiInsight = await getCounselorInsight(currentContent, entries);
      setInsight(aiInsight);
      setInsightLoading(false);

      setCurrentContent('');
      setActiveVerses([]);
      setView('home');
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateSynthesis = async () => {
    if (entries.length === 0 || synthesisDuration > availableDaysSpan) return;
    setIsSynthesizing(true);
    setSynthesisText(null);
    const summary = await getDurationSummary(entries, synthesisDuration);
    setSynthesisText(summary);
    setIsSynthesizing(false);
  };

  const removeVerse = (idx: number) => {
    setActiveVerses(prev => prev.filter((_, i) => i !== idx));
  };

  const startNewEntry = () => {
    setCurrentContent('');
    setActiveVerses([]);
    setInsight(null);
    setSynthesisText(null);
    setView('editor');
  };

  const openExistingEntry = (e: JournalEntry) => {
    setCurrentContent(e.content);
    setActiveVerses(e.verses);
    setView('editor');
  };

  const isDurationValid = synthesisDuration <= availableDaysSpan && entries.length > 0;

  return (
    <div className="flex min-h-screen bg-[#0a0a0a]">
      <Sidebar 
        streak={streak} 
        history={entries} 
        onSelectEntry={openExistingEntry}
      />

      <main className="flex-1 flex flex-col md:flex-row bg-[#0a0a0a] h-screen overflow-hidden gpu">
        {view === 'home' ? (
          <div className="flex-1 flex flex-col p-8 md:p-12 lg:p-24 max-w-6xl mx-auto w-full overflow-y-auto smooth-scroll-container">
            <header className="mb-12 animate-fade-in">
              <h2 className="text-4xl font-serif font-bold text-white mb-4">Welcome back to Sanctuary.</h2>
              <p className="text-neutral-500 text-lg">Your spiritual journey is waiting for its next chapter.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
              
              {/* Action Card */}
              <button 
                onClick={startNewEntry}
                className="lg:col-span-1 group flex flex-col items-center justify-center border-2 border-dashed border-[#222] hover:border-white/20 hover:bg-[#111] transition-all rounded-3xl p-10 text-center space-y-4 gpu"
              >
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-white/5">
                  <Plus className="text-black" size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">New Reflection</h3>
                  <p className="text-neutral-500 text-sm">Transcribe your morning prayer or study</p>
                </div>
              </button>

              {/* Summary Statistics Card */}
              <div className="bg-[#111] border border-[#222] rounded-3xl p-8 space-y-6 gpu">
                <div className="flex items-center gap-3 text-xs text-neutral-500 uppercase tracking-widest font-semibold">
                  <Calendar size={14} />
                  Summary
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-sm">Total Entries</span>
                    <span className="text-white font-mono">{entries.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-400 text-sm">Active Streak</span>
                    <span className="text-orange-500 font-mono font-bold">{streak.count} Days</span>
                  </div>
                  <div className="pt-4 border-t border-[#222]">
                    <div className="flex items-center gap-2 text-neutral-600 text-[10px] uppercase tracking-widest mb-4">
                      <Clock size={12} />
                      Recent Activity
                    </div>
                    <div className="space-y-3">
                      {entries.slice(0, 3).map(e => (
                        <div key={e.id} className="flex items-center justify-between group cursor-pointer content-visibility-auto" onClick={() => openExistingEntry(e)}>
                          <span className="text-xs text-neutral-400 truncate max-w-[150px] group-hover:text-white transition-colors">{e.content || "Untitled"}</span>
                          <span className="text-[10px] text-neutral-600">{e.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Synthesis Generation Card */}
              <div className="bg-[#111] border border-[#222] rounded-3xl p-8 space-y-6 gpu">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-neutral-500 uppercase tracking-widest font-semibold">
                    <Sparkles size={14} className="text-white" />
                    Spiritual Synthesis
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-xs text-neutral-500 leading-relaxed">
                    Request a transient summary of your journey for any custom duration.
                  </p>
                  
                  <div className="flex flex-col gap-3">
                    <div className={`flex items-center justify-between p-3 bg-black rounded-xl border transition-colors group ${!isDurationValid && synthesisDuration > 0 && entries.length > 0 ? 'border-red-900/50 focus-within:border-red-500' : 'border-[#222] focus-within:border-[#444]'}`}>
                      <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Duration (Days)</span>
                      <div className="flex items-center gap-2">
                         <div className="flex flex-col">
                            <button 
                              onClick={() => setSynthesisDuration(prev => prev + 1)}
                              className="text-neutral-600 hover:text-white transition-colors"
                            >
                               <ChevronUp size={12} />
                            </button>
                            <button 
                              onClick={() => setSynthesisDuration(prev => Math.max(1, prev - 1))}
                              className="text-neutral-600 hover:text-white transition-colors"
                            >
                               <ChevronDown size={12} />
                            </button>
                         </div>
                         <input 
                            type="number" 
                            min="1" 
                            max="365"
                            value={synthesisDuration}
                            onChange={(e) => setSynthesisDuration(Math.max(1, parseInt(e.target.value) || 1))}
                            className="bg-transparent text-white text-right w-12 outline-none font-mono text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                         />
                      </div>
                    </div>

                    {!isDurationValid && entries.length > 0 && (
                      <div className="flex items-start gap-2 text-[10px] text-red-500/80 leading-tight">
                         <Info size={12} className="shrink-0" />
                         <span>History span is only {availableDaysSpan} day{availableDaysSpan > 1 ? 's' : ''}.</span>
                      </div>
                    )}

                    <button
                      onClick={handleGenerateSynthesis}
                      disabled={isSynthesizing || !isDurationValid}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-[#1a1a1a] hover:bg-[#222] text-white text-xs font-bold rounded-xl border border-[#333] transition-all disabled:opacity-30 gpu shadow-xl shadow-black/20"
                    >
                      {isSynthesizing ? (
                        <>
                          Weaving Insight...
                          <Loader2 size={14} className="animate-spin" />
                        </>
                      ) : (
                        <>
                          Generate Trajectory
                          <Wand2 size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Transient Summary Display Area */}
            {synthesisText && (
              <div className="mt-12 animate-fade-in">
                <div className="bg-[#0d0d0d] border border-white/5 rounded-[2rem] p-10 md:p-16 relative overflow-hidden group shadow-2xl">
                  <div className="absolute top-0 right-0 p-8">
                     <button onClick={() => setSynthesisText(null)} className="text-neutral-600 hover:text-white transition-colors p-2">
                        <X size={20} />
                     </button>
                  </div>
                  <div className="max-w-3xl mx-auto space-y-8">
                    <div className="flex items-center gap-4 text-xs text-neutral-600 uppercase tracking-[0.4em] font-bold">
                      <div className="h-px w-8 bg-neutral-800"></div>
                      Theological Snapshot: {synthesisDuration} Day{synthesisDuration > 1 ? 's' : ''}
                      <div className="h-px w-8 bg-neutral-800"></div>
                    </div>
                    <div className="font-serif text-xl md:text-2xl text-neutral-300 leading-[1.8] space-y-6 whitespace-pre-wrap italic opacity-90">
                      {synthesisText}
                    </div>
                    <div className="pt-8 border-t border-[#1a1a1a] flex justify-center">
                       <p className="text-[10px] text-neutral-600 uppercase tracking-widest italic">Transient Reflection • Not Saved</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Editor Section */
          <div className="flex-1 flex flex-col h-full overflow-hidden gpu animate-fade-in">
            <header className="flex items-center justify-between px-6 md:px-12 py-8 shrink-0 border-b border-[#1a1a1a]/50">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setView('home')}
                  className="flex items-center gap-1 text-neutral-500 hover:text-white transition-colors text-xs uppercase tracking-widest font-semibold"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
                <div className="h-4 w-px bg-neutral-800"></div>
                <span className="text-xs text-neutral-500 font-mono tracking-widest uppercase">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] hidden sm:block">Sanctuary Mode</span>
              </div>
            </header>

            <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto px-6 md:px-12 pb-24 smooth-scroll-container"
            >
              <div className="max-w-4xl mx-auto space-y-12 py-12">
                <div className="relative min-h-[50vh]">
                  <textarea
                    ref={editorRef}
                    autoFocus
                    value={currentContent}
                    onChange={handleTextChange}
                    placeholder="Begin your reflection... (Use @ for scripture)"
                    className="w-full h-full bg-transparent border-none outline-none resize-none font-serif text-2xl leading-relaxed text-neutral-300 placeholder:text-neutral-800 transition-colors"
                    style={{ minHeight: '50vh' }}
                  />
                  
                  {showBibleMenu && (
                    <div className="animate-fade-in">
                      <BibleTrigger 
                        searchQuery={searchQuery}
                        onSelect={handleVerseSelect}
                        onClose={() => setShowBibleMenu(false)}
                      />
                    </div>
                  )}
                </div>

                {activeVerses.length > 0 && (
                  <div className="pt-12 border-t border-[#1a1a1a] space-y-6">
                    <div className="flex items-center gap-3 text-[10px] text-neutral-600 uppercase tracking-[0.3em] font-bold">
                      <BookOpen size={14} />
                      Scriptural Anchors
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {activeVerses.map((v, i) => (
                        <div key={i} className="group bg-[#0d0d0d] border border-[#1a1a1a] hover:border-[#333] transition-all rounded-2xl p-6 relative overflow-hidden gpu content-visibility-auto">
                          {isSwitchingTranslation === i && (
                            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-10">
                              <Loader2 size={24} className="animate-spin text-white" />
                            </div>
                          )}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-white uppercase tracking-widest">{v.fullReference}</span>
                              <span className="px-2 py-0.5 rounded bg-[#1a1a1a] text-[9px] text-neutral-500 font-mono">{v.translation}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <select 
                                value={v.translation}
                                onChange={(e) => handleTranslationChange(i, e.target.value as Translation)}
                                className="bg-transparent text-[10px] text-neutral-500 uppercase border-none outline-none focus:text-white transition-colors cursor-pointer"
                              >
                                {TRANSLATIONS.map(t => <option key={t} value={t}>{t}</option>)}
                              </select>
                              <button 
                                onClick={() => removeVerse(i)} 
                                className="text-neutral-700 hover:text-red-500 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>
                          <div className="flex gap-4">
                            <Quote className="text-neutral-800 shrink-0" size={24} />
                            <p className="text-lg text-neutral-400 font-serif italic leading-relaxed">
                              {v.text}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <footer className="shrink-0 bg-[#0a0a0a] border-t border-[#1a1a1a]/50 py-6 px-6 md:px-12 shadow-2xl z-20">
              <div className="max-w-4xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-4 text-neutral-600">
                  <button className="hover:text-neutral-300 transition-colors flex items-center gap-2 text-xs uppercase tracking-widest">
                    <Layers size={18} />
                    <span className="hidden sm:inline">Thematic Tags</span>
                  </button>
                </div>
                <button 
                  onClick={saveEntry}
                  disabled={!currentContent.trim() || isSaving}
                  className="flex items-center gap-3 px-8 py-3 bg-white text-black text-sm font-bold rounded-full hover:bg-neutral-200 transition-all disabled:opacity-20 shadow-2xl shadow-white/5 min-w-[160px] justify-center gpu"
                >
                  {isSaving ? (
                    <>
                      Sealing...
                      <Loader2 size={16} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      Seal Entry
                      <Send size={16} />
                    </>
                  )}
                </button>
              </div>
            </footer>
          </div>
        )}

        {view === 'editor' && (
          <div className="w-full md:w-96 p-6 md:p-12 border-l border-[#1a1a1a] bg-[#0d0d0d] overflow-y-auto hidden lg:block smooth-scroll-container">
            <InsightPanel insight={insight} loading={insightLoading} />
            
            {!insight && !insightLoading && (
               <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-30 gpu animate-fade-in">
                  <Sparkles size={40} className="mb-2" />
                  <h4 className="font-serif italic text-lg text-neutral-400">The Counselor is waiting</h4>
                  <p className="text-xs text-neutral-500 max-w-[200px]">Seal your entry to receive theological synthesis and reflection prompts.</p>
               </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
