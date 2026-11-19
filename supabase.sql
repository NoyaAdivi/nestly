-- Nestly: run once in Supabase > SQL Editor > New query > Run
create table if not exists nestly_households (
  code text primary key,
  name text not null,
  created_at timestamptz not null default now()
);
create table if not exists nestly_records (
  household text not null references nestly_households(code) on delete cascade,
  id text not null,
  kind text not null,
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  primary key (household, id)
);
create index if not exists nestly_records_sync on nestly_records (household, updated_at);

-- Tables are locked. Access only through the functions below, which need the household code.
alter table nestly_households enable row level security;
alter table nestly_records enable row level security;

create or replace function nestly_create(p_code text, p_name text) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  if p_code !~ '^[A-Z0-9]{6}$' then return false; end if;
  insert into nestly_households(code, name) values (p_code, left(p_name, 60));
  return true;
exception when unique_violation then return false;
end $$;

create or replace function nestly_info(p_code text) returns text
language sql stable security definer set search_path = public as $$
  select name from nestly_households where code = upper(p_code)
$$;

create or replace function nestly_pull(p_code text, p_since timestamptz)
returns table(id text, kind text, data jsonb, deleted boolean, updated_at timestamptz)
language sql stable security definer set search_path = public as $$
  select r.id, r.kind, r.data, r.deleted, r.updated_at
  from nestly_records r
  where r.household = upper(p_code) and r.updated_at > coalesce(p_since, '-infinity'::timestamptz)
  order by r.updated_at
  limit 5000
$$;

create or replace function nestly_push(p_code text, p_rows jsonb) returns timestamptz
language plpgsql security definer set search_path = public as $$
declare r jsonb;
begin
  if not exists (select 1 from nestly_households where code = upper(p_code)) then raise exception 'unknown household'; end if;
  if jsonb_array_length(p_rows) > 500 then raise exception 'too many rows'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    if length(r::text) > 20000 then continue; end if;
    insert into nestly_records(household, id, kind, data, deleted, updated_at)
    values (upper(p_code), r->>'id', r->>'kind', coalesce(r->'data', '{}'::jsonb), coalesce((r->>'deleted')::boolean, false), clock_timestamp())
    on conflict (household, id) do update
      set kind = excluded.kind, data = excluded.data, deleted = excluded.deleted, updated_at = clock_timestamp();
  end loop;
  return clock_timestamp();
end $$;

revoke all on function nestly_create(text, text), nestly_info(text), nestly_pull(text, timestamptz), nestly_push(text, jsonb) from public;
grant execute on function nestly_create(text, text), nestly_info(text), nestly_pull(text, timestamptz), nestly_push(text, jsonb) to anon, authenticated;
