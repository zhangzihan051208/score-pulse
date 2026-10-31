-- Run in Supabase Dashboard → SQL Editor.
-- The match cache was storing the full provider payload and matches outside
-- the 5-day window. This deletes those rows and shrinks what remains.
-- Ratings and comments are not touched.

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
