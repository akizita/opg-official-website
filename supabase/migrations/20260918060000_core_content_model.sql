-- OPG Core Content, Publishing, Inquiries, Newsletter, and Search Model
-- Version: 1.0 (Phase 1 Baseline)

-- =============================================================================
-- 1. Site Structure & Pages
-- =============================================================================

create table public.page_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  content jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  canonical_url text,
  og_image_url text,
  status text not null default 'draft',
  version int not null default 1,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  archived_at timestamptz,
  constraint page_documents_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint page_documents_title_not_blank check (btrim(title) <> ''),
  constraint page_documents_status_valid check (
    status in ('draft', 'in_review', 'changes_requested', 'published', 'unpublished', 'archived')
  )
);

create index page_documents_slug_idx on public.page_documents (slug);
create index page_documents_status_idx on public.page_documents (status);

-- =============================================================================
-- 2. Organization & Team
-- =============================================================================

create table public.departments (
  id smallint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint departments_name_not_blank check (btrim(name) <> ''),
  constraint departments_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create index departments_display_order_idx on public.departments (display_order, name);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  department_id smallint not null references public.departments(id) on delete restrict,
  full_name text not null,
  position text not null,
  bio text,
  photo_url text,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_members_name_not_blank check (btrim(full_name) <> ''),
  constraint team_members_position_not_blank check (btrim(position) <> '')
);

create index team_members_department_order_idx on public.team_members (department_id, display_order);

-- =============================================================================
-- 3. Services
-- =============================================================================

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text not null,
  content jsonb not null default '[]'::jsonb,
  icon_url text,
  cta_text text,
  cta_url text,
  display_order int not null default 0,
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint services_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint services_title_not_blank check (btrim(title) <> ''),
  constraint services_summary_not_blank check (btrim(summary) <> ''),
  constraint services_status_valid check (
    status in ('draft', 'in_review', 'changes_requested', 'published', 'unpublished', 'archived')
  )
);

create index services_slug_idx on public.services (slug);
create index services_status_order_idx on public.services (status, display_order);

-- =============================================================================
-- 4. Clients & Social Proof
-- =============================================================================

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text not null,
  website_url text,
  display_permission boolean not null default true,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint clients_name_not_blank check (btrim(name) <> ''),
  constraint clients_logo_url_not_blank check (btrim(logo_url) <> '')
);

create index clients_order_idx on public.clients (display_order) where is_visible;

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  quote text not null,
  author_name text not null,
  author_role text not null,
  author_company text,
  consent_reference text,
  display_order int not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint testimonials_quote_not_blank check (btrim(quote) <> ''),
  constraint testimonials_author_name_not_blank check (btrim(author_name) <> ''),
  constraint testimonials_author_role_not_blank check (btrim(author_role) <> ''),
  constraint testimonials_status_valid check (
    status in ('draft', 'in_review', 'published', 'archived')
  )
);

create index testimonials_order_idx on public.testimonials (display_order) where status = 'published';

-- =============================================================================
-- 5. Careers (Job Openings)
-- =============================================================================

create table public.job_openings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  department_id smallint not null references public.departments(id) on delete restrict,
  location text not null default 'Remote',
  work_arrangement text not null default 'remote',
  employment_type text not null default 'full_time',
  summary text,
  description jsonb not null default '[]'::jsonb,
  external_apply_url text not null,
  close_date date,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint job_openings_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint job_openings_title_not_blank check (btrim(title) <> ''),
  constraint job_openings_work_arrangement check (work_arrangement in ('remote', 'hybrid', 'onsite')),
  constraint job_openings_employment_type check (employment_type in ('full_time', 'part_time', 'contract')),
  constraint job_openings_external_url check (external_apply_url ~* '^https?://'),
  constraint job_openings_status check (status in ('draft', 'published', 'archived'))
);

create index job_openings_slug_idx on public.job_openings (slug);
create index job_openings_status_idx on public.job_openings (status);

-- =============================================================================
-- 6. FAQs
-- =============================================================================

