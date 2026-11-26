create table if not exists public.hadassa_admin_users (
 id uuid primary key default gen_random_uuid(),
 email text not null unique,
 user_id uuid unique references auth.users(id) on delete set null,
 role text not null default 'editor' check (role in ('super_admin','admin','editor')),
 permissions jsonb not null default '{}'::jsonb,
 is_active boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.hadassa_site_content (
 content_key text primary key, label text not null, category text not null default 'general',
 content jsonb not null default '{}'::jsonb, updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null
);
create table if not exists public.hadassa_admin_audit_log (
 id bigint generated always as identity primary key,
 actor_user_id uuid references auth.users(id) on delete set null,
 actor_email text, action text not null, entity_type text not null, entity_id text,
 details jsonb not null default '{}'::jsonb, created_at timestamptz not null default now()
);
create index if not exists hadassa_admin_audit_created_at_idx on public.hadassa_admin_audit_log(created_at desc);
alter table public.hadassa_admin_users enable row level security;
alter table public.hadassa_site_content enable row level security;
alter table public.hadassa_admin_audit_log enable row level security;

create or replace function public.is_hadassa_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.hadassa_admin_users a where a.user_id=(select auth.uid()) and a.is_active=true);
$$;
create or replace function public.is_hadassa_super_admin() returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.hadassa_admin_users a where a.user_id=(select auth.uid()) and a.role='super_admin' and a.is_active=true);
$$;
create or replace function public.has_hadassa_permission(permission_key text) returns boolean language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.hadassa_admin_users a where a.user_id=(select auth.uid()) and a.is_active=true and (a.role='super_admin' or a.permissions -> permission_key = 'true'::jsonb));
$$;
create or replace function public.bootstrap_hadassa_super_admin() returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_email text;
begin
 current_email:=lower(coalesce((select auth.jwt()->>'email'),''));
 if (select auth.uid()) is null or current_email <> 'drivelinkxv76@gmail.com' then raise exception 'Accès non autorisé'; end if;
 insert into public.hadassa_admin_users(email,user_id,role,permissions,is_active)
 values(current_email,(select auth.uid()),'super_admin','{}'::jsonb,true)
 on conflict(email) do update set user_id=excluded.user_id,role='super_admin',permissions='{}'::jsonb,is_active=true,updated_at=now();
 return jsonb_build_object('ok',true,'role','super_admin');
end; $$;
create or replace function public.claim_hadassa_admin_invite() returns boolean language plpgsql security definer set search_path = '' as $$
declare current_email text;
begin
 current_email:=lower(coalesce((select auth.jwt()->>'email'),''));
 if (select auth.uid()) is null or current_email='' then return false; end if;
 update public.hadassa_admin_users set user_id=(select auth.uid()),updated_at=now()
 where email=current_email and is_active=true and (user_id is null or user_id=(select auth.uid()));
 return found;
end; $$;
revoke all on function public.is_hadassa_admin() from public,anon;
revoke all on function public.is_hadassa_super_admin() from public,anon;
revoke all on function public.has_hadassa_permission(text) from public,anon;
revoke all on function public.bootstrap_hadassa_super_admin() from public,anon;
revoke all on function public.claim_hadassa_admin_invite() from public,anon;
grant execute on function public.is_hadassa_admin() to authenticated;
grant execute on function public.is_hadassa_super_admin() to authenticated;
grant execute on function public.has_hadassa_permission(text) to authenticated;
grant execute on function public.bootstrap_hadassa_super_admin() to authenticated;
grant execute on function public.claim_hadassa_admin_invite() to authenticated;

create policy "HADASSA admins read admin accounts" on public.hadassa_admin_users for select to authenticated using(user_id=(select auth.uid()) or (select public.is_hadassa_super_admin()));
create policy "HADASSA super admins insert admin accounts" on public.hadassa_admin_users for insert to authenticated with check((select public.is_hadassa_super_admin()));
create policy "HADASSA super admins update admin accounts" on public.hadassa_admin_users for update to authenticated using((select public.is_hadassa_super_admin())) with check((select public.is_hadassa_super_admin()));
create policy "HADASSA super admins delete admin accounts" on public.hadassa_admin_users for delete to authenticated using((select public.is_hadassa_super_admin()));
create policy "Public read HADASSA site content" on public.hadassa_site_content for select to anon,authenticated using(true);
create policy "HADASSA editors insert site content" on public.hadassa_site_content for insert to authenticated with check((select public.has_hadassa_permission('content.manage')));
create policy "HADASSA editors update site content" on public.hadassa_site_content for update to authenticated using((select public.has_hadassa_permission('content.manage'))) with check((select public.has_hadassa_permission('content.manage')));
create policy "HADASSA editors delete site content" on public.hadassa_site_content for delete to authenticated using((select public.has_hadassa_permission('content.manage')));
create policy "HADASSA admins read audit log" on public.hadassa_admin_audit_log for select to authenticated using((select public.is_hadassa_admin()));
create policy "HADASSA admins write audit log" on public.hadassa_admin_audit_log for insert to authenticated with check(actor_user_id=(select auth.uid()) and (select public.is_hadassa_admin()));
create policy "HADASSA admins read all media" on public.media_assets for select to authenticated using((select public.has_hadassa_permission('media.manage')));
create policy "HADASSA admins insert media" on public.media_assets for insert to authenticated with check((select public.has_hadassa_permission('media.manage')));
create policy "HADASSA admins update media" on public.media_assets for update to authenticated using((select public.has_hadassa_permission('media.manage'))) with check((select public.has_hadassa_permission('media.manage')));
create policy "HADASSA admins delete media" on public.media_assets for delete to authenticated using((select public.has_hadassa_permission('media.manage')));
create policy "HADASSA admins update rotation slots" on public.media_rotation_slots for update to authenticated using((select public.has_hadassa_permission('media.manage'))) with check((select public.has_hadassa_permission('media.manage')));
create policy "HADASSA admins upload media files" on storage.objects for insert to authenticated with check(bucket_id='hadassa-media' and (select public.has_hadassa_permission('media.manage')));
create policy "HADASSA admins update media files" on storage.objects for update to authenticated using(bucket_id='hadassa-media' and (select public.has_hadassa_permission('media.manage'))) with check(bucket_id='hadassa-media' and (select public.has_hadassa_permission('media.manage')));
create policy "HADASSA admins delete media files" on storage.objects for delete to authenticated using(bucket_id='hadassa-media' and (select public.has_hadassa_permission('media.manage')));
insert into public.hadassa_admin_users(email,role,permissions,is_active)
values('drivelinkxv76@gmail.com','super_admin','{}'::jsonb,true) on conflict(email) do nothing;
