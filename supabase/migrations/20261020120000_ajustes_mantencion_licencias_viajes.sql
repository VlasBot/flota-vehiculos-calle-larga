-- =====================================================================
-- Ajustes solicitados:
--  1. Las mantenciones se programan solo por kilometraje.
--  2. Un conductor puede tener varias clases de licencia.
--  3. Un viaje programado se inicia desde 1 hora antes hasta 2 horas
--     después de la salida programada.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Mantenciones: el kilometraje programado es la única meta
-- ---------------------------------------------------------------------
alter table public.mantenciones drop constraint mantenciones_con_meta;
alter table public.mantenciones drop column fecha_programada;
alter table public.mantenciones alter column km_programado set not null;

-- ---------------------------------------------------------------------
-- 2. Licencias: de una clase (text) a varias (text[])
-- ---------------------------------------------------------------------
alter table public.profiles add column licencia_clases text[];

update public.profiles
  set licencia_clases = array[licencia_clase]
  where licencia_clase is not null;

alter table public.profiles drop column licencia_clase;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_clases text[];
begin
  if jsonb_typeof(new.raw_user_meta_data -> 'licencia_clases') = 'array' then
    v_clases := array(select jsonb_array_elements_text(new.raw_user_meta_data -> 'licencia_clases'));
  end if;

  insert into public.profiles (
    id, nombre_completo, email, rut, role, telefono, licencia_clases, licencia_vencimiento
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', new.email),
    new.email,
    nullif(new.raw_user_meta_data ->> 'rut', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::rol_usuario, 'conductor'),
    nullif(new.raw_user_meta_data ->> 'telefono', ''),
    nullif(v_clases, '{}'),
    nullif(new.raw_user_meta_data ->> 'licencia_vencimiento', '')::date
  );
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Ventana para iniciar un viaje programado
-- ---------------------------------------------------------------------
create or replace function public.iniciar_bitacora(
  p_vehiculo_id uuid,
  p_viaje_id uuid,
  p_destino text,
  p_km_inicio integer,
  p_combustible_inicio nivel_combustible,
  p_checklist jsonb,
  p_observaciones text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_vehiculo public.vehiculos%rowtype;
  v_viaje public.viajes%rowtype;
  v_bitacora_id uuid;
begin
  if v_usuario is null or public.current_user_role() <> 'conductor' then
    raise exception 'Solo un conductor activo puede iniciar un viaje.';
  end if;

  if exists (select 1 from public.bitacoras where conductor_id = v_usuario and estado = 'abierta') then
    raise exception 'Ya tienes un viaje en curso. Finalízalo antes de iniciar otro.';
  end if;

  select * into v_vehiculo from public.vehiculos where id = p_vehiculo_id for update;
  if not found then
    raise exception 'El vehículo seleccionado no existe.';
  end if;

  if v_vehiculo.estado <> 'disponible' then
    raise exception 'El vehículo % no está disponible en este momento.', v_vehiculo.patente;
  end if;

  if p_km_inicio < v_vehiculo.kilometraje_actual then
    raise exception 'El kilometraje inicial (% km) no puede ser menor al último registrado para el vehículo (% km).',
      p_km_inicio, v_vehiculo.kilometraje_actual;
  end if;

  if coalesce(trim(p_destino), '') = '' then
    raise exception 'Debes indicar el destino del viaje.';
  end if;

  if p_viaje_id is not null then
    select * into v_viaje from public.viajes where id = p_viaje_id for update;
    if not found or v_viaje.conductor_id <> v_usuario then
      raise exception 'El viaje programado no está asignado a ti.';
    end if;
    if v_viaje.estado <> 'programado' then
      raise exception 'El viaje programado ya no está disponible para iniciarse.';
    end if;
    if v_viaje.vehiculo_id <> p_vehiculo_id then
      raise exception 'El vehículo no coincide con el asignado al viaje programado.';
    end if;

    if now() < v_viaje.salida_programada - interval '1 hour' then
      raise exception 'Este viaje se puede iniciar desde las % (1 hora antes de la salida programada).',
        to_char((v_viaje.salida_programada - interval '1 hour') at time zone 'America/Santiago', 'HH24:MI');
    end if;
    if now() > v_viaje.salida_programada + interval '2 hours' then
      raise exception 'Venció el plazo para iniciar este viaje (hasta 2 horas después de la salida programada). Contacta al encargado de flota.';
    end if;

    update public.viajes set estado = 'en_curso' where id = p_viaje_id;
  end if;

  insert into public.bitacoras (
    conductor_id, vehiculo_id, viaje_id, destino, km_inicio,
    combustible_inicio, checklist_inicio, observaciones_inicio
  )
  values (
    v_usuario, p_vehiculo_id, p_viaje_id, trim(p_destino), p_km_inicio,
    p_combustible_inicio, coalesce(p_checklist, '{}'::jsonb), nullif(trim(p_observaciones), '')
  )
  returning id into v_bitacora_id;

  update public.vehiculos
    set estado = 'en_ruta', kilometraje_actual = p_km_inicio
    where id = p_vehiculo_id;

  return v_bitacora_id;
end;
$$;