create table public.faq_categories (
  id smallint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  display_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint faq_categories_name_not_blank check (btrim(name) <> ''),
  constraint faq_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  faq_category_id smallint not null references public.faq_categories(id) on delete restrict,
  question text not null,
  answer text not null,
  display_order int not null default 0,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint faqs_question_not_blank check (btrim(question) <> ''),
  constraint faqs_answer_not_blank check (btrim(answer) <> ''),
  constraint faqs_status_valid check (status in ('draft', 'published', 'archived'))
);

create index faqs_category_order_idx on public.faqs (faq_category_id, display_order);

-- =============================================================================
-- 7. Articles, Categories & Tags
-- =============================================================================

create table public.authors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  full_name text not null,
  bio text,
  avatar_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint authors_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint authors_name_not_blank check (btrim(full_name) <> '')
);

create table public.article_categories (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint article_categories_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint article_categories_name_not_blank check (btrim(name) <> '')
);

create table public.article_tags (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint article_tags_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint article_tags_name_not_blank check (btrim(name) <> '')
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  author_id uuid references public.authors(id) on delete set null,
  excerpt text not null,
  content jsonb not null default '[]'::jsonb,
  cover_image_url text,
  reading_time_minutes smallint not null default 3,
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  published_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz,
  constraint articles_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  constraint articles_title_not_blank check (btrim(title) <> ''),
  constraint articles_excerpt_not_blank check (btrim(excerpt) <> ''),
  constraint articles_reading_time check (reading_time_minutes > 0),
  constraint articles_status_valid check (
    status in ('draft', 'in_review', 'changes_requested', 'published', 'unpublished', 'archived')
  )
);

create index articles_slug_idx on public.articles (slug);
create index articles_published_date_idx on public.articles (published_at desc) where status = 'published';

create table public.article_category_mappings (
  article_id uuid not null references public.articles(id) on delete cascade,
  category_id smallint not null references public.article_categories(id) on delete cascade,
  primary key (article_id, category_id)
);

create table public.article_tag_mappings (
  article_id uuid not null references public.articles(id) on delete cascade,
  tag_id smallint not null references public.article_tags(id) on delete cascade,
  primary key (article_id, tag_id)
);

-- =============================================================================
-- 8. Governance, Navigation & Settings
-- =============================================================================

create table public.site_settings (
  setting_key text primary key,
  setting_value jsonb not null,
  description text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint site_settings_key_format check (setting_key ~ '^[a-z0-9_.]+$')
);

create table public.navigation_items (
  id smallint generated always as identity primary key,
  location text not null,
  label text not null,
  url text not null,
  parent_id smallint references public.navigation_items(id) on delete cascade,
  display_order int not null default 0,
  is_visible boolean not null default true,
  constraint navigation_location_valid check (location in ('header', 'footer', 'mobile')),
  constraint navigation_label_not_blank check (btrim(label) <> '')
);

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  source_path text not null unique,
  destination_path text not null,
  status_code smallint not null default 301,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  constraint redirects_source_format check (source_path ~ '^/[a-zA-Z0-9/_-]*$'),
  constraint redirects_code_valid check (status_code in (301, 302, 307, 308))
);

-- =============================================================================
-- 9. Search Documents (PostgreSQL Full-Text Search)
-- =============================================================================

create table public.search_documents (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id text not null,
  title text not null,
  excerpt text,
  url_path text not null,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(excerpt, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  constraint search_entity_type check (
    entity_type in ('article', 'service', 'faq', 'job_opening', 'page_document')
  ),
  unique (entity_type, entity_id)
);

create index search_documents_vector_idx on public.search_documents using gin (search_vector);

-- =============================================================================
-- 10. Inquiries, Newsletter & Operations
-- =============================================================================

create table public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'new',
  ip_hash text not null,
  assigned_to uuid references auth.users(id) on delete set null,
  submitted_at timestamptz not null default now(),
  retention_expires_at timestamptz not null default (now() + interval '12 months'),
  constraint inquiries_name_len check (length(full_name) between 2 and 100),
  constraint inquiries_email_valid check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  constraint inquiries_subject_len check (length(subject) between 2 and 120),
  constraint inquiries_message_len check (length(message) between 20 and 5000),
  constraint inquiries_status check (status in ('new', 'read', 'replied', 'archived', 'spam_suspected'))
);

