-- Enum des rôles
create type public.app_role as enum ('admin', 'user');

-- Table des rôles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

-- Fonction sécurisée
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Politiques: utilisateur voit ses rôles, admin voit tout
create policy "view own roles" on public.user_roles
  for select using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create policy "admin manage roles" on public.user_roles
  for all using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- Trigger: auto-assigner admin si email = gracekot20@gmail.com, sinon user
create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email = 'gracekot20@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin')
    on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user')
    on conflict do nothing;
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created_role
after insert on auth.users
for each row execute function public.handle_new_user_role();

-- Si gracekot20@gmail.com existe déjà, lui donner admin
insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users where email = 'gracekot20@gmail.com'
on conflict do nothing;

-- Politique admin pour voir TOUTES les reading_sessions
create policy "admin view all sessions" on public.reading_sessions
  for select using (public.has_role(auth.uid(), 'admin'));

-- Vue admin agrégée (utilisateurs + emails) — security definer pour exposer email auth
create or replace function public.admin_user_stats()
returns table (
  user_id uuid,
  email text,
  total_minutes bigint,
  chapters_read bigint,
  avg_completion numeric,
  last_active timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id as user_id,
    u.email::text,
    coalesce(sum(rs.duration_seconds)/60, 0)::bigint as total_minutes,
    count(distinct (rs.book_id, rs.chapter))::bigint as chapters_read,
    coalesce(round(avg(rs.completion_percent)::numeric, 0), 0) as avg_completion,
    max(rs.created_at) as last_active
  from auth.users u
  left join public.reading_sessions rs on rs.user_id = u.id
  where public.has_role(auth.uid(), 'admin')
  group by u.id, u.email
  order by last_active desc nulls last
$$;