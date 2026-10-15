# Gestión de Flota Vehicular · Municipalidad de Calle Larga

Aplicación web para administrar la flota municipal (buses, camiones, autos, camionetas, motos, micros…),
planificar viajes, asignar turnos a conductores y registrar las bitácoras de inicio y término de cada viaje.

**Stack:** React 19 · Vite 8 · React Router 7 · Supabase (Postgres, Auth, RLS, Edge Functions) · CSS3 puro.

## Perfiles

| Perfil | Qué puede hacer |
|---|---|
| **Administrador** (`admin`) | Todo, más el **Panel de administración** (métricas y alertas), eliminar vehículos y crear otros administradores. |
| **Gestión de flota** (`usuario`) | Secretaría y encargado de flota: vehículos, mantenciones, viajes, turnos, bitácoras, combustible, conductores y usuarios. |
| **Conductor** (`conductor`) | Iniciar viaje (km, combustible, revisión del vehículo), registrar cargas de combustible en litros, finalizar viaje y ver su historial y turnos. |

## Reglas de negocio garantizadas por la base de datos

- **Sin solapamientos:** un vehículo o un conductor no pueden tener dos viajes activos que se crucen,
  ni un conductor dos turnos que se crucen (restricciones `EXCLUDE` de Postgres). El formulario además
  avisa del cruce antes de guardar.
- Un conductor solo puede tener **un viaje abierto** y un vehículo solo puede estar en un viaje a la vez.
- El **kilometraje** nunca retrocede: el inicial no puede ser menor al último registrado y el final no puede ser menor al inicial.
- Al iniciar un viaje el vehículo queda **"En ruta"**; al finalizarlo vuelve a **"Disponible"** y se actualiza su kilometraje.
- Una mantención **"En taller"** deja el vehículo **"En mantención"**; al marcarla **realizada** vuelve a estar disponible.
- **RLS en todas las tablas.** Un conductor solo ve sus viajes, turnos, bitácoras y cargas, y solo puede
  registrar cargas dentro de su viaje abierto. El perfil "usuario" no puede tocar administradores.
- Las cuentas desactivadas pierden el acceso de inmediato (sin borrar su historial).

## Puesta en marcha

### 1. Crear el proyecto en Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **Authentication → Sign In / Providers**, desactiva **"Allow new users to sign up"**
   (las cuentas solo se crean desde la app).

### 2. Aplicar la base de datos

Con la [CLI de Supabase](https://supabase.com/docs/guides/cli):

```bash
supabase link --project-ref <tu-project-ref>
supabase db push
```

O bien copia el contenido de `supabase/migrations/20261015120000_esquema_inicial_flota.sql`
en el **SQL Editor** del dashboard y ejecútalo. Opcional: `supabase/seed.sql` carga vehículos de ejemplo.

### 3. Publicar la Edge Function para crear usuarios

```bash
supabase functions deploy crear-usuario
```

Usa las variables `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`, que Supabase entrega automáticamente
a las Edge Functions. La `service_role` key **nunca** va en el frontend.

### 4. Crear el primer administrador

1. En **Authentication → Users → Add user**, crea tu usuario con correo y contraseña
   (marca "Auto Confirm User").
2. En el SQL Editor:

   ```sql
   update public.profiles
   set role = 'admin', nombre_completo = 'Tu Nombre'
   where email = 'tu-correo@calle-larga.cl';
   ```

Desde ahí, el resto de usuarios y conductores se crean dentro de la app.

### 5. Ejecutar la app

```bash
cp .env.example .env.local   # completa URL y publishable key (Project Settings → API)
npm install
npm run dev
```

Otros comandos: `npm run build` (producción), `npm run lint` (oxlint).

## Estructura

```
src/
├── components/   ui/ (Button, Card, Modal, DataTable…), layout/ (AppShell, Sidebar, Header),
│                 guards/ (ProtectedRoute, RoleRoute), icons/ (un SVG por ícono)
├── features/     una carpeta por área: panel, vehiculos, viajes, turnos, bitacoras, combustible,
│                 mantenciones, personal, conductor, auth y shared. Cada una con su *Api.js
├── context/      AuthContext, ToastContext
├── hooks/        useAuth, useToast, useListaPaginada, useFormulario, useValorDiferido
├── lib/          supabaseClient.js
├── styles/       tokens.css, reset.css, global.css
└── utils/        fechas, formato, rut, consultas, rutas
supabase/
├── migrations/   esquema, RLS y funciones
├── functions/    crear-usuario (Edge Function)
└── seed.sql      datos de ejemplo
```