create index contact_inquiries_status_date_idx on public.contact_inquiries (status, submitted_at desc);
create index contact_inquiries_retention_idx on public.contact_inquiries (retention_expires_at);

create table public.inquiry_events (
  id bigint generated always as identity primary key,
  inquiry_id uuid not null references public.contact_inquiries(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint inquiry_events_type check (event_type in ('created', 'status_change', 'assignment', 'note_added'))
);

create index inquiry_events_inquiry_idx on public.inquiry_events (inquiry_id, created_at desc);

create table public.newsletter_subscriptions (
  id uuid primary key default gen_random_uuid(),
  email_normalized text not null unique,
  status text not null default 'pending_confirmation',
  confirmation_token_hash text,
  confirmation_sent_at timestamptz not null default now(),
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  consent_version text not null default '1.0',
  consent_source text not null default 'footer_form',
  created_at timestamptz not null default now(),
  constraint newsletter_email_normalized check (email_normalized = lower(trim(email_normalized))),
  constraint newsletter_status check (status in ('pending_confirmation', 'confirmed', 'unsubscribed'))
);

create table public.notification_outbox (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text not null unique,
  recipient text not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  attempts smallint not null default 0,
  next_retry_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint notification_outbox_attempts check (attempts >= 0),
  constraint notification_outbox_status check (status in ('queued', 'sending', 'delivered', 'failed', 'abandoned'))
);

create index notification_outbox_retry_idx on public.notification_outbox (status, next_retry_at) where status in ('queued', 'sending');

-- =============================================================================
-- 11. Explicit Grants (Required because auto_expose_new_tables = false)
-- =============================================================================

grant select on
  public.page_documents,
  public.departments,
  public.team_members,
  public.services,
  public.clients,
  public.testimonials,
  public.job_openings,
  public.faq_categories,
  public.faqs,
  public.authors,
  public.article_categories,
  public.article_tags,
  public.articles,
  public.article_category_mappings,
  public.article_tag_mappings,
  public.site_settings,
  public.navigation_items,
  public.redirects,
  public.search_documents
to anon, authenticated;

grant insert, update, delete on
  public.page_documents,
  public.departments,
  public.team_members,
  public.services,
  public.clients,
  public.testimonials,
  public.job_openings,
  public.faq_categories,
  public.faqs,
  public.authors,
  public.article_categories,
  public.article_tags,
  public.articles,
  public.article_category_mappings,
  public.article_tag_mappings,
  public.site_settings,
  public.navigation_items,
  public.redirects,
  public.search_documents,
  public.contact_inquiries,
  public.inquiry_events,
  public.newsletter_subscriptions,
  public.notification_outbox
to authenticated;

grant select on
  public.contact_inquiries,
  public.inquiry_events,
  public.newsletter_subscriptions,
  public.notification_outbox
to authenticated;

-- =============================================================================
-- 12. Row Level Security (RLS) Enablement & Policies
-- =============================================================================

alter table public.page_documents enable row level security;
alter table public.departments enable row level security;
alter table public.team_members enable row level security;
alter table public.services enable row level security;
alter table public.clients enable row level security;
alter table public.testimonials enable row level security;
alter table public.job_openings enable row level security;
alter table public.faq_categories enable row level security;
alter table public.faqs enable row level security;
alter table public.authors enable row level security;
alter table public.article_categories enable row level security;
alter table public.article_tags enable row level security;
alter table public.articles enable row level security;
alter table public.article_category_mappings enable row level security;
alter table public.article_tag_mappings enable row level security;
alter table public.site_settings enable row level security;
alter table public.navigation_items enable row level security;
alter table public.redirects enable row level security;
alter table public.search_documents enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.inquiry_events enable row level security;
alter table public.newsletter_subscriptions enable row level security;
alter table public.notification_outbox enable row level security;

-- Public read policies (published / active only)
create policy page_documents_public_select on public.page_documents
  for select using (status = 'published' or private.has_permission('content.view'));

create policy departments_public_select on public.departments
  for select using (is_active or private.has_permission('content.view'));

create policy team_members_public_select on public.team_members
  for select using (is_active or private.has_permission('content.view'));

create policy services_public_select on public.services
  for select using (status = 'published' or private.has_permission('content.view'));

create policy clients_public_select on public.clients
  for select using (is_visible or private.has_permission('content.view'));

create policy testimonials_public_select on public.testimonials
  for select using (status = 'published' or private.has_permission('content.view'));

create policy job_openings_public_select on public.job_openings
  for select using (status = 'published' or private.has_permission('content.view'));

create policy faq_categories_public_select on public.faq_categories
  for select using (is_active or private.has_permission('content.view'));

create policy faqs_public_select on public.faqs
  for select using (status = 'published' or private.has_permission('content.view'));

create policy authors_public_select on public.authors
  for select using (is_active or private.has_permission('content.view'));

create policy article_categories_public_select on public.article_categories
  for select using (is_active or private.has_permission('content.view'));

create policy article_tags_public_select on public.article_tags
  for select using (is_active or private.has_permission('content.view'));

create policy articles_public_select on public.articles
  for select using (status = 'published' or private.has_permission('content.view'));

create policy article_category_mappings_public_select on public.article_category_mappings
  for select using (true);

create policy article_tag_mappings_public_select on public.article_tag_mappings
  for select using (true);

create policy site_settings_public_select on public.site_settings
  for select using (true);

create policy navigation_items_public_select on public.navigation_items
  for select using (is_visible or private.has_permission('content.view'));

create policy redirects_public_select on public.redirects
  for select using (is_active or private.has_permission('settings.manage'));

create policy search_documents_public_select on public.search_documents
  for select using (true);

-- Admin Mutation Policies
-- Content draft writes
create policy page_documents_admin_modify on public.page_documents
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy departments_admin_modify on public.departments
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy team_members_admin_modify on public.team_members
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy services_admin_modify on public.services
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy clients_admin_modify on public.clients
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy testimonials_admin_modify on public.testimonials
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy job_openings_admin_modify on public.job_openings
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy faq_categories_admin_modify on public.faq_categories
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy faqs_admin_modify on public.faqs
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy authors_admin_modify on public.authors
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy article_categories_admin_modify on public.article_categories
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy article_tags_admin_modify on public.article_tags
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy articles_admin_modify on public.articles
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy article_category_mappings_admin_modify on public.article_category_mappings
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy article_tag_mappings_admin_modify on public.article_tag_mappings
  for all to authenticated
  using (private.has_permission('content.draft.write'))
  with check (private.has_permission('content.draft.write'));

create policy search_documents_admin_modify on public.search_documents
  for all to authenticated
  using (private.has_permission('content.publish'))
  with check (private.has_permission('content.publish'));

-- Operational / Settings
create policy site_settings_admin_modify on public.site_settings
  for all to authenticated
  using (private.has_permission('settings.manage'))
  with check (private.has_permission('settings.manage'));

create policy navigation_items_admin_modify on public.navigation_items
  for all to authenticated
  using (private.has_permission('settings.manage'))
  with check (private.has_permission('settings.manage'));

create policy redirects_admin_modify on public.redirects
  for all to authenticated
  using (private.has_permission('settings.manage'))
  with check (private.has_permission('settings.manage'));

-- Inquiries RLS
create policy contact_inquiries_select on public.contact_inquiries
  for select to authenticated
  using (private.has_permission('inquiries.view'));

create policy contact_inquiries_update on public.contact_inquiries
  for update to authenticated
  using (private.has_permission('inquiries.manage'))
  with check (private.has_permission('inquiries.manage'));

create policy inquiry_events_select on public.inquiry_events
  for select to authenticated
  using (private.has_permission('inquiries.view'));

create policy inquiry_events_insert on public.inquiry_events
  for insert to authenticated
  with check (private.has_permission('inquiries.manage'));

-- Newsletter Subscribers RLS
create policy newsletter_subscriptions_select on public.newsletter_subscriptions
  for select to authenticated
  using (private.has_permission('subscribers.view'));

-- Notification Outbox RLS
create policy notification_outbox_select on public.notification_outbox
  for select to authenticated
  using (private.has_permission('settings.manage'));

