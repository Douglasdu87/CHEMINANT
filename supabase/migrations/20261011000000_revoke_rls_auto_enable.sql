-- La fonction rls_auto_enable() (déclencheur Supabase « ensure_rls », qui active
-- la RLS sur chaque nouvelle table) n'a pas à être appelable par l'API REST.
-- Le déclencheur continue de fonctionner : seul l'appel /rest/v1/rpc est fermé.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
