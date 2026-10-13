import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LANG_OPTIONS = [
  { code: 'en', name: 'English', sub: 'English' },
  { code: 'hi', name: 'हिन्दी', sub: 'Hindi' },
  { code: 'hinglish', name: 'Hinglish', sub: 'Hisaab-Kitaab' },
  { code: 'te', name: 'తెలుగు', sub: 'Telugu' },
  { code: 'ta', name: 'தமிழ்', sub: 'Tamil' },
];

const LanguageSelector = () => {
  const { currentLang, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeOption = LANG_OPTIONS.find((l) => l.code === currentLang) || LANG_OPTIONS[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold transition-all shadow-sm"
        title="Select Language / भाषा चुनें"
      >
        <Globe className="w-3.5 h-3.5 text-indigo-400" />
        <span className="tracking-tight">{activeOption.name}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-1.5 z-50 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800/80 mb-1">
            Choose Language / भाषा
          </div>
          {LANG_OPTIONS.map((opt) => (
            <button
              key={opt.code}
              onClick={() => {
                setLanguage(opt.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                currentLang === opt.code
                  ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <div className="text-left">
                <span className="block leading-tight text-slate-100">{opt.name}</span>
                <span className="text-[10px] text-slate-400 leading-tight">{opt.sub}</span>
              </div>
              {currentLang === opt.code && <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
