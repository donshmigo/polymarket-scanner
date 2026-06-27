-- Polymarket Scanner — Supabase Schema
-- Run this in the Supabase SQL Editor. Safe to re-run (idempotent).

-- Cached market snapshots (optional convenience table)
create table if not exists markets (
  id            text primary key,
  question      text not null,
  yes_price     numeric(6,4) not null,
  volume_num    numeric(18,2) not null,
  end_date      timestamptz,
  category      text,
  slug          text,
  condition_id  text,
  fetched_at    timestamptz default now()
);

-- AI signal analysis results (cache + performance history)
create table if not exists signals (
  id               uuid primary key default gen_random_uuid(),
  market_id        text not null,
  question         text not null,
  yes_price        numeric(6,4) not null,
  confidence_score smallint not null check (confidence_score between 0 and 100),
  direction        text not null check (direction in ('OVERPRICED','UNDERPRICED','FAIRLY_PRICED')),
  rationale        text not null,
  edge             numeric(5,2) not null,
  score            numeric(5,2) not null default 0,
  created_at       timestamptz default now()
);

-- Migration for existing installs: add the OpportunityScore column if missing,
-- and drop the old FK so signals can be cached without a markets row.
alter table signals add column if not exists score numeric(5,2) not null default 0;
alter table signals drop constraint if exists signals_market_id_fkey;

-- User watchlist
create table if not exists watchlist (
  id           uuid primary key default gen_random_uuid(),
  market_id    text not null,
  question     text not null,
  entry_price  numeric(6,4) not null,
  entry_date   date not null default current_date,
  position     text not null check (position in ('YES','NO')),
  resolved     boolean not null default false,
  outcome      boolean,
  exit_price   numeric(6,4),
  pnl          numeric(8,4),
  notes        text,
  created_at   timestamptz default now()
);

-- Indexes
create index if not exists signals_market_id_idx on signals(market_id);
create index if not exists signals_created_at_idx on signals(created_at desc);
create index if not exists watchlist_resolved_idx on watchlist(resolved);
create index if not exists watchlist_created_at_idx on watchlist(created_at desc);
