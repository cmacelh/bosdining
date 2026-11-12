-- TableScout: personal tasting log (idempotent)
create table if not exists public.tasting_feedback (
  restaurant_id    text primary key,
  restaurant_name  text not null default '',
  rating           smallint not null check (rating between 1 and 5),
  verdict          text not null check (verdict in ('Obsessed / VIP','Would Return','One & Done','Skip')),
  favorite_dishes  text not null default '',
  best_table_note  text not null default '',
  personal_notes   text not null default '',
  last_visited     date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- RLS on, no anon/authenticated policies: only the server (service role) can read/write.
alter table public.tasting_feedback enable row level security;

create or replace function public.tasting_feedback_touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace trigger tasting_feedback_set_updated_at
  before update on public.tasting_feedback
  for each row execute function public.tasting_feedback_touch_updated_at();
