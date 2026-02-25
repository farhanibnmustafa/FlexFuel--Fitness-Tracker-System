-- Supabase Security Advisor remediation
-- Run this in Supabase SQL Editor (project database) once.

begin;

-- 1) Fix SECURITY DEFINER view warning by forcing invoker rights.
alter view if exists public.v_today_target set (security_invoker = true);

-- 2) Enable RLS + add a service-role policy on every public table.
do $$
declare
  r record;
begin
  for r in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  loop
    execute format(
      'alter table %I.%I enable row level security',
      r.schema_name,
      r.table_name
    );

    if not exists (
      select 1
      from pg_policies p
      where p.schemaname = r.schema_name
        and p.tablename = r.table_name
        and p.policyname = 'service_role_all_access'
    ) then
      execute format(
        'create policy service_role_all_access on %I.%I for all to service_role using (true) with check (true)',
        r.schema_name,
        r.table_name
      );
    end if;
  end loop;
end
$$;

-- 3) Revoke broad API role grants on current public tables/sequences.
do $$
declare
  r record;
begin
  for r in
    select n.nspname as schema_name, c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('r', 'p')
  loop
    execute format(
      'revoke all on table %I.%I from anon, authenticated',
      r.schema_name,
      r.table_name
    );
  end loop;

  for r in
    select sequence_schema, sequence_name
    from information_schema.sequences
    where sequence_schema = 'public'
  loop
    execute format(
      'revoke all on sequence %I.%I from anon, authenticated',
      r.sequence_schema,
      r.sequence_name
    );
  end loop;
end
$$;

-- 4) Prevent future public objects from inheriting broad anon/auth grants.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;

-- 5) Fix "Function Search Path Mutable" warnings.
-- Applies to any signature found for the listed function names.
do $$
declare
  r record;
begin
  for r in
    select
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as identity_args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in ('estimate_prescription_seconds', 'get_today_target')
  loop
    execute format(
      'alter function %I.%I(%s) set search_path = pg_catalog, public',
      r.schema_name,
      r.function_name,
      r.identity_args
    );
  end loop;
end
$$;

commit;

-- Verification helpers:
-- a) Views still running as definer (should return 0 rows for v_today_target)
-- select n.nspname, c.relname, c.reloptions
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where c.relkind = 'v'
--   and n.nspname = 'public'
--   and c.relname = 'v_today_target'
--   and (
--     c.reloptions is null
--     or not exists (
--       select 1 from unnest(c.reloptions) as opt where opt = 'security_invoker=true'
--     )
--   );
--
-- b) Public tables with RLS disabled (should return 0 rows)
-- select n.nspname, c.relname
-- from pg_class c
-- join pg_namespace n on n.oid = c.relnamespace
-- where n.nspname = 'public'
--   and c.relkind in ('r', 'p')
--   and c.relrowsecurity = false
-- order by 1, 2;
--
-- c) Mutable search_path functions (should return 0 rows for listed names)
-- select
--   n.nspname as schema_name,
--   p.proname as function_name,
--   pg_get_function_identity_arguments(p.oid) as identity_args,
--   p.proconfig
-- from pg_proc p
-- join pg_namespace n on n.oid = p.pronamespace
-- where n.nspname = 'public'
--   and p.proname in ('estimate_prescription_seconds', 'get_today_target')
--   and (
--     p.proconfig is null
--     or not exists (
--       select 1
--       from unnest(p.proconfig) cfg
--       where cfg like 'search_path=%'
--     )
--   );
