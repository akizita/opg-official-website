-- Count submissions in local calendar buckets without exposing private stories.
create function public.get_candidate_testimonial_trend()
returns table (
  period text,
  bucket_index integer,
  bucket_start timestamp with time zone,
  submission_count bigint
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
    raise exception 'Not authorized to view candidate testimonial trends'
      using errcode = '42501';
  end if;

  return query
    with periods as (
      select
        'week'::text as kind,
        pg_catalog.date_trunc('week', local_now) as local_start,
        7 as bucket_count
      union all
      select
        'month'::text,
        pg_catalog.date_trunc('month', local_now),
        pg_catalog.date_part(
          'day',
          pg_catalog.date_trunc('month', local_now)
            + interval '1 month' - interval '1 day'
        )::integer
      union all
      select
        'year'::text,
        pg_catalog.date_trunc('year', local_now),
        12
    ),
    buckets as (
      select
        p.kind,
        series.n::integer as n,
        case
          when p.kind = 'year'
            then p.local_start + pg_catalog.make_interval(months => series.n)
          else p.local_start + pg_catalog.make_interval(days => series.n)
        end as local_start
      from periods as p
      cross join lateral pg_catalog.generate_series(0, p.bucket_count - 1) as series(n)
    )
    select
      b.kind,
      b.n,
      b.local_start at time zone 'Asia/Singapore',
      case
        when b.local_start > local_now then null::bigint
        else pg_catalog.count(t.id)
      end
    from buckets as b
    left join public.candidate_testimonials as t
      on t.submitted_at >= (b.local_start at time zone 'Asia/Singapore')
      and t.submitted_at < ((
        case
          when b.kind = 'year' then b.local_start + interval '1 month'
          else b.local_start + interval '1 day'
        end
      ) at time zone 'Asia/Singapore')
      and t.submitted_at < pg_catalog.now()
    group by b.kind, b.n, b.local_start
    order by case b.kind when 'week' then 1 when 'month' then 2 else 3 end, b.n;
end;
$$;

revoke all on function public.get_candidate_testimonial_trend() from public;
grant execute on function public.get_candidate_testimonial_trend() to authenticated;
