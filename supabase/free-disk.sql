-- Emergency copy of the retention the sync job already runs.
-- Keeps matches from 5 days ago through 5 days ahead.
-- Ratings and comments for matches outside that window go with them.
-- Accounts, zones, and player profiles stay.

delete from public.comments
where event_id in (
  select id_event from public.sportsdb_fixtures
  where date_event is null
     or date_event < (current_date - 5)
     or date_event > (current_date + 5)
);

delete from public.ratings
where event_id in (
  select id_event from public.sportsdb_fixtures
  where date_event is null
     or date_event < (current_date - 5)
     or date_event > (current_date + 5)
);

delete from public.sportsdb_fixtures
where date_event is null
   or date_event < (current_date - 5)
   or date_event > (current_date + 5);

update public.sportsdb_fixtures
set raw = jsonb_strip_nulls(jsonb_build_object(
  'sideline_slug', raw->>'sideline_slug',
  'idHomeTeam', coalesce(raw->>'idHomeTeam', id_home_team),
  'idAwayTeam', coalesce(raw->>'idAwayTeam', id_away_team),
  'strHomeTeamBadge', raw->>'strHomeTeamBadge',
  'strAwayTeamBadge', raw->>'strAwayTeamBadge',
  'lineup', case
    when jsonb_typeof(raw->'lineup') = 'array' then raw->'lineup'
    else '[]'::jsonb
  end
));
