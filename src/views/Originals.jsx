import React, { useEffect, useState } from 'react';
import { useContent } from '../hooks/useContent';
import { Play, Info, Star, Award, Zap, PlayCircle, Film } from 'lucide-react';

export default function Originals({ onSelectMovie }) {
  const { getAllContent } = useContent();
  const [originals, setOriginals] = useState([]);
  const [featured, setFeatured] = useState(null);
  const [loading, setLoading] = useState(true);

  const getCleanImg = (url) => {
    if (!url) return '';
    if (url.includes('img.youtube.com')) {
      return url.replace(/&[^/]+/, '').replace(/\?[^/]+/, '');
    }
    return url;
  };

  useEffect(() => {
    const loadOriginals = async () => {
      try {
        const all = await getAllContent();
        const safeAll = Array.isArray(all) ? all : [];
        
        const filtered = safeAll.filter(m => {
          if (!m) return false;
          
          const cat = m.categoria ? m.categoria.toUpperCase() : '';
          const esPelicula = cat === 'PELICULA' || cat === 'PELÍCULA' || cat === 'ORIGINAL';
          const esAprobado = !m.estado_publicacion || m.estado_publicacion === 'aprobado';
          const esGimg = !m.es_comunidad;

          return esPelicula && esAprobado && esGimg;
        });
        
        const sorted = filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        if (sorted.length > 0) {
          setFeatured(sorted[0]); 
          setOriginals(sorted.slice(1)); 
        }
      } catch (error) {
        console.error("Error cargando Originals:", error);
      } finally {
        setLoading(false);
      }
    };
    loadOriginals();
  }, [getAllContent]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfbfd]">
        <div className="flex flex-col items-center gap-6">
           <div className="w-12 h-12 border-4 border-[#d2d2d7] border-t-[#1d1d1f] rounded-full animate-spin"></div>
           <p className="text-[10px] font-black tracking-widest text-[#86868b] uppercase">Cargando Studio Collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbfbfd] pb-40 selection:bg-[#1d1d1f] selection:text-white font-sans transition-opacity duration-500">
      
      {/* --- 1. BRAND HEADER --- */}
      <div className="pt-16 md:pt-24 px-6 md:px-12 max-w-[1800px] mx-auto mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-[#1d1d1f] text-white text-[10px] font-black px-3 py-1 uppercase tracking-widest rounded shadow-sm">
            Studio Collection
          </div>
          <div className="flex text-[#1d1d1f] gap-1 opacity-50">
            <Star size={12} fill="currentColor"/>
            <Star size={12} fill="currentColor"/>
            <Star size={12} fill="currentColor"/>
          </div>
        </div>
        
        <h1 className="text-6xl md:text-8xl font-serif italic tracking-tighter text-[#1d1d1f] leading-[0.9]">
          Originals.
        </h1>
        <p className="text-[#86868b] text-lg md:text-xl font-medium leading-relaxed max-w-2xl mt-6">
          Una colección curada de historias extraordinarias. Producidas exclusivamente por GIMG Originals para el ecosistema VISTA.
        </p>
      </div>

      {/* --- 2. SPOTLIGHT CINEMÁTICO --- */}
      <div className="px-6 md:px-12 max-w-[1800px] mx-auto relative z-20 mb-24">
        {featured ? (
          <div 
            onClick={() => onSelectMovie && onSelectMovie(featured)}
            className="group relative w-full aspect-[16/9] md:aspect-[2.4/1] bg-[#0a0a0a] rounded-[2.5rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] cursor-pointer border border-[#d2d2d7]/20"
          >
            <img 
              src={getCleanImg(featured.banner_url || featured.poster_url)} 
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
              alt={featured.titulo}
            />
            
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/30 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent"></div>

            <div className="absolute bottom-0 left-0 p-8 md:p-16 max-w-3xl flex flex-col gap-6">
               <div className="flex items-center gap-3">
                 <span className="bg-white text-black px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded shadow-md">
                   Estreno Exclusivo
                 </span>
                 <span className="text-white/90 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 drop-shadow-md">
                    <Award size={14} className="text-[#0066FF]"/> Selección Oficial
                 </span>
               </div>
               
               <h2 className="text-4xl md:text-6xl font-serif italic text-white leading-none drop-shadow-2xl group-hover:opacity-90 transition-opacity">
                 {featured.titulo}
               </h2>
               
               <p className="text-base md:text-lg text-neutral-300 line-clamp-2 md:line-clamp-3 font-medium max-w-2xl drop-shadow-md">
                 {featured.descripcion}
               </p>

               <div className="flex items-center gap-4 mt-2">
                  <button className="bg-white text-black px-8 py-4 rounded-xl font-bold flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                    <Play fill="black" size={20}/> REPRODUCIR
                  </button>
                  <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-6 py-4 rounded-xl font-bold hover:bg-white/20 transition-all">
                    <Info size={20} />
                  </button>
               </div>
            </div>
          </div>
        ) : (
           <div className="w-full aspect-[21/9] md:aspect-[2.4/1] bg-[#f5f5f7] border border-dashed border-[#d2d2d7] rounded-[2.5rem] flex flex-col items-center justify-center text-center px-6 shadow-sm">
              <Film size={48} className="text-[#86868b] mb-4 opacity-50"/>
              <p className="text-[#1d1d1f] font-serif italic text-2xl mb-2">Próximamente</p>
              <p className="text-[#86868b] font-medium max-w-md">El equipo de GIMG Originals está preparando la próxima gran experiencia cinematográfica.</p>
           </div>
        )}
      </div>

      {/* --- 3. THE COLLECTION --- */}
      <div className="px-6 md:px-12 max-w-[1800px] mx-auto">
        <div className="flex items-center justify-between mb-10 border-b border-[#d2d2d7]/50 pb-4">
           <h3 className="text-2xl md:text-3xl font-serif italic text-[#1d1d1f] flex items-center gap-3">
             <Zap className="text-[#0066FF]" fill="currentColor" size={24}/> Catálogo Exclusivo
           </h3>
           <span className="text-[#86868b] text-[10px] font-bold uppercase tracking-widest hidden md:block">
             {originals.length} Títulos Disponibles
           </span>
        </div>

        {originals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {originals.map((movie, index) => (
              <div 
                key={movie.id}
                onClick={() => onSelectMovie && onSelectMovie(movie)}
                className="group relative aspect-[16/9] bg-[#f5f5f7] rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl border border-[#d2d2d7]/50 hover:-translate-y-2 transition-all duration-500"
              >
                <div className="absolute -left-4 -bottom-8 text-[140px] font-black text-black/5 z-0 group-hover:text-[#0066FF]/5 transition-colors italic leading-none select-none pointer-events-none">
                  {index + 1}
                </div>

                <img 
                  src={getCleanImg(movie.banner_url || movie.poster_url)} 
                  className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 z-10"
                  alt={movie.titulo}
                />
                
                <div className="absolute inset-0 bg-[#0a0a0a]/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col items-center justify-center gap-4 backdrop-blur-sm">
                   <PlayCircle size={48} strokeWidth={1.5} className="text-white scale-50 group-hover:scale-100 transition-transform duration-500 delay-75"/>
                   <div className="text-center px-6">
                      <p className="text-white font-bold text-lg tracking-tight drop-shadow-md">{movie.titulo}</p>
                      <p className="text-white/80 text-xs mt-1 font-medium tracking-wide">
                        {movie.año} {movie.generos && movie.generos.length > 0 ? `• ${movie.generos[0]}` : '• Original'}
                      </p>
                   </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-10 group-hover:opacity-0 transition-opacity duration-300">
                   <p className="text-white font-serif italic text-xl md:text-2xl drop-shadow-md">{movie.titulo}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center border border-dashed border-[#d2d2d7] rounded-[2rem] bg-[#f5f5f7]">
             <p className="text-[#86868b] font-medium">Más producciones originales llegarán pronto al catálogo.</p>
          </div>
        )}
      </div>

      <div className="mt-40 text-center opacity-40">
         <div className="w-12 h-1 bg-[#d2d2d7] mx-auto mb-6 rounded-full"></div>
         <p className="text-[10px] font-black tracking-[0.4em] text-[#86868b] uppercase">GIMG Originals</p>
      </div>

    </div>
  );
}