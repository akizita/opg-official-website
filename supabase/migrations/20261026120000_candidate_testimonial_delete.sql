-- Deletion is limited to administrators with archive permission. Browser
-- clients retain no direct DELETE grant on candidate submissions.
create function public.delete_candidate_testimonial(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_permission('content.archive') then
    raise exception 'Not authorized to delete candidate testimonials'
      using errcode = '42501';
  end if;

  delete from public.candidate_testimonials where id = p_id;
  return found;
end;
$$;

revoke all on function public.delete_candidate_testimonial(uuid) from public;
grant execute on function public.delete_candidate_testimonial(uuid) to authenticated;

-- Keep the admin queue and public approved list in sync when a row is removed.
create or replace function private.broadcast_candidate_testimonial_change()
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
  elsif tg_op = 'DELETE' then
    status_changed := true;
    public_changed := old.status = 'approved';
  else
    status_changed := old.status is distinct from new.status;
    public_changed := status_changed
      and (old.status = 'approved' or new.status = 'approved');
  end if;

  if status_changed then
    begin
      perform realtime.send('{}'::jsonb, 'changed', 'candidate-testimonials-admin', true);
    exception when others then
      raise warning 'Candidate testimonial admin broadcast failed: %', sqlstate;
    end;

    if public_changed then
      begin
        perform realtime.send('{}'::jsonb, 'changed', 'candidate-testimonials-public', false);
      exception when others then
        raise warning 'Candidate testimonial public broadcast failed: %', sqlstate;
      end;
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger candidate_testimonial_realtime_delete
after delete on public.candidate_testimonials
for each row execute function private.broadcast_candidate_testimonial_change();
