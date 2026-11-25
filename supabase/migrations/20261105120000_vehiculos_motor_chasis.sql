-- Número de motor y número de chasis del vehículo.
-- Son opcionales (hay vehículos antiguos sin el dato a mano), pero si se
-- ingresan deben ser únicos: identifican físicamente a un solo vehículo.

alter table public.vehiculos
  add column numero_motor text,
  add column numero_chasis text;

alter table public.vehiculos
  add constraint vehiculos_numero_motor_key unique (numero_motor),
  add constraint vehiculos_numero_chasis_key unique (numero_chasis);
