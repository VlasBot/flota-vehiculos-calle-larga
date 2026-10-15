-- =====================================================================
-- Gestión de Flota Vehicular — Municipalidad de Calle Larga
-- Esquema inicial: perfiles, vehículos, viajes, turnos, bitácoras,
-- cargas de combustible y mantenciones. RLS activo en todas las tablas.
-- =====================================================================

-- Necesaria para las restricciones de exclusión (validación de solapamiento)
create extension if not exists btree_gist;

-- ---------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------
create type public.rol_usuario as enum ('admin', 'usuario', 'conductor');

create type public.tipo_vehiculo as enum (
  'auto', 'camioneta', 'furgon', 'minibus', 'micro', 'bus', 'camion', 'moto', 'maquinaria', 'otro'
);

create type public.estado_vehiculo as enum ('disponible', 'en_ruta', 'en_mantencion', 'fuera_servicio');

create type public.tipo_combustible as enum ('gasolina', 'diesel', 'electrico', 'hibrido');

create type public.estado_viaje as enum ('programado', 'en_curso', 'finalizado', 'cancelado');

create type public.estado_bitacora as enum ('abierta', 'cerrada');

create type public.nivel_combustible as enum ('reserva', 'un_cuarto', 'medio', 'tres_cuartos', 'lleno');

create type public.tipo_mantencion as enum (
  'preventiva', 'correctiva', 'revision_tecnica', 'neumaticos', 'otra'
);

create type public.estado_mantencion as enum ('programada', 'en_proceso', 'realizada', 'cancelada');

-- ---------------------------------------------------------------------
-- Utilidad: mantener actualizado_en
-- ---------------------------------------------------------------------
create function public.set_actualizado_en()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.actualizado_en := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- Perfiles (usuarios del sistema y conductores)
-- Los datos de licencia solo aplican a conductores.
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre_completo text not null,
  email text,
  rut text unique,
  role rol_usuario not null default 'conductor',
  telefono text,
  licencia_clase text,
  licencia_vencimiento date,
  activo boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create trigger profiles_actualizado_en
  before update on public.profiles
  for each row execute function public.set_actualizado_en();

-- El perfil se crea solo al dar de alta el usuario en Supabase Auth
-- (desde la Edge Function crear-usuario, nunca con registro público).
-- El rol por defecto es el de menor privilegio.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, nombre_completo, email, rut, role, telefono, licencia_clase, licencia_vencimiento
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre_completo', new.email),
    new.email,
    nullif(new.raw_user_meta_data ->> 'rut', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::rol_usuario, 'conductor'),
    nullif(new.raw_user_meta_data ->> 'telefono', ''),
    nullif(new.raw_user_meta_data ->> 'licencia_clase', ''),
    nullif(new.raw_user_meta_data ->> 'licencia_vencimiento', '')::date
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un usuario desactivado no tiene rol: todas las políticas lo dejan fuera.
create function public.current_user_role()
returns rol_usuario
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = (select auth.uid()) and activo;
$$;

grant execute on function public.current_user_role() to authenticated;

-- Secretaría / encargado de flota y administradores
create function public.es_gestion()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select public.current_user_role()) in ('admin'::rol_usuario, 'usuario'::rol_usuario),
    false
  );
$$;

grant execute on function public.es_gestion() to authenticated;

alter table public.profiles enable row level security;

create policy profiles_select on public.profiles
  for select using (
    id = (select auth.uid())
    or (select public.es_gestion())
  );

-- El admin edita a cualquiera. El perfil "usuario" edita usuarios y
-- conductores, pero nunca puede crear ni tocar administradores.
create policy profiles_update_admin on public.profiles
  for update
  using ((select public.current_user_role()) = 'admin'::rol_usuario)
  with check ((select public.current_user_role()) = 'admin'::rol_usuario);

create policy profiles_update_usuario on public.profiles
  for update
  using (
    (select public.current_user_role()) = 'usuario'::rol_usuario
    and role in ('usuario'::rol_usuario, 'conductor'::rol_usuario)
  )
  with check (
    (select public.current_user_role()) = 'usuario'::rol_usuario
    and role in ('usuario'::rol_usuario, 'conductor'::rol_usuario)
  );

