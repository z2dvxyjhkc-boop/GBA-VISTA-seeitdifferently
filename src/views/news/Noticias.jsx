import React, { useEffect, useMemo, useCallback } from 'react';
import { useNews } from '../../hooks/useNews';
import NewsCoverflow from '../../components/news/NewsCoverflow';
import NewsCard from '../../components/news/NewsCard';
import { Radio, Newspaper, Activity, Crown } from 'lucide-react';

// Clave de localStorage donde guardamos qué noticias ya registró este navegador/usuario
const VISTAS_KEY = 'vista_gimg_registradas';

function obtenerVistasRegistradas() {
  try {
    const raw = localStorage.getItem(VISTAS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function guardarVistasRegistradas(set) {
  try {
    localStorage.setItem(VISTAS_KEY, JSON.stringify([...set]));
  } catch {
    // Si localStorage no está disponible (modo privado, cuotas, etc.) simplemente no persistimos;
    // la vista se seguirá contando en el servidor cada vez, pero no rompemos la app.
  }
}

export default function Noticias({ setActiveTab, setSelloSeleccionado }) {
  const { loading, allNews, fetchGlobalNews, registrarVisita } = useNews();

  useEffect(() => {
    fetchGlobalNews();
  }, [fetchGlobalNews]);

  const gimgNews = useMemo(
    () => allNews.filter(item => !item.es_comunidad),
    [allNews]
  );

  const communityNews = useMemo(
    () =>
      allNews
        .filter(item => item.es_comunidad)
        .map(item => ({
          ...item,
          sello_editorial: item.sello_editorial || 'Editorial Independiente'
        })),
    [allNews]
  );

  const handleNavigateProfile = useCallback(
    (selloNombre) => {
      if (setSelloSeleccionado && setActiveTab) {
        setSelloSeleccionado(selloNombre);
        setActiveTab('perfil_editorial');
      }
    },
    [setSelloSeleccionado, setActiveTab]
  );

  // Registra la visita SOLO la primera vez por usuario/navegador, sin importar
  // cuántas veces vuelva a abrir/voltear la misma tarjeta después.
  const handleRegisterView = useCallback(
    async (item) => {
      const vistos = obtenerVistasRegistradas();
      if (vistos.has(item.id)) return; // ya se contó antes, no volvemos a llamar al backend

      vistos.add(item.id);
      guardarVistasRegistradas(vistos);

      await registrarVisita(item.id);
    },
    [registrarVisita]
  );

  if (loading && allNews.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[#fbfbfd] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#86868b]">
          <Activity className="animate-spin" size={28} />
          <p className="text-[10px] font-bold uppercase tracking-widest">Sincronizando Servidores de Prensa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fbfbfd] pb-32 font-sans selection:bg-[#1d1d1f] selection:text-white relative">

      {/* CABECERA GLOBAL */}
      <div className="pt-16 md:pt-24 px-6 md:px-12 max-w-[1800px] mx-auto mb-6">
        <div className="flex items-center gap-2 text-[#0066FF] mb-3 animate-in fade-in duration-700">
          <Radio size={18} />
          <span className="text-[10px] font-bold tracking-widest uppercase">VISTA Media Network</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-serif italic tracking-tighter text-[#1d1d1f] leading-none animate-in slide-in-from-bottom-6 duration-700 delay-75 fill-mode-forwards">
          News & Chronicle.
        </h1>
      </div>

      {/* NIVEL 1: ESCAPARATE OFICIAL */}
      {gimgNews.length > 0 && (
        <div className="mb-24 animate-in fade-in duration-1000 delay-200 fill-mode-forwards">
          <div className="px-6 md:px-12 max-w-[1800px] mx-auto mb-6 flex items-center gap-2">
            <Crown size={18} className="text-yellow-500" />
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#1d1d1f]">Comunicados y Campañas GIMG</h2>
          </div>

          <NewsCoverflow
            news={gimgNews}
            onRead={handleRegisterView}
            onNavigateProfile={handleNavigateProfile}
          />
        </div>
      )}

      {/* NIVEL 2: KIOSCO INDEPENDIENTE */}
      <div className="px-6 md:px-12 max-w-[1800px] mx-auto mt-16 pt-16 border-t border-[#d2d2d7]/50">
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-12">
          <div className="flex items-center gap-3">
            <Newspaper size={26} className="text-[#1d1d1f]" />
            <h3 className="text-2xl md:text-4xl font-serif italic font-bold text-[#1d1d1f]">Kiosco de la Alianza</h3>
          </div>
          <span className="text-xs text-[#86868b] font-mono md:ml-auto bg-[#f5f5f7] px-4 py-1.5 rounded-full w-fit font-bold">
            {communityNews.length} Ediciones Indexadas
          </span>
        </div>

        {communityNews.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 items-start animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-forwards">
            {communityNews.map((item) => (
              <NewsCard
                key={item.id}
                item={item}
                onRead={handleRegisterView}
                onNavigateProfile={handleNavigateProfile}
              />
            ))}
          </div>
        ) : (
          <div className="py-32 text-center border-2 border-dashed border-[#d2d2d7] rounded-[2.5rem] bg-white shadow-sm">
            <Newspaper size={48} className="text-[#d2d2d7] mx-auto mb-4" />
            <p className="text-[#86868b] font-medium text-lg">El Kiosco independiente está despejado de momento.</p>
          </div>
        )}
      </div>

    </div>
  );
}
