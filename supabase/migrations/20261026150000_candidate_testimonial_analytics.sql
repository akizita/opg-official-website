-- Aggregate candidate activity without sending private submissions to the browser.
create index if not exists candidate_testimonials_submitted_at_idx
  on public.candidate_testimonials (submitted_at desc);

create function public.get_candidate_testimonial_analytics()
returns table (
  period text,
  submission_count bigint,
  previous_count bigint,
  prospective_count bigint,
  past_count bigint,
  pending_count bigint,
  approved_count bigint,
  rejected_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  local_now timestamp without time zone := pg_catalog.timezone('Asia/Singapore', pg_catalog.now());
begin
  if not private.has_permission('content.view') then
    raise exception 'Not authorized to view candidate testimonial analytics'
      using errcode = '42501';
  end if;

  return query
    with periods as (
      select
        p.kind,
        pg_catalog.date_trunc(p.kind, local_now) at time zone 'Asia/Singapore' as current_start,
        (pg_catalog.date_trunc(p.kind, local_now) - p.duration) at time zone 'Asia/Singapore' as previous_start
      from (values
        ('week'::text, interval '1 week'),
        ('month'::text, interval '1 month'),
        ('year'::text, interval '1 year')
      ) as p(kind, duration)
    ),
    bounds as (
      select
        p.kind,
        p.current_start,
        p.previous_start,
        least(
          p.current_start,
          p.previous_start + (pg_catalog.now() - p.current_start)
        ) as previous_end
      from periods as p
    )
    select
      b.kind,
      count(t.id) filter (where t.submitted_at >= b.current_start),
      count(t.id) filter (where t.submitted_at < b.previous_end),
      count(t.id) filter (where t.submitted_at >= b.current_start and t.relationship = 'prospective'),
      count(t.id) filter (where t.submitted_at >= b.current_start and t.relationship = 'past'),
      count(t.id) filter (where t.submitted_at >= b.current_start and t.status = 'pending'),
      count(t.id) filter (where t.submitted_at >= b.current_start and t.status = 'approved'),
      count(t.id) filter (where t.submitted_at >= b.current_start and t.status = 'rejected')
    from bounds as b
    left join public.candidate_testimonials as t
      on t.submitted_at >= b.previous_start and t.submitted_at < pg_catalog.now()
    group by b.kind
    order by case b.kind when 'week' then 1 when 'month' then 2 else 3 end;
end;
$$;

revoke all on function public.get_candidate_testimonial_analytics() from public;
grant execute on function public.get_candidate_testimonial_analytics() to authenticated;
