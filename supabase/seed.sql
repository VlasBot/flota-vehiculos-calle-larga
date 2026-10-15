-- Datos de ejemplo opcionales para probar la app (ejecutar después de la migración)
insert into public.vehiculos
  (patente, numero_interno, tipo, marca, modelo, anio, tipo_combustible, capacidad_pasajeros,
   unidad_asignada, kilometraje_actual, vencimiento_revision_tecnica, vencimiento_permiso_circulacion, vencimiento_soap)
values
  ('HXRT21', 'M-01', 'camioneta', 'Toyota', 'Hilux', 2021, 'diesel', 5, 'Obras', 84500, '2027-03-31', '2027-03-31', '2027-03-31'),
  ('KJPL45', 'M-02', 'minibus', 'Mercedes-Benz', 'Sprinter', 2019, 'diesel', 19, 'DIDECO', 152300, '2026-11-10', '2027-03-31', '2027-03-31'),
  ('LBCD88', 'M-03', 'auto', 'Hyundai', 'Accent', 2022, 'gasolina', 4, 'Alcaldía', 41200, '2027-06-30', '2027-03-31', '2027-03-31'),
  ('GHTR12', 'M-04', 'camion', 'Volkswagen', 'Delivery 11.180', 2018, 'diesel', 3, 'Aseo y Ornato', 210900, '2026-10-01', '2027-03-31', '2027-03-31'),
  ('FRT45', 'M-05', 'moto', 'Honda', 'XR 190', 2023, 'gasolina', 2, 'Inspección', 9800, '2027-08-31', '2027-03-31', '2027-03-31'),
  ('JJKL77', 'M-06', 'bus', 'Agrale', 'MT 15.0', 2017, 'diesel', 32, 'Educación', 301200, '2027-01-15', '2027-03-31', '2027-03-31');
