-- Review decisions go through one permission-checked, atomic transition.
-- The original broad UPDATE grant is removed so browser clients cannot edit
-- quotes, consent, reviewer metadata, or publication dates directly.
revoke update on public.candidate_testimonials from authenticated;
drop policy candidate_testimonials_admin_review on public.candidate_testimonials;

create function public.review_candidate_testimonial(
  p_id uuid,
  p_decision text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.has_permission('content.publish') then
    raise exception 'Not authorized to review candidate testimonials'
      using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected') or p_decision is null then
    raise exception 'Invalid testimonial review decision'
      using errcode = '22023';
  end if;

  update public.candidate_testimonials
  set status = p_decision,
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      published_at = case when p_decision = 'approved' then now() else null end
  where id = p_id
    and status = 'pending'
    and publication_consent = true;

  return found;
end;
$$;

revoke all on function public.review_candidate_testimonial(uuid, text) from public;
grant execute on function public.review_candidate_testimonial(uuid, text) to authenticated;
