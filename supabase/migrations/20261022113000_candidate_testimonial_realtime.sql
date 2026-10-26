-- A private change signal refreshes the admin queue. The public signal only
-- fires when the approved collection changes. Neither message includes row
-- data, so candidate emails and pending stories stay out of broadcasts.
create policy candidate_testimonial_admin_broadcast_read
on realtime.messages
for select
to authenticated
using (
  realtime.messages.extension = 'broadcast'
  and (select realtime.topic()) = 'candidate-testimonials-admin'
  and (select private.has_permission('content.view'))
);

create function private.broadcast_candidate_testimonial_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  status_changed boolean;
  public_changed boolean;
begin
  if tg_op = 'INSERT' then
    status_changed := true;
    public_changed := new.status = 'approved';
  else
    status_changed := old.status is distinct from new.status;
    public_changed := status_changed
      and (old.status = 'approved' or new.status = 'approved');
  end if;

  if not status_changed then
    return new;
  end if;

  begin
    perform realtime.send(
      '{}'::jsonb,
      'changed',
      'candidate-testimonials-admin',
      true
    );
  exception when others then
    -- An unavailable Realtime service must not block the submission/review.
    raise warning 'Candidate testimonial admin broadcast failed: %', sqlstate;
  end;

  if public_changed then
    begin
      perform realtime.send(
        '{}'::jsonb,
        'changed',
        'candidate-testimonials-public',
        false
      );
    exception when others then
      raise warning 'Candidate testimonial public broadcast failed: %', sqlstate;
    end;
  end if;

  return new;
end;
$$;

create trigger candidate_testimonial_realtime_change
after insert or update of status on public.candidate_testimonials
for each row execute function private.broadcast_candidate_testimonial_change();
