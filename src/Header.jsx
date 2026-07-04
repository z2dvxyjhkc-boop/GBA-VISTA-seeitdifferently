import React from 'react';
import { Search, Bell } from 'lucide-react';

function AllianceLogo({ className = "", size = 28, color = "#1d1d1f" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <circle cx="12" cy="12" r="10.5" fill="#0066FF" opacity="0.1" />
      <path d="M 9 1.94 Q 11 13 22.45 13 L 9 13 Z" fill={color} opacity="0.8" />
      <line x1="9" y1="1.5" x2="9" y2="22.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="9" y1="13" x2="22.5" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// AQUÍ ESTÁ LA CORRECCIÓN: Recibimos 'user' como prop
const Header = ({ activeTab, user }) => {
  const titles = {
    home: 'Inicio',
    news: 'Global Insight',
    library: 'Mi Biblioteca',
    search: 'Explorar',
    mothership: 'Mothership Command'
  };

  return (
    <header className="fixed top-0 right-0 left-0 h-24 flex items-center justify-between px-6 md:px-12 z-[800] bg-[#fbfbfd]/80 backdrop-blur-xl border-b border-[#d2d2d7]/50">
      
      <div className="flex items-center gap-5">
        <AllianceLogo />
        <div className="h-8 w-px bg-[#d2d2d7]"></div>
        <h2 className="text-3xl md:text-4xl font-serif italic tracking-tight text-[#1d1d1f] animate-in slide-in-from-left-4 duration-500">
          {titles[activeTab] || 'VISTA'}
        </h2>
      </div>

      <div className="flex items-center gap-6 md:gap-8">
        <div className="relative group hidden lg:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#86868b] group-focus-within:text-[#0066FF] transition-colors" size={18} strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-white border border-[#d2d2d7] py-2 pl-11 pr-6 rounded-full text-sm outline-none focus:border-[#0066FF] focus:ring-4 ring-[#0066FF]/10 text-[#1d1d1f] placeholder:text-[#86868b] transition-all w-64 shadow-sm"
          />
        </div>

        <button className="text-[#1d1d1f] hover:text-[#0066FF] transition-colors relative">
          <Bell size={22} strokeWidth={1.5} />
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#fbfbfd]"></span>
        </button>

        <div className="flex items-center gap-4 pl-4 md:pl-6 border-l border-[#d2d2d7]">
          <div className="text-right hidden sm:block">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-[#86868b]">Alliance ID</p>
            {/* Usamos el prop 'user' real */}
            <p className="text-sm font-medium text-[#1d1d1f] tracking-tight mt-0.5">{user?.nombre || 'Invitado'}</p>
          </div>
          <button className="w-10 h-10 rounded-full overflow-hidden border border-[#d2d2d7] hover:border-[#86868b] transition-all active:scale-95 shadow-sm">
            <img 
              src={user?.avatar || "https://ui-avatars.com/api/?name=Santiago&background=1d1d1f&color=fff"} 
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;