import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

export function useLikes(contenidoId) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [checking, setChecking] = useState(true);

  // Verifica el estatus inicial al cargar la tarjeta
  const checkLikeStatus = useCallback(async () => {
    if (!user || !contenidoId) {
      setChecking(false);
      return;
    }
    
    try {
      // 1. Consultar si el usuario actual ya le dio like a este contenido
      const { data, error } = await supabase
        .from('likes_contenido')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('contenido_id', contenidoId);

      if (error) throw error;
      setIsLiked(data.length > 0);

      // 2. Traer el conteo total actual de la columna optimizada
      const { data: itemData, error: itemError } = await supabase
        .from('contenido')
        .select('likes_count')
        .eq('id', contenidoId)
        .single();

      if (itemError) throw itemError;
      setLikesCount(itemData?.likes_count || 0);

    } catch (err) {
      console.error("Error al inicializar estatus de likes:", err);
    } finally {
      setChecking(false);
    }
  }, [user, contenidoId]);

  // Ejecuta la acción del botón (Toggle)
  const toggleLike = async () => {
    if (!user || !contenidoId) return { success: false, msg: 'No autenticado' };

    // Interfaz Optimista: Cambia el estado visual antes de la respuesta del servidor para evitar lag
    const prevIsLiked = isLiked;
    const prevCount = likesCount;
    
    setIsLiked(!prevIsLiked);
    setLikesCount(prevIsLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      // Llamada directa a la función RPC segura del servidor
      const { data, error } = await supabase.rpc('toggle_like', {
        p_usuario_id: user.id,
        p_contenido_id: contenidoId
      });

      if (error) throw error;

      // Sincronización final con los datos reales devueltos por el backend
      if (data) {
        setIsLiked(data.liked);
        setLikesCount(data.likes_count);
      }
      return { success: true };
    } catch (err) {
      console.error("Fallo al procesar interacción de like:", err);
      // Reversión automática si el servidor rechaza la transacción
      setIsLiked(prevIsLiked);
      setLikesCount(prevCount);
      return { success: false, error: err };
    }
  };

  return {
    isLiked,
    likesCount,
    checking,
    checkLikeStatus,
    toggleLike
  };
}