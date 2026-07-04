import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { uploadToCloudinary } from '../cloudinary';
import { 
  Save, 
  Edit3, 
  PlusCircle, 
  X, 
  Trash2, 
  Eye, 
  FileText, 
  Globe, 
  BookOpen,
  Image as ImageIcon,
  FileImage,
  Plus,
  Languages // <-- Añadido para la UI de traducciones
} from 'lucide-react';

export default function NoticiasTab() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [gimgNews, setGimgNews] = useState([]); 
  const [kioscoNews, setKioscoNews] = useState([]); 
  const [editingItem, setEditingItem] = useState(null);

  // Estados para archivos físicos (Idioma Base)
  const [portadaArchivo, setPortadaArchivo] = useState(null);
  const [paginasArchivos, setPaginasArchivos] = useState([]);

  // NUEVO: Estado para gestionar Múltiples Idiomas Simultáneos
  const [traducciones, setTraducciones] = useState([]);

  const initialFormState = {
    titulo: '',
    descripcion: '',
    portada_url: '', 
    enlace_pdf: '',  
    youtube_id: '',
    idioma_original: 'es' 
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchNewsData();
  }, []);

  const fetchNewsData = async () => {
    try {
      const { data, error } = await supabase
        .from('contenido')
        .select('*')
        .in('categoria', ['Noticia', 'Periódico'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data) {
        setGimgNews(data.filter(item => !item.es_comunidad));
        setKioscoNews(data.filter(item => item.es_comunidad && item.estado_publicacion === 'aprobado'));
      }
    } catch (err) {
      console.error("Error al recopilar el archivo de prensa:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ================= MANEJADORES DE TRADUCCIÓN =================
  const addTraduccion = () => {
    setTraducciones([...traducciones, { lang: 'en', titulo: '', descripcion: '', portadaArchivo: null, paginasArchivos: [], hasExistingPoster: false, existingPagesCount: 0 }]);
  };

  const removeTraduccion = (index) => {
    setTraducciones(traducciones.filter((_, i) => i !== index));
  };

  const updateTraduccion = (index, field, value) => {
    const newTrads = [...traducciones];
    newTrads[index][field] = value;
    setTraducciones(newTrads);
  };

  const handleTraduccionPagina = (index, file) => {
    if (!file) return;
    const newTrads = [...traducciones];
    newTrads[index].paginasArchivos.push(file);
    setTraducciones(newTrads);
  };
  // ==============================================================

  const handleEdit = (item) => {
    setEditingItem(item);
    const baseLang = item.idioma_original || 'es';

    setFormData({
      titulo: item.titulo || '',
      descripcion: item.descripcion || '',
      portada_url: item.poster_url || item.banner_url || '',
      enlace_pdf: item.enlace_pdf || '', 
      youtube_id: item.youtube_id || '',
      idioma_original: baseLang 
    });

    // Cargar traducciones existentes al panel dinámico
    const loadedTraducciones = [];
    if (item.titulo_i18n) {
      Object.keys(item.titulo_i18n).forEach(l => {
        if (l !== baseLang) {
          loadedTraducciones.push({
            lang: l,
            titulo: item.titulo_i18n[l] || '',
            descripcion: item.descripcion_i18n?.[l] || '',
            portadaArchivo: null,
            paginasArchivos: [],
            hasExistingPoster: !!item.poster_i18n?.[l],
            existingPagesCount: item.paginas_i18n?.[l]?.length || 0
          });
        }
      });
    }
    
    setTraducciones(loadedTraducciones);
    setPortadaArchivo(null);
    setPaginasArchivos([]);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStatus({ type: 'info', msg: `Modificando: ${item.titulo}` });
  };

  const handleAgregarPagina = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPaginasArchivos([...paginasArchivos, file]);
    }
  };

  const handleEliminarPagina = (index) => {
    const nuevasPaginas = [...paginasArchivos];
    nuevasPaginas.splice(index, 1);
    setPaginasArchivos(nuevasPaginas);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      let finalPortadaUrl = formData.portada_url;
      let finalPaginasJsonStr = formData.enlace_pdf; 

      const isComunidad = editingItem ? editingItem.es_comunidad : false;
      const selloStr = isComunidad ? (editingItem.sello_editorial || 'Comunidad') : 'GIMG_Oficial';
      const sanitizedSello = selloStr.replace(/[^a-zA-Z0-9]/g, '_');
      const folderPath = `Mothership_Prensa/${sanitizedSello}/${Date.now()}`;

      // 1. Subida del Idioma Base (Portada)
      if (portadaArchivo) {
        setStatus({ type: 'info', msg: 'Subiendo ilustración principal...' });
        const uploadedUrl = await uploadToCloudinary(portadaArchivo, folderPath);
        if (!uploadedUrl) throw new Error("Fallo crítico al subir la ilustración.");
        finalPortadaUrl = uploadedUrl;
      } else if (!editingItem && !finalPortadaUrl) {
        throw new Error("Debes incluir una ilustración para la noticia base.");
      }

      // 2. Subida del Idioma Base (Páginas)
      if (paginasArchivos.length > 0) {
        setStatus({ type: 'info', msg: 'Subiendo páginas del documento base...' });
        const urlsNuevasPaginas = [];
        for (const pagina of paginasArchivos) {
          const urlPagina = await uploadToCloudinary(pagina, folderPath);
          if (urlPagina) urlsNuevasPaginas.push(urlPagina);
        }
        finalPaginasJsonStr = JSON.stringify(urlsNuevasPaginas);
      }

      setStatus({ type: 'info', msg: 'Sincronizando traducciones y base de datos...' });

      // INGENIERÍA MULTI-IDIOMA EN BLOQUE
      const langBase = formData.idioma_original;
      let paginasArray = [];
      try { if(finalPaginasJsonStr) paginasArray = JSON.parse(finalPaginasJsonStr); } catch(e){}

      // Preparamos los diccionarios clonando los existentes (por si se borra uno sin querer)
      const titulos = { ...(editingItem?.titulo_i18n || {}) };
      const descripciones = { ...(editingItem?.descripcion_i18n || {}) };
      const posters = { ...(editingItem?.poster_i18n || {}) };
      const paginasObj = { ...(editingItem?.paginas_i18n || {}) };

      // Inyectar Idioma Base
      titulos[langBase] = formData.titulo;
      descripciones[langBase] = formData.descripcion;
      posters[langBase] = finalPortadaUrl;
      if (paginasArray.length > 0) paginasObj[langBase] = paginasArray;

      // Inyectar Traducciones Secundarias Dinámicas
      for (const trad of traducciones) {
        if (!trad.titulo) continue; // Si dejaron el título vacío, ignoramos este idioma

        titulos[trad.lang] = trad.titulo;
        descripciones[trad.lang] = trad.descripcion;
        
        let tPortada = posters[trad.lang]; // Mantenemos la que estaba si no suben nueva
        if (trad.portadaArchivo) {
          tPortada = await uploadToCloudinary(trad.portadaArchivo, folderPath);
        }
        if (tPortada) posters[trad.lang] = tPortada;

        let tPaginas = paginasObj[trad.lang] || [];
        if (trad.paginasArchivos.length > 0) {
          tPaginas = []; // Si suben nuevas, sobrescribimos
          for (const p of trad.paginasArchivos) {
            const u = await uploadToCloudinary(p, folderPath);
            if (u) tPaginas.push(u);
          }
        }
        if (tPaginas.length > 0) paginasObj[trad.lang] = tPaginas;
      }

      // Empaquetar para Supabase
      const payload = {
        titulo: formData.titulo, 
        descripcion: formData.descripcion, 
        poster_url: finalPortadaUrl,
        banner_url: finalPortadaUrl,
        enlace_pdf: finalPaginasJsonStr || null, 
        youtube_id: formData.youtube_id || null,
        es_comunidad: isComunidad,
        categoria: editingItem ? editingItem.categoria : 'Noticia',
        estado_publicacion: 'aprobado',
        anio: editingItem ? editingItem.anio : new Date().getFullYear().toString(),
        
        idioma_original: langBase,
        titulo_i18n: titulos,
        descripcion_i18n: descripciones,
        poster_i18n: posters,
        paginas_i18n: Object.keys(paginasObj).length > 0 ? paginasObj : null
      };

      if (editingItem) {
        const { error } = await supabase.from('contenido').update(payload).eq('id', editingItem.id);
        if (error) throw error;
        setStatus({ type: 'success', msg: 'Registro multi-idioma actualizado en el ecosistema' });
      } else {
        const { error } = await supabase.from('contenido').insert([payload]);
        if (error) throw error;
        setStatus({ type: 'success', msg: '¡Comunicado global GIMG publicado con éxito!' });
      }

      resetForm();
      fetchNewsData();
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: err.message || 'Error al procesar la publicación.' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Deseas eliminar definitivamente esta publicación del servidor de la Alianza?")) return;
    try {
      const { error } = await supabase.from('contenido').delete().eq('id', id);
      if (error) throw error;
      fetchNewsData();
      if (editingItem?.id === id) resetForm();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el registro.");
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData(initialFormState);
    setPortadaArchivo(null);
    setPaginasArchivos([]);
    setTraducciones([]); // Limpiar traducciones
    setStatus(null);
  };

  const hasExistingPages = () => {
    if (!formData.enlace_pdf) return false;
    try {
      const parsed = JSON.parse(formData.enlace_pdf);
      return Array.isArray(parsed) && parsed.length > 0;
    } catch {
      return formData.enlace_pdf.length > 0;
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-12 text-white">
      
      {/* FORMULARIO EDITORIAL INTELLIGENT (DARK MODE) */}
      <div className="xl:col-span-1">
        <div className="bg-[#121212] border border-white/10 p-8 rounded-[2.5rem] sticky top-8 shadow-2xl">
          
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              {editingItem ? <><Edit3 className="text-yellow-500"/> Editar Prensa</> : <><PlusCircle className="text-blue-500"/> Nuevo Reporte</>}
            </h2>
            {editingItem && (
              <button onClick={resetForm} className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full flex items-center gap-1 transition-colors">
                <X size={12}/> Cancelar
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Bloque A: Texto Principal */}
            <div className="space-y-4 p-5 bg-black/40 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest flex items-center gap-1.5">
                <FileText size={12}/> Datos del Idioma Base
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1 flex items-center gap-1">
                    <Globe size={10}/> Idioma Base
                  </label>
                  <select 
                    name="idioma_original"
                    value={formData.idioma_original} 
                    onChange={handleChange}
                    className="w-full bg-transparent border-b border-white/10 p-2 font-bold outline-none focus:border-blue-500 text-sm transition-colors cursor-pointer appearance-none text-white"
                  >
                    <option value="es" className="bg-neutral-900">Español (ES)</option>
                    <option value="en" className="bg-neutral-900">Inglés (EN)</option>
                    <option value="nah" className="bg-neutral-900">Náhuatl (NAH)</option>
                    <option value="pt" className="bg-neutral-900">Portugués (PT)</option>
                    <option value="fr" className="bg-neutral-900">Francés (FR)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Titular Principal</label>
                  <input 
                    type="text" name="titulo" required placeholder="Ej. Comunicado..."
                    value={formData.titulo} onChange={handleChange}
                    className="w-full bg-transparent border-b border-white/10 p-2 font-bold outline-none focus:border-blue-500 text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Cuerpo del Reporte</label>
                <textarea 
                  name="descripcion" required rows="4" placeholder="Escribe el desglose completo..."
                  value={formData.descripcion} onChange={handleChange}
                  className="w-full bg-transparent border-b border-white/10 p-2 text-xs resize-none outline-none focus:border-blue-500 leading-relaxed custom-scrollbar transition-colors"
                />
              </div>
            </div>

            {/* Bloque B: Sistema de Archivos Dinámico */}
            <div className="space-y-4 p-5 bg-black/40 rounded-2xl border border-white/5">
              <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest flex items-center gap-1.5 mb-4">
                <Globe size={12}/> Servidor de Medios (Base)
              </p>

              <div className="relative flex items-center justify-center w-full mb-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border border-white/10 border-dashed rounded-xl cursor-pointer bg-black/20 hover:bg-white/5 transition-all p-4 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <ImageIcon size={24} className={portadaArchivo || formData.portada_url ? 'text-blue-500 mb-2' : 'text-neutral-600 mb-2'} />
                    <p className="text-xs text-white font-bold truncate max-w-[200px]">
                      {portadaArchivo ? portadaArchivo.name : (formData.portada_url ? 'Sustituir Portada Actual' : 'Seleccionar Portada')}
                    </p>
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => setPortadaArchivo(e.target.files[0])} className="hidden" />
                </label>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] text-neutral-400 font-bold uppercase">Páginas del Documento Base</p>
                
                {hasExistingPages() && paginasArchivos.length === 0 && (
                  <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl text-xs text-blue-300 font-medium mb-3">
                    Este registro ya contiene páginas o un archivo guardado. Subir nuevas aquí <b>sobrescribirá</b> el contenido anterior del idioma seleccionado.
                  </div>
                )}

                {paginasArchivos.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border border-white/10 rounded-xl bg-black/30 animate-in slide-in-from-left-4">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-white/5 text-neutral-400 rounded-md flex items-center justify-center"><FileImage size={12}/></div>
                      <div>
                        <p className="text-[10px] font-bold text-white">Página {index + 1}</p>
                        <p className="text-[9px] text-neutral-500 truncate max-w-[120px]">{file.name}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => handleEliminarPagina(index)} className="text-red-400 hover:text-red-300 p-1"><Trash2 size={14}/></button>
                  </div>
                ))}

                <label className="flex items-center justify-center gap-2 w-full py-3 border border-dashed border-white/20 rounded-xl text-xs font-bold text-blue-400 cursor-pointer hover:bg-blue-900/20 transition-colors">
                  <Plus size={14} /> Añadir Página Base
                  <input type="file" accept="image/*" onChange={handleAgregarPagina} className="hidden"/>
                </label>
              </div>
            </div>

            {/* =========================================================
                NUEVO BLOQUE: TRADUCCIONES DINÁMICAS (EN LÍNEA)
            ========================================================= */}
            <div className="pt-6 mt-6 border-t border-white/10 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Languages size={16} className="text-green-400"/> Multi-Idioma
                  </h3>
                  <p className="text-[10px] text-neutral-500 mt-1">Sube contenido traducido de golpe.</p>
                </div>
                <button 
                  type="button" 
                  onClick={addTraduccion}
                  className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <Plus size={14}/> Idioma Secundario
                </button>
              </div>

              {traducciones.map((trad, idx) => (
                <div key={idx} className="p-5 bg-black/40 rounded-2xl border border-white/5 space-y-4 relative animate-in zoom-in-95">
                  <button 
                    type="button" 
                    onClick={() => removeTraduccion(idx)}
                    className="absolute top-4 right-4 text-red-500/50 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={16}/>
                  </button>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Idioma de Destino</label>
                      <select 
                        value={trad.lang} 
                        onChange={(e) => updateTraduccion(idx, 'lang', e.target.value)}
                        className="w-full bg-transparent border-b border-white/10 p-2 font-bold outline-none focus:border-green-500 text-sm transition-colors text-white cursor-pointer appearance-none"
                      >
                        <option value="en" className="bg-neutral-900">Inglés (EN)</option>
                        <option value="nah" className="bg-neutral-900">Náhuatl (NAH)</option>
                        <option value="pt" className="bg-neutral-900">Portugués (PT)</option>
                        <option value="fr" className="bg-neutral-900">Francés (FR)</option>
                        <option value="es" className="bg-neutral-900">Español (ES)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Titular Traducido</label>
                      <input 
                        type="text" required placeholder="Traducción..."
                        value={trad.titulo} onChange={(e) => updateTraduccion(idx, 'titulo', e.target.value)}
                        className="w-full bg-transparent border-b border-white/10 p-2 font-bold outline-none focus:border-green-500 text-sm transition-colors"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">Cuerpo Traducido</label>
                    <textarea 
                      required rows="2" placeholder="Desglose en este idioma..."
                      value={trad.descripcion} onChange={(e) => updateTraduccion(idx, 'descripcion', e.target.value)}
                      className="w-full bg-transparent border-b border-white/10 p-2 text-xs resize-none outline-none focus:border-green-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-2">Portada Exclusiva</label>
                      <label className="flex items-center justify-center w-full py-2 border border-white/10 border-dashed rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                        <span className="text-[10px] truncate px-2">{trad.portadaArchivo ? trad.portadaArchivo.name : (trad.hasExistingPoster ? 'Actualizar Portada' : 'Subir Portada')}</span>
                        <input type="file" accept="image/*" onChange={(e) => updateTraduccion(idx, 'portadaArchivo', e.target.files[0])} className="hidden" />
                      </label>
                    </div>
                    <div>
                      <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-2">Páginas ({trad.paginasArchivos.length})</label>
                      <label className="flex items-center justify-center w-full py-2 border border-white/10 border-dashed rounded-lg cursor-pointer hover:bg-white/5 transition-colors">
                        <span className="text-[10px] truncate px-2">{trad.existingPagesCount > 0 && trad.paginasArchivos.length === 0 ? 'Sobrescribir Páginas' : '+ Agregar Página'}</span>
                        <input type="file" accept="image/*" onChange={(e) => handleTraduccionPagina(idx, e.target.files[0])} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 mt-4 border-t border-white/10">
              <label className="block text-[10px] text-neutral-400 font-bold uppercase mb-1">ID Video YouTube (Opcional)</label>
              <input 
                type="text" name="youtube_id" placeholder="Ej. dQw4w9WgXcQ"
                value={formData.youtube_id} onChange={handleChange}
                className="w-full bg-transparent border-b border-white/10 p-2 font-mono text-xs outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {status && (
              <div className={`p-3 rounded-xl text-xs text-center font-bold border ${
                status.type === 'error' ? 'text-red-300 bg-red-900/20 border-red-500/30' : 
                status.type === 'info' ? 'text-blue-300 bg-blue-900/20 border-blue-500/30 animate-pulse' :
                'text-green-300 bg-green-900/20 border-green-500/30'
              }`}>
                {status.msg}
              </div>
            )}

            <button 
              type="submit" disabled={loading}
              className={`w-full py-4 font-black uppercase tracking-widest text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              } ${
                editingItem ? 'bg-yellow-500 text-black hover:bg-yellow-400' : 'bg-[#0066FF] text-white hover:bg-blue-600'
              }`}
            >
              <Save size={18}/> {editingItem ? 'Actualizar Registro Global' : 'Publicar Multi-Idioma'}
            </button>

          </form>
        </div>
      </div>

      {/* HISTORIAL Y ARCHIVO DE FLUX */}
      <div className="xl:col-span-2 space-y-12">
        
        {/* LISTA 1: NUESTRAS NOTICIAS (GIMG) */}
        <div>
          <h3 className="text-xl font-bold mb-6 text-neutral-400 font-serif italic flex items-center gap-2">
            <Globe size={18} className="text-blue-500"/> Reportes y Campañas Oficiales GIMG
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gimgNews.map(item => (
              <div key={item.id} className="flex gap-4 bg-[#121212] border border-white/10 p-4 rounded-2xl hover:border-white/30 transition-all shadow-lg group">
                <div className="w-20 h-24 bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={item.poster_url} className="w-full h-full object-cover" alt="Cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white line-clamp-1">{item.titulo}</h4>
                    <p className="text-neutral-500 text-[11px] line-clamp-2 mt-1 font-medium">{item.descripcion}</p>
                    <div className="flex gap-2 mt-2">
                      <span className="text-[8px] bg-white/10 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{item.idioma_original || 'ES'}</span>
                      {item.titulo_i18n && Object.keys(item.titulo_i18n).length > 1 && (
                        <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">+{Object.keys(item.titulo_i18n).length - 1} Lang</span>
                      )}
                      {item.enlace_pdf && <span className="text-[8px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Doc Guardado</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleEdit(item)} className="bg-white/10 border border-white/10 hover:bg-white text-white hover:text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-1 justify-center"><Edit3 size={12}/> Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="bg-red-500/10 border border-red-500/20 hover:bg-red-600 text-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"><Trash2 size={12}/></button>
                  </div>
                </div>
              </div>
            ))}
            {gimgNews.length === 0 && <p className="text-neutral-600 text-sm italic">No hay notas emitidas por GIMG en este momento.</p>}
          </div>
        </div>

        {/* LISTA 2: PUBLICACIONES DEL KIOSCO (COMUNIDAD) */}
        <div>
          <h3 className="text-xl font-bold mb-6 text-neutral-400 font-serif italic flex items-center gap-2">
            <BookOpen size={18} className="text-green-500"/> Ediciones Autorizadas en el Kiosco
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kioscoNews.map(item => (
              <div key={item.id} className="flex gap-4 bg-[#121212] border border-white/10 p-4 rounded-2xl hover:border-white/30 transition-all shadow-lg group">
                <div className="w-20 h-24 bg-neutral-800 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={item.poster_url} className="w-full h-full object-cover" alt="Cover" />
                </div>
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-white line-clamp-1 flex-1">{item.titulo}</h4>
                      <span className="text-[8px] font-bold tracking-widest uppercase bg-green-500/10 text-green-400 px-2 py-0.5 rounded-full truncate max-w-[90px] ml-2 border border-green-500/20">
                        {item.sello_editorial || 'Sello Ext.'}
                      </span>
                    </div>
                    <p className="text-neutral-500 text-[11px] line-clamp-2 mt-1 font-medium">{item.descripcion}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[8px] bg-white/10 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">{item.idioma_original || 'ES'}</span>
                      {item.titulo_i18n && Object.keys(item.titulo_i18n).length > 1 && (
                        <span className="text-[8px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">+{Object.keys(item.titulo_i18n).length - 1} Lang</span>
                      )}
                      <span className="flex items-center gap-1 text-[9px] text-neutral-400 font-mono">
                        <Eye size={10}/> {item.vistas || 0}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleEdit(item)} className="bg-white/10 border border-white/10 hover:bg-white text-white hover:text-black px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 flex-1 justify-center"><Edit3 size={12}/> Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="bg-red-500/10 border border-red-500/20 hover:bg-red-600 text-red-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all"><Trash2 size={12}/></button>
                  </div>
                </div>
              </div>
            ))}
            {kioscoNews.length === 0 && <p className="text-neutral-600 text-sm italic">El Kiosco está despejado de material externo en este momento.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}