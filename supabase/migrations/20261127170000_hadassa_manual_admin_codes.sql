create table if not exists public.hadassa_admin_login_codes (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0 check (attempts >= 0),
  used_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.hadassa_admin_login_codes enable row level security;
revoke all on public.hadassa_admin_login_codes from public, anon, authenticated;
grant all on public.hadassa_admin_login_codes to service_role;

create or replace function public.consume_hadassa_admin_code(p_email text, p_code_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(trim(p_email)) = 'drivelinkxv76@gmail.com' then
    return false;
  end if;

  update public.hadassa_admin_login_codes c
     set used_at = now(), updated_at = now()
   where c.email = lower(trim(p_email))
     and c.code_hash = p_code_hash
     and c.used_at is null
     and c.expires_at > now()
     and c.attempts < 5
     and exists (
       select 1 from public.hadassa_admin_users a
        where a.email = c.email and a.is_active = true
     );

  if found then
    return true;
  end if;

  update public.hadassa_admin_login_codes
     set attempts = attempts + 1, updated_at = now()
   where email = lower(trim(p_email))
     and used_at is null
     and expires_at > now()
     and attempts < 5;

  return false;
end;
$$;
revoke all on function public.consume_hadassa_admin_code(text, text) from public, anon, authenticated;
grant execute on function public.consume_hadassa_admin_code(text, text) to service_role;
