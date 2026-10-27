-- The public contact action writes through a server-only secret key. That key
-- uses service_role, which still needs table grants when auto exposure is off.
grant select, insert, update, delete on
  public.contact_inquiries,
  public.notification_outbox
to service_role;
