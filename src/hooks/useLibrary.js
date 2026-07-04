import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext'; // Asumo que tienes un contexto de autenticación

export function useLibrary(movie) {
  const { user } = useAuth();
  const [isInLibrary, setIsInLibrary] = useState(false);
  const [loading, setLoading] = useState(false);

  // Verificar si la película ya está en la biblioteca del usuario
  const checkLibraryStatus = useCallback(async () => {
    // Si no hay usuario o no hay película, no hacemos nada
    if (!user || !movie?.id) {
      setIsInLibrary(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('biblioteca')
        .select('id')
        .eq('usuario_id', user.id)
        .eq('contenido_id', movie.id)
        .maybeSingle(); // Usamos maybeSingle para que no arroje error si no encuentra nada

      if (error) throw error;
      
      // Si data tiene algo, significa que sí está guardada
      setIsInLibrary(!!data);
    } catch (error) {
      console.error('Error al verificar la biblioteca:', error);
      setIsInLibrary(false);
    }
  }, [user, movie]);

  // Se ejecuta automáticamente al cargar el componente o cambiar de película
  useEffect(() => {
    checkLibraryStatus();
  }, [checkLibraryStatus]);

  // Añadir o quitar de la biblioteca
  const toggleLibrary = async () => {
    if (!user) {
      alert("Debes iniciar sesión para guardar en tu biblioteca.");
      return;
    }

    if (!movie?.id) return;

    setLoading(true);
    // Acción optimista: cambiamos la UI antes de que el servidor responda
    const previousState = isInLibrary;
    setIsInLibrary(!previousState); 

    try {
      if (previousState) {
        // Si ya estaba, la borramos
        const { error } = await supabase
          .from('biblioteca')
          .delete()
          .eq('usuario_id', user.id)
          .eq('contenido_id', movie.id);

        if (error) throw error;
      } else {
        // Si no estaba, la insertamos
        const { error } = await supabase
          .from('biblioteca')
          .insert([
            { usuario_id: user.id, contenido_id: movie.id }
          ]);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error al modificar la biblioteca:', error);
      // Si falla, revertimos la UI a como estaba
      setIsInLibrary(previousState);
    } finally {
      setLoading(false);
    }
  };

  return { isInLibrary, toggleLibrary, loading };
}