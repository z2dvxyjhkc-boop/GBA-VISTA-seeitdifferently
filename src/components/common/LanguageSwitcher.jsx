import React from 'react';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher({ availableLangs, lang, setLang, langLabel, variant = 'dark' }) {
  // Si la noticia solo tiene un idioma, no hay nada que elegir.
  if (!availableLangs || availableLangs.length <= 1) return null;

  const isDark = variant === 'dark';

  const pillBase = isDark
    ? 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:bg-white/10'
    : 'bg-[#f5f5f7] border-[#d2d2d7] text-[#86868b] hover:text-[#1d1d1f] hover:bg-white';

  const pillActive = isDark
    ? 'bg-white text-[#121212] border-white'
    : 'bg-[#1d1d1f] text-white border-[#1d1d1f]';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Languages size={13} className={isDark ? 'text-white/30' : 'text-[#86868b]'} />
      {availableLangs.map((l) => (
        <button
          key={l}
          onClick={(e) => {
            e.stopPropagation();
            setLang(l);
          }}
          className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all active:scale-95 ${
            l === lang ? pillActive : pillBase
          }`}
        >
          {langLabel(l)}
        </button>
      ))}
    </div>
  );
}