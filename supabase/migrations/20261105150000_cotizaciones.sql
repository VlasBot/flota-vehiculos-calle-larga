-- Cotización de viajes
--
-- 1) Rendimiento declarado del vehículo (km por litro, o km por kWh si es
--    eléctrico). Es opcional: si no está, la cotización propone un valor
--    según las cargas de combustible registradas o el tipo de vehículo.
-- 2) Tabla de cotizaciones con folio correlativo. Se guardan los datos con
--    que se calculó (incluido el rendimiento usado) para que el documento
--    no cambie si después se actualiza el vehículo.

alter table public.vehiculos
  add column rendimiento_km_litro numeric(5, 2)
    check (rendimiento_km_litro is null or rendimiento_km_litro > 0);

create table public.cotizaciones (
  id uuid primary key default gen_random_uuid(),
  folio integer generated always as identity unique,
  vehiculo_id uuid not null references public.vehiculos (id) on delete restrict,
  origen text not null,
  destino text not null,
  km_tramo numeric(8, 1) not null check (km_tramo > 0),
  ida_y_vuelta boolean not null default true,
  rendimiento_km_litro numeric(5, 2) not null check (rendimiento_km_litro > 0),
  precio_combustible integer not null check (precio_combustible > 0),
  peajes integer not null default 0 check (peajes >= 0),
  otros_gastos integer not null default 0 check (otros_gastos >= 0),
  solicitante text,
  fecha_viaje date,
  observaciones text,
  emitido_por uuid references public.profiles (id) default auth.uid(),
  emitido_en timestamptz not null default now()
);

create index cotizaciones_emitido_en_idx on public.cotizaciones (emitido_en);

alter table public.cotizaciones enable row level security;

create policy cotizaciones_select on public.cotizaciones
  for select using ((select public.es_gestion()));

create policy cotizaciones_insert on public.cotizaciones
  for insert with check ((select public.es_gestion()));

-- Anular una cotización = eliminarla
create policy cotizaciones_delete on public.cotizaciones
  for delete using ((select public.es_gestion()));
