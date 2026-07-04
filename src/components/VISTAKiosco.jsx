import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Eye, BookOpen, RotateCcw } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function VISTAKiosco() {
  const [newspapers, setNewspapers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flippedId, setFlippedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKiosco();
  }, []);

  const fetchKiosco = async () => {
    try {
      const { data, error } = await supabase
        .from('contenido')
        .select('*')
        .eq('es_comunidad', true)
        .eq('estado_publicacion', 'aprobado')
        .order('vistas', { ascending: false });

      if (error) throw error;
      setNewspapers(data || []);
    } catch (err) {
      console.error("Error al cargar el Kiosco:", err);
    } finally {
      setLoading(false);
    }
  };

  const registrarVista = async (item) => {
    try {
      // Incrementa el contador de vistas nativamente en Supabase
      await supabase
        .from('contenido')
        .update({ vistas: (item.vistas || 0) + 1 })
        .eq('id', item.id);
      
      // Actualiza el estado local de manera fluida
      setNewspapers(prev => prev.map(n => n.id === item.id ? { ...n, vistas: (n.vistas || 0) + 1 } : n));
    } catch (err) {
      console.error("Error al registrar métrica de vista:", err);
    }
  };

  const handleCardClick = (index, item) => {
    if (index !== currentIndex) {
      setCurrentIndex(index);
      setFlippedId(null); // Resetea cualquier giro al cambiar de tarjeta
    } else {
      // Si ya está en el centro, activa o desactiva el Flip 3D
      if (flippedId === item.id) {
        setFlippedId(null);
      } else {
        setFlippedId(item.id);
        registrarVista(item);
      }
    }
  };

  const moveLeft = () => {
    setFlippedId(null);
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : newspapers.length - 1));
  };

  const moveRight = () => {
    setFlippedId(null);
    setCurrentIndex(prev => (prev < newspapers.length - 1 ? prev + 1 : 0));
  };

  if (loading) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <div className="font-serif italic text-xl text-[#1d1d1f] animate-pulse">Abriendo el Kiosco...</div>
      </div>
    );
  }

  if (newspapers.length === 0) {
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center text-center px-4">
        <p className="text-[#86868b] font-medium">El Kiosco está vacío en este momento.</p>
        <p className="text-xs text-[#86868b]/60 mt-1">Las publicaciones aprobadas de la comunidad aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center justify-center py-8 overflow-visible select-none">
      
      {/* CONTENEDOR ENTORNO 3D (Coverflow) */}
      <div className="relative w-full h-[480px] flex items-center justify-center [perspective:1200px] overflow-visible">
        
        {newspapers.map((item, index) => {
          const distance = index - currentIndex;
          const isActive = index === currentIndex;
          const isFlipped = flippedId === item.id;

          // Cálculo matemático de transformaciones espaciales estilo Apple
          let transformStyle = '';
          if (distance === 0) {
            transformStyle = 'translateZ(100px) rotateY(0deg)';
          } else if (distance < 0) {
            // Tarjetas a la izquierda (inclinadas hacia la derecha)
            transformStyle = `translateX(${distance * 110 - 60}px) translateZ(0px) rotateY(40deg)`;
          } else if (distance > 0) {
            // Tarjetas a la derecha (inclinadas hacia la izquierda)
            transformStyle = `translateX(${distance * 110 + 60}px) translateZ(0px) rotateY(-40deg)`;
          }

          return (
            <div
              key={item.id}
              onClick={() => handleCardClick(index, item)}
              style={{
                transform: transformStyle,
                zIndex: 100 - Math.abs(distance),
              }}
              className="absolute w-[280px] h-[390px] transition-all duration-500 ease-out cursor-pointer [transform-style:preserve-3d]"
            >
              {/* SUB-CONTENEDOR DEL GIRO INTERNO (FLIP EFFECT) */}
              <div className={`w-full h-full relative transition-transform duration-700 [transform-style:preserve-3d] ${isFlipped ? '[transform:rotateY(180deg)]' : ''}`}>
                
                {/* LADO A: PORTADA (FRONTAL) */}
                <div className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden bg-[#f5f5f7] shadow-[0_15px_35px_rgba(0,0,0,0.1)] border border-[#d2d2d7]/40 [backface-visibility:hidden]">
                  <img 
                    src={item.poster_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80"} 
                    alt={item.titulo}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  {/* Sutil reflejo sobre la portada */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10 pointer-events-none" />
                </div>

                {/* LADO B: DETALLES EDITORIALES (REVERSO) */}
                <div className="absolute inset-0 w-full h-full rounded-2xl bg-white/95 backdrop-blur-md p-6 flex flex-col justify-between shadow-[0_15px_35px_rgba(0,0,0,0.1)] border border-[#d2d2d7]/60 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                  
                  {/* Header Reverso */}
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-[9px] font-bold tracking-[0.15em] uppercase text-[#0066FF] bg-blue-50 px-2 py-0.5 rounded-full">
                        {item.sello_editorial || 'Editorial Terceros'}
                      </span>
                      <div className="flex items-center gap-1 text-[#86868b] text-xs font-semibold">
                        <Eye size={13} />
                        <span>{item.vistas || 0}</span>
                      </div>
                    </div>
                    
                    <h3 className="font-serif italic text-2xl text-[#1d1d1f] mb-2 leading-tight">
                      {item.titulo}
                    </h3>
                    <p className="text-xs text-[#86868b] font-medium mb-3">
                      Publicado en {item.anio || '2026'}
                    </p>
                    <div className="h-px w-full bg-[#d2d2d7]/40 mb-3" />
                    <p className="text-xs text-[#424245] leading-relaxed line-clamp-6 font-medium">
                      {item.descripcion || "Sin descripción disponible para esta edición comunitaria."}
                    </p>
                  </div>

                  {/* Footer Reverso / Acciones */}
                  <div className="space-y-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Evita que la tarjeta vuelva a girarse al hacer clic en el botón
                        if (item.banner_url) window.open(item.banner_url, '_blank');
                      }}
                      className="w-full bg-[#1d1d1f] hover:bg-black text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-black/5"
                    >
                      <BookOpen size={14} /> Leer Periódico
                    </button>
                    
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setFlippedId(null);
                      }}
                      className="w-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#86868b] hover:text-[#1d1d1f] py-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <RotateCcw size={12} /> Ver Portada
                    </button>
                  </div>

                </div>

              </div>
            </div>
          );
        })}

      </div>

      {/* CONTROLES DE NAVEGACIÓN MANUAL (Debajo del entorno 3D) */}
      <div className="flex items-center gap-8 mt-2">
        <button 
          onClick={moveLeft}
          className="p-3 bg-white border border-[#d2d2d7] hover:border-[#86868b] text-[#1d1d1f] rounded-full shadow-sm transition-all active:scale-90"
        >
          <ChevronLeft size={18} strokeWidth={2.5} />
        </button>
        
        <div className="flex flex-col items-center">
          <span className="font-serif italic text-lg text-[#1d1d1f]">
            {newspapers[currentIndex]?.titulo}
          </span>
          <span className="text-[10px] font-bold text-[#86868b] uppercase tracking-widest mt-0.5">
            {currentIndex + 1} de {newspapers.length} Ediciones
          </span>
        </div>

        <button 
          onClick={moveRight}
          className="p-3 bg-white border border-[#d2d2d7] hover:border-[#86868b] text-[#1d1d1f] rounded-full shadow-sm transition-all active:scale-90"
        >
          <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>

    </div>
  );
}