-- Apply this once to add optional in-progress banner messages to existing events.
alter table public.events
  add column if not exists banner_message text;

alter table public.events
  drop constraint if exists events_banner_message_length,
  add constraint events_banner_message_length
    check (banner_message is null or char_length(banner_message) <= 500);
