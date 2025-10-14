create or replace function public.record_signup(
  p_opportunity_id uuid,
  p_volunteer_name text,
  p_volunteer_email text,
  p_notes text default null
)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  current_opportunity opportunities%rowtype;
begin
  select *
  into current_opportunity
  from opportunities
  where id = p_opportunity_id
  for update;

  if not found then
    raise exception 'OPPORTUNITY_NOT_FOUND';
  end if;

  if current_opportunity.spots_remaining <= 0 then
    raise exception 'NO_SPOTS_AVAILABLE';
  end if;

  insert into signups (
    opportunity_id,
    volunteer_name,
    volunteer_email,
    notes
  )
  values (
    p_opportunity_id,
    p_volunteer_name,
    p_volunteer_email,
    p_notes
  );

  update opportunities
  set spots_remaining = spots_remaining - 1
  where id = p_opportunity_id;
end;
$$;
