-- Supabase setup for Deepak Web Studio
create table if not exists websites (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null,
  description text not null,
  image_url text,
  demo_url text not null,
  tags text[] default '{}',
  created_at timestamptz default now()
);

create table if not exists feedback (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  rating int not null check (rating between 1 and 5),
  message text not null,
  approved boolean default false,
  created_at timestamptz default now()
);

create table if not exists settings (
  id int primary key,
  whatsapp text,
  about_text text,
  about_image text,
  theme text default 'cream'
);

insert into settings (id, whatsapp, about_text, theme)
values (1, '919999999999', 'I create clean, responsive and conversion-focused websites for local businesses and personal brands.', 'cream')
on conflict (id) do nothing;

alter table websites enable row level security;
alter table feedback enable row level security;
alter table settings enable row level security;

-- Public visitors can read demos/settings.
create policy "public read websites" on websites for select using (true);
create policy "public read settings" on settings for select using (true);

-- Public visitors can submit feedback, but cannot publish it.
create policy "public submit feedback" on feedback for insert with check (approved = false);
create policy "public read approved feedback" on feedback for select using (approved = true);

-- Admin access:
-- In production, tighten these policies to your admin user ID/email.
-- For a simple single-admin project, create an authenticated admin account
-- in Supabase Authentication and then use the authenticated policies below.
create policy "authenticated manage websites" on websites for all to authenticated using (true) with check (true);
create policy "authenticated manage feedback" on feedback for all to authenticated using (true) with check (true);
create policy "authenticated manage settings" on settings for all to authenticated using (true) with check (true);

-- Optional Storage:
-- Create a public bucket named "site-images" in Supabase Storage if you want
-- to upload images there. You can then paste the resulting public image URL
-- into the admin panel's image fields.