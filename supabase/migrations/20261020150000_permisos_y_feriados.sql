-- =====================================================================
-- Permisos de circulación para viajes en fin de semana o feriado.
-- Un permiso se emite para un viaje programado y queda con un folio
-- correlativo. Los feriados los registra la secretaría / encargado.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Feriados
-- ---------------------------------------------------------------------
create table public.feriados (
  fecha date primary key,
  nombre text not null check (trim(nombre) <> ''),
  creado_en timestamptz not null default now()
);

alter table public.feriados enable row level security;

create policy feriados_select on public.feriados
  for select using ((select public.es_gestion()));

create policy feriados_insert on public.feriados
  for insert with check ((select public.es_gestion()));

create policy feriados_update on public.feriados
  for update using ((select public.es_gestion())) with check ((select public.es_gestion()));

create policy feriados_delete on public.feriados
  for delete using ((select public.es_gestion()));

-- ---------------------------------------------------------------------
-- Permisos
-- ---------------------------------------------------------------------
create table public.permisos (
  id uuid primary key default gen_random_uuid(),
  folio integer generated always as identity unique,
  viaje_id uuid not null unique references public.viajes (id) on delete cascade,
  observaciones text,
  emitido_por uuid references public.profiles (id) default auth.uid(),
  emitido_en timestamptz not null default now()
);

create index permisos_emitido_en_idx on public.permisos (emitido_en);

alter table public.permisos enable row level security;

create policy permisos_select on public.permisos
  for select using ((select public.es_gestion()));

create policy permisos_insert on public.permisos
  for insert with check ((select public.es_gestion()));

create policy permisos_update on public.permisos
  for update using ((select public.es_gestion())) with check ((select public.es_gestion()));

-- Anular un permiso = eliminarlo
create policy permisos_delete on public.permisos
  for delete using ((select public.es_gestion()));

-- Solo se emite para un viaje programado que incluya al menos un sábado,
-- domingo o feriado registrado (fechas en hora de Chile).
create function public.validar_permiso()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_viaje public.viajes%rowtype;
begin
  select * into v_viaje from public.viajes where id = new.viaje_id;
  if not found then
    raise exception 'El viaje seleccionado no existe.';
  end if;

  if v_viaje.estado <> 'programado' then
    raise exception 'Solo se puede emitir un permiso para un viaje programado.';
  end if;

  if not exists (
    select 1
    from generate_series(
      (v_viaje.salida_programada at time zone 'America/Santiago')::date,
      (v_viaje.regreso_programado at time zone 'America/Santiago')::date,
      interval '1 day'
    ) as dia
    where extract(isodow from dia) in (6, 7)
       or dia::date in (select fecha from public.feriados)
  ) then
    raise exception 'El viaje no se realiza en fin de semana ni en un día feriado registrado.';
  end if;

  return new;
end;
$$;

create trigger permisos_validar
  before insert or update of viaje_id on public.permisos
  for each row execute function public.validar_permiso();

revoke execute on function public.validar_permiso() from public, anon, authenticated;