-- ---------------------------------------------------------------------
-- Vehículos
-- ---------------------------------------------------------------------
create table public.vehiculos (
  id uuid primary key default gen_random_uuid(),
  patente text not null unique,
  numero_interno text,
  tipo tipo_vehiculo not null,
  marca text not null,
  modelo text not null,
  anio integer check (anio between 1950 and 2100),
  color text,
  tipo_combustible tipo_combustible not null default 'diesel',
  capacidad_pasajeros integer check (capacidad_pasajeros >= 0),
  unidad_asignada text,
  kilometraje_actual integer not null default 0 check (kilometraje_actual >= 0),
  estado estado_vehiculo not null default 'disponible',
  vencimiento_revision_tecnica date,
  vencimiento_permiso_circulacion date,
  vencimiento_soap date,
  observaciones text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create trigger vehiculos_actualizado_en
  before update on public.vehiculos
  for each row execute function public.set_actualizado_en();

alter table public.vehiculos enable row level security;

-- Los conductores necesitan ver la flota para elegir vehículo al iniciar un viaje.
create policy vehiculos_select on public.vehiculos
  for select using ((select public.current_user_role()) is not null);

create policy vehiculos_insert on public.vehiculos
  for insert with check ((select public.es_gestion()));

create policy vehiculos_update on public.vehiculos
  for update using ((select public.es_gestion())) with check ((select public.es_gestion()));

create policy vehiculos_delete_admin on public.vehiculos
  for delete using ((select public.current_user_role()) = 'admin'::rol_usuario);

-- ---------------------------------------------------------------------
-- Viajes (planificación)
-- ---------------------------------------------------------------------
create table public.viajes (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos (id) on delete restrict,
  conductor_id uuid not null references public.profiles (id) on delete restrict,
  salida_programada timestamptz not null,
  regreso_programado timestamptz not null,
  origen text not null default 'Municipalidad de Calle Larga',
  destino text not null,
  motivo text not null,
  unidad_solicitante text,
  cantidad_pasajeros integer check (cantidad_pasajeros >= 0),
  estado estado_viaje not null default 'programado',
  observaciones text,
  creado_por uuid references public.profiles (id) default auth.uid(),
  creado_en timestamptz not null default now(),
  constraint viajes_rango_valido check (regreso_programado > salida_programada),
  -- Validación de solapamiento: un vehículo o un conductor no pueden tener
  -- dos viajes activos que se crucen en el tiempo.
  constraint viajes_vehiculo_sin_solapamiento exclude using gist (
    vehiculo_id with =,
    tstzrange(salida_programada, regreso_programado) with &&
  ) where (estado in ('programado', 'en_curso')),
  constraint viajes_conductor_sin_solapamiento exclude using gist (
    conductor_id with =,
    tstzrange(salida_programada, regreso_programado) with &&
  ) where (estado in ('programado', 'en_curso'))
);

create index viajes_salida_idx on public.viajes (salida_programada);

alter table public.viajes enable row level security;

create policy viajes_select on public.viajes
  for select using (
    conductor_id = (select auth.uid())
    or (select public.es_gestion())
  );

create policy viajes_insert on public.viajes
  for insert with check ((select public.es_gestion()));

create policy viajes_update on public.viajes
  for update using ((select public.es_gestion())) with check ((select public.es_gestion()));

create policy viajes_delete_admin on public.viajes
  for delete using ((select public.current_user_role()) = 'admin'::rol_usuario);

-- ---------------------------------------------------------------------
-- Turnos de conductores
-- ---------------------------------------------------------------------
create table public.turnos (
  id uuid primary key default gen_random_uuid(),
  conductor_id uuid not null references public.profiles (id) on delete restrict,
  vehiculo_id uuid references public.vehiculos (id) on delete set null,
  inicio timestamptz not null,
  fin timestamptz not null,
  observaciones text,
  creado_por uuid references public.profiles (id) default auth.uid(),
  creado_en timestamptz not null default now(),
  constraint turnos_rango_valido check (fin > inicio),
  constraint turnos_conductor_sin_solapamiento exclude using gist (
    conductor_id with =,
    tstzrange(inicio, fin) with &&
  )
);

create index turnos_inicio_idx on public.turnos (inicio);

alter table public.turnos enable row level security;

create policy turnos_select on public.turnos
  for select using (
    conductor_id = (select auth.uid())
    or (select public.es_gestion())
  );

create policy turnos_insert on public.turnos
  for insert with check ((select public.es_gestion()));

create policy turnos_update on public.turnos
  for update using ((select public.es_gestion())) with check ((select public.es_gestion()));

create policy turnos_delete on public.turnos
  for delete using ((select public.es_gestion()));

-- ---------------------------------------------------------------------
-- Bitácoras (registro del conductor al iniciar y terminar un viaje)
-- ---------------------------------------------------------------------
create table public.bitacoras (
  id uuid primary key default gen_random_uuid(),
  conductor_id uuid not null references public.profiles (id) on delete restrict,
  vehiculo_id uuid not null references public.vehiculos (id) on delete restrict,
  viaje_id uuid references public.viajes (id) on delete set null,
  estado estado_bitacora not null default 'abierta',
  destino text not null,
  inicio_en timestamptz not null default now(),
  km_inicio integer not null check (km_inicio >= 0),
  combustible_inicio nivel_combustible not null,
  checklist_inicio jsonb not null default '{}'::jsonb,
  observaciones_inicio text,
  fin_en timestamptz,
  km_fin integer,
  combustible_fin nivel_combustible,
  observaciones_fin text,
  novedades text,
  constraint bitacoras_km_valido check (km_fin is null or km_fin >= km_inicio),
  constraint bitacoras_cierre_completo check (
    estado = 'abierta' or (fin_en is not null and km_fin is not null and combustible_fin is not null)
  )
);

-- Un conductor no puede tener dos viajes abiertos, ni un vehículo estar en dos a la vez.
create unique index bitacoras_una_abierta_por_conductor
  on public.bitacoras (conductor_id) where estado = 'abierta';
create unique index bitacoras_una_abierta_por_vehiculo
  on public.bitacoras (vehiculo_id) where estado = 'abierta';
create index bitacoras_inicio_idx on public.bitacoras (inicio_en);

alter table public.bitacoras enable row level security;

create policy bitacoras_select on public.bitacoras
  for select using (
    conductor_id = (select auth.uid())
    or (select public.es_gestion())
  );

-- Los conductores escriben solo a través de iniciar_bitacora / finalizar_bitacora.
create policy bitacoras_update_admin on public.bitacoras
  for update
  using ((select public.current_user_role()) = 'admin'::rol_usuario)
  with check ((select public.current_user_role()) = 'admin'::rol_usuario);

create policy bitacoras_delete_admin on public.bitacoras
  for delete using ((select public.current_user_role()) = 'admin'::rol_usuario);

-- ---------------------------------------------------------------------
-- Cargas de combustible
-- ---------------------------------------------------------------------
create table public.cargas_combustible (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos (id) on delete restrict,
  conductor_id uuid references public.profiles (id) on delete set null,
  bitacora_id uuid references public.bitacoras (id) on delete set null,
  fecha timestamptz not null default now(),
  litros numeric(8, 2) not null check (litros > 0 and litros <= 1000),
  monto integer check (monto >= 0),
  kilometraje integer check (kilometraje >= 0),
  numero_documento text,
  estacion text,
  registrado_por uuid references public.profiles (id) default auth.uid(),
  creado_en timestamptz not null default now()
);

create index cargas_fecha_idx on public.cargas_combustible (fecha);

alter table public.cargas_combustible enable row level security;

create policy cargas_select on public.cargas_combustible
  for select using (
    conductor_id = (select auth.uid())
    or (select public.es_gestion())
  );

-- El conductor solo registra cargas dentro de su propio viaje abierto,
-- y para el vehículo de ese viaje.
create policy cargas_insert on public.cargas_combustible
  for insert with check (
    (select public.es_gestion())
    or (
      (select public.current_user_role()) = 'conductor'::rol_usuario
      and conductor_id = (select auth.uid())
      and exists (
        select 1 from public.bitacoras b
        where b.id = cargas_combustible.bitacora_id
          and b.conductor_id = (select auth.uid())
          and b.vehiculo_id = cargas_combustible.vehiculo_id
          and b.estado = 'abierta'
      )
    )
  );

create policy cargas_update on public.cargas_combustible
  for update using ((select public.es_gestion())) with check ((select public.es_gestion()));

create policy cargas_delete_admin on public.cargas_combustible
  for delete using ((select public.current_user_role()) = 'admin'::rol_usuario);

-- ---------------------------------------------------------------------
-- Mantenciones
-- ---------------------------------------------------------------------
create table public.mantenciones (
  id uuid primary key default gen_random_uuid(),
  vehiculo_id uuid not null references public.vehiculos (id) on delete cascade,
  tipo tipo_mantencion not null,
  estado estado_mantencion not null default 'programada',
  descripcion text not null,
  fecha_programada date,
  km_programado integer check (km_programado >= 0),
  fecha_realizada date,
  km_realizado integer check (km_realizado >= 0),
  taller text,
  costo integer check (costo >= 0),
  observaciones text,
  creado_por uuid references public.profiles (id) default auth.uid(),
  creado_en timestamptz not null default now(),
  constraint mantenciones_con_meta check (fecha_programada is not null or km_programado is not null),
  constraint mantenciones_realizada_con_fecha check (estado <> 'realizada' or fecha_realizada is not null)
);

alter table public.mantenciones enable row level security;

create policy mantenciones_select on public.mantenciones
  for select using ((select public.es_gestion()));

create policy mantenciones_insert on public.mantenciones
  for insert with check ((select public.es_gestion()));

create policy mantenciones_update on public.mantenciones
  for update using ((select public.es_gestion())) with check ((select public.es_gestion()));

create policy mantenciones_delete_admin on public.mantenciones
  for delete using ((select public.current_user_role()) = 'admin'::rol_usuario);

-- Mantener el estado del vehículo sincronizado con sus mantenciones:
-- en taller => "en mantención"; al terminar => vuelve a "disponible".
create function public.sincronizar_estado_por_mantencion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'en_proceso' then
    update public.vehiculos
      set estado = 'en_mantencion'
      where id = new.vehiculo_id and estado <> 'en_ruta';
  elsif new.estado in ('realizada', 'cancelada') and coalesce(old.estado, 'programada') = 'en_proceso' then
    update public.vehiculos
      set estado = 'disponible'
      where id = new.vehiculo_id
        and estado = 'en_mantencion'
        and not exists (
          select 1 from public.mantenciones m
          where m.vehiculo_id = new.vehiculo_id and m.estado = 'en_proceso' and m.id <> new.id
        );
  end if;

  if new.estado = 'realizada' and new.km_realizado is not null then
    update public.vehiculos
      set kilometraje_actual = greatest(kilometraje_actual, new.km_realizado)
      where id = new.vehiculo_id;
  end if;

  return new;
end;
$$;

create trigger mantenciones_sincronizar_vehiculo
  after insert or update of estado, km_realizado on public.mantenciones
  for each row execute function public.sincronizar_estado_por_mantencion();

-- ---------------------------------------------------------------------
-- Funciones del conductor: iniciar y finalizar viaje
-- ---------------------------------------------------------------------
create function public.iniciar_bitacora(
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

revoke execute on function public.iniciar_bitacora(uuid, uuid, text, integer, nivel_combustible, jsonb, text) from public, anon;
grant execute on function public.iniciar_bitacora(uuid, uuid, text, integer, nivel_combustible, jsonb, text) to authenticated;

create function public.finalizar_bitacora(
  p_bitacora_id uuid,
  p_km_fin integer,
  p_combustible_fin nivel_combustible,
  p_observaciones text,
  p_novedades text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario uuid := (select auth.uid());
  v_bitacora public.bitacoras%rowtype;
begin
  if v_usuario is null then
    raise exception 'No autenticado.';
  end if;

  select * into v_bitacora from public.bitacoras where id = p_bitacora_id for update;
  if not found or v_bitacora.conductor_id <> v_usuario then
    raise exception 'La bitácora no existe o no te pertenece.';
  end if;

  if v_bitacora.estado <> 'abierta' then
    raise exception 'Este viaje ya fue finalizado.';
  end if;

  if p_km_fin < v_bitacora.km_inicio then
    raise exception 'El kilometraje final (% km) no puede ser menor al inicial (% km).',
      p_km_fin, v_bitacora.km_inicio;
  end if;

  update public.bitacoras
    set estado = 'cerrada',
        fin_en = now(),
        km_fin = p_km_fin,
        combustible_fin = p_combustible_fin,
        observaciones_fin = nullif(trim(p_observaciones), ''),
        novedades = nullif(trim(p_novedades), '')
    where id = p_bitacora_id;

  update public.vehiculos
    set kilometraje_actual = greatest(kilometraje_actual, p_km_fin),
        estado = case when estado = 'en_ruta' then 'disponible'::estado_vehiculo else estado end
    where id = v_bitacora.vehiculo_id;

  if v_bitacora.viaje_id is not null then
    update public.viajes set estado = 'finalizado' where id = v_bitacora.viaje_id;
  end if;
end;
$$;

revoke execute on function public.finalizar_bitacora(uuid, integer, nivel_combustible, text, text) from public, anon;
grant execute on function public.finalizar_bitacora(uuid, integer, nivel_combustible, text, text) to authenticated;
