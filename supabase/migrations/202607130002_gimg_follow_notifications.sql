create or replace function public.notificar_publicacion_aprobada()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado_publicacion = 'aprobado'
     and (tg_op = 'INSERT' or old.estado_publicacion is distinct from 'aprobado') then
    if new.autor_id is not null then
      insert into public.notificaciones (
        usuario_id, tipo, titulo, mensaje, contenido_id, sello_editorial
      ) values (
        new.autor_id,
        'publicacion_aprobada',
        'Tu edicion fue aprobada',
        '"' || new.titulo || '" ya esta disponible en VISTA.',
        new.id,
        new.sello_editorial
      );
    end if;

    insert into public.notificaciones (
      usuario_id, tipo, titulo, mensaje, contenido_id, sello_editorial
    )
    select
      es.usuario_id,
      case when new.es_comunidad = false then 'nuevo_gimg' else 'nueva_edicion' end,
      case
        when new.es_comunidad = false then 'Nueva publicacion oficial de GIMG'
        else 'Nueva edicion de ' || new.sello_editorial
      end,
      new.titulo,
      new.id,
      case when new.es_comunidad = false then 'GIMG' else new.sello_editorial end
    from public.editoriales_seguidas es
    where es.notificar = true
      and es.usuario_id is distinct from new.autor_id
      and (
        (new.sello_editorial is not null and lower(es.sello_editorial) = lower(new.sello_editorial))
        or (new.es_comunidad = false and lower(es.sello_editorial) = 'gimg')
      )
    group by es.usuario_id;
  end if;

  return new;
end;
$$;
