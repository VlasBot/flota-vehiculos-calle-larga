-- Restringe quién puede ejecutar las funciones SECURITY DEFINER vía la API.
-- Postgres concede EXECUTE a PUBLIC por defecto, lo que deja estas funciones
-- expuestas en /rest/v1/rpc incluso para visitantes sin sesión.

-- Funciones de trigger: nadie necesita llamarlas directamente.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sincronizar_estado_por_mantencion() from public, anon, authenticated;

-- Funciones auxiliares de RLS: solo usuarios con sesión (las políticas las usan).
revoke execute on function public.current_user_role() from public, anon;
revoke execute on function public.es_gestion() from public, anon;
