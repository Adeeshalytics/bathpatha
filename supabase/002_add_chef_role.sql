-- =====================================================================
--  Migration: add the "chef" role (view-only)
--  Run this once in the Supabase SQL editor on an existing database.
--  (A fresh database created from schema.sql already includes it.)
--
--  The chef role is for a view-only account (e.g. Aunty, who cooks) that
--  can see how much each person owes but cannot record or change anything.
-- =====================================================================

alter table public.users drop constraint if exists users_role_check;
alter table public.users
  add constraint users_role_check check (role in ('admin', 'user', 'chef'));

-- Optionally create the Aunty account now (she sets her own PIN on first login):
-- insert into public.users (name, role) values ('Aunty', 'chef')
--   on conflict (name) do nothing;
