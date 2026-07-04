import { useState, useEffect, useMemo } from 'react';
import { getAvailableLangs, getDefaultLang, resolveContent, langLabel } from '../utils/i18nContent';

// Uso: const { lang, setLang, availableLangs, titulo, descripcion, poster, paginas } = useContentLanguage(item);
//
// - Al montar (o cuando cambia la noticia), elige el idioma automáticamente:
//   navegador > idioma original de la publicación > primer idioma disponible.
// - `setLang(codigo)` permite al usuario cambiarlo manualmente en cualquier momento,
//   y desde ahí ya no se vuelve a autodetectar mientras siga viendo esa misma noticia.
export function useContentLanguage(item) {
  const availableLangs = useMemo(() => getAvailableLangs(item), [item]);
  const defaultLang = useMemo(() => getDefaultLang(item), [item]);

  const [lang, setLang] = useState(defaultLang);

  // Solo re-detectamos el idioma por defecto cuando cambia la noticia en sí
  // (item?.id), no en cada render, para no pisar una selección manual del usuario.
  useEffect(() => {
    setLang(defaultLang);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const content = useMemo(() => resolveContent(item, lang), [item, lang]);

  return {
    lang,
    setLang,
    availableLangs,
    langLabel,
    ...content,
  };
}