
import React, { useState, useEffect } from 'react';
import { Search, Book, Loader2 } from 'lucide-react';
import { BOOKS_OF_BIBLE } from '../constants';
import { Verse } from '../types';
import { fetchVerseFromApi } from '../services/bible';

interface BibleTriggerProps {
  onSelect: (verse: Verse) => void;
  onClose: () => void;
  searchQuery: string;
}

const BibleTrigger: React.FC<BibleTriggerProps> = ({ onSelect, onClose, searchQuery }) => {
  const [results, setResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!searchQuery) {
      setResults(BOOKS_OF_BIBLE.slice(0, 8));
      return;
    }

    // Filter the book list first
    const bookMatches = BOOKS_OF_BIBLE.filter(book => 
      book.toLowerCase().startsWith(searchQuery.toLowerCase())
    );

    // If query looks like a reference (has numbers/colons), add it as a "Quick Jump"
    if (/\d/.test(searchQuery)) {
      setResults([searchQuery, ...bookMatches.slice(0, 5)]);
    } else {
      setResults(bookMatches.slice(0, 8));
    }
  }, [searchQuery]);

  const handleSelect = async (ref: string) => {
    setIsSearching(true);
    // Try to fetch the verse to see if it's valid
    const verse = await fetchVerseFromApi(ref);
    setIsSearching(false);

    if (verse) {
      onSelect(verse);
    } else {
      // If just a book name, maybe prompt to add chapter/verse or just ignore
      // For now, we only select if it's a valid resolvable reference
      alert(`"${ref}" is not a valid Bible reference. Please use format: Book Chapter:Verse`);
    }
  };

  return (
    <div className="absolute z-50 bg-[#171717] border border-[#262626] rounded-lg shadow-2xl w-72 max-h-80 overflow-y-auto mt-2">
      <div className="p-3 border-b border-[#262626] flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
        <div className="flex items-center gap-2">
          <Book size={12} />
          Bible Navigator
        </div>
        {isSearching && <Loader2 size={12} className="animate-spin text-white" />}
      </div>
      
      {results.length > 0 ? (
        results.map((res) => (
          <button
            key={res}
            disabled={isSearching}
            onClick={() => handleSelect(res)}
            className="w-full text-left px-4 py-3 hover:bg-[#262626] text-neutral-300 text-sm flex items-center justify-between border-b border-[#262626] last:border-b-0 disabled:opacity-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Search size={14} className="text-neutral-500" />
              <span className="font-serif italic">{res}</span>
            </div>
            {/\d/.test(res) && <span className="text-[10px] bg-neutral-800 px-1.5 py-0.5 rounded text-neutral-500">REF</span>}
          </button>
        ))
      ) : (
        <div className="p-4 text-xs text-neutral-500 text-center">
          No matches found for "{searchQuery}"
        </div>
      )}

      <div className="p-2 bg-[#0d0d0d] text-[9px] text-neutral-600 text-center italic">
        Tip: Type "@John 3:16" to jump directly
      </div>
    </div>
  );
};

export default BibleTrigger;
