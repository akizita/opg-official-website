-- Representative, non-personal seed data for development and staging environments.
-- Never store production personal inquiries, passwords, or customer data here.

-- =============================================================================
-- 1. Departments
-- =============================================================================

insert into public.departments (name, slug, display_order, is_active)
values
  ('Executive Leadership', 'executive', 1, true),
  ('Technology & Engineering', 'engineering', 2, true),
  ('Talent Solutions & Recruitment', 'talent-solutions', 3, true),
  ('Operations & Client Success', 'operations', 4, true)
on conflict (slug) do update
set name = excluded.name,
    display_order = excluded.display_order,
    is_active = excluded.is_active;

-- =============================================================================
-- 2. Page Documents
-- =============================================================================

insert into public.page_documents (slug, title, summary, content, status, version, published_at)
values
  (
    'mission-and-vision',
    'Mission & Vision',
    'Empowering global organizations with exceptional talent, measurable delivery, and enduring human partnerships.',
    '[
      {"type": "heading", "level": 2, "content": "Our Mission"},
      {"type": "paragraph", "content": "At Outsourced Pro Global, our mission is to connect ambitious enterprises with world-class talent, bridging international opportunities through integrity, transparent partnership, and operational excellence."},
      {"type": "heading", "level": 2, "content": "Our Vision"},
      {"type": "paragraph", "content": "We envision a global workplace where borders do not limit capability, where companies scale seamlessly with dedicated teams, and where talent flourishes in high-trust, rewarding roles."},
      {"type": "callout", "variant": "info", "content": "Built on values of transparency, accountability, and sustainable partnership across all global client engagements."}
    ]'::jsonb,
    'published',
    1,
    now()
  ),
  (
    'home',
    'Global Talent Solutions with a Human Point of View',
    'We connect forward-thinking organizations with dedicated, high-performing global teams.',
    '[
      {"type": "paragraph", "content": "Outsourced Pro Global provides specialized talent acquisition, remote team management, and global staffing solutions designed to scale your operations with confidence."}
    ]'::jsonb,
    'published',
    1,
    now()
  ),
  (
    'about',
    'About Outsourced Pro Global',
    'Delivering elite remote team capabilities and global talent solutions across industries.',
    '[
      {"type": "heading", "level": 2, "content": "Who We Are"},
      {"type": "paragraph", "content": "Outsourced Pro Global is a premier international talent solutions partner. We combine deep recruitment expertise with dedicated account support to deliver talent that integrates directly into your business culture."}
    ]'::jsonb,
    'published',
    1,
    now()
  ),
  (
    'careers',
    'Build Your Career with Global Leaders',
    'Explore rewarding roles with international companies and grow your professional journey.',
    '[
      {"type": "heading", "level": 2, "content": "Why Join OPG"},
      {"type": "paragraph", "content": "We connect exceptional professionals with dynamic global organizations offering competitive compensation, remote flexibility, and comprehensive career development."}
    ]'::jsonb,
    'published',
    1,
    now()
  )
on conflict (slug) do update
set title = excluded.title,
    summary = excluded.summary,
    content = excluded.content,
    status = excluded.status;

-- =============================================================================
-- 3. Services
-- =============================================================================

insert into public.services (slug, title, summary, content, icon_url, cta_text, cta_url, display_order, status, published_at)
values
  (
    'dedicated-teams',
    'Dedicated Remote Teams',
    'Full-time, fully integrated professionals managed to your standard and workflows.',
    '[
      {"type": "paragraph", "content": "Scale your departmental capacity without local recruitment overhead. Our dedicated talent integrates seamlessly into your company culture and daily communication tools."}
    ]'::jsonb,
    '/icons/team.svg',
    'Inquire about teams',
    '/contact',
    1,
    'published',
    now()
  ),
  (
    'talent-augmentation',
    'Staff Augmentation',
    'Specialized technical, operational, and domain experts ready to accelerate project delivery.',
    '[
      {"type": "paragraph", "content": "Rapidly fill critical capability gaps with pre-vetted specialists in engineering, operations, finance, and customer experience."}
    ]'::jsonb,
    '/icons/augment.svg',
    'Find specialists',
    '/contact',
    2,
    'published',
    now()
  ),
  (
    'managed-operations',
    'Managed Operations',
    'End-to-end management of offshore workflows with dedicated quality assurance and reporting.',
    '[
      {"type": "paragraph", "content": "Complete operational oversight designed to optimize efficiency, maintain data security, and deliver measurable business outcomes."}
    ]'::jsonb,
    '/icons/operations.svg',
    'Explore managed operations',
    '/contact',
    3,
    'published',
    now()
  )
on conflict (slug) do update
set title = excluded.title,
    summary = excluded.summary,
    content = excluded.content,
    display_order = excluded.display_order,
    status = excluded.status;

-- =============================================================================
-- 4. FAQs
-- =============================================================================

insert into public.faq_categories (name, slug, display_order, is_active)
values
  ('Engagement & Hiring', 'engagement', 1, true),
  ('Security & Compliance', 'security', 2, true)
on conflict (slug) do update
set name = excluded.name,
    display_order = excluded.display_order;

insert into public.faqs (faq_category_id, question, answer, display_order, status)
select
  fc.id,
  'How quickly can we onboard a dedicated talent team?',
  'Depending on specialized requirements, standard roles are typically shortlisted within 5 to 10 business days and onboarded within 2 to 3 weeks.',
  1,
  'published'
from public.faq_categories fc
where fc.slug = 'engagement'
and not exists (
  select 1 from public.faqs where question = 'How quickly can we onboard a dedicated talent team?'
);

insert into public.faqs (faq_category_id, question, answer, display_order, status)
select
  fc.id,
  'How does OPG protect client data and confidentiality?',
  'All team members execute strict non-disclosure agreements (NDAs) and operate within client-approved secure environments, enforcing enterprise device and access security protocols.',
  2,
  'published'
from public.faq_categories fc
where fc.slug = 'security'
and not exists (
  select 1 from public.faqs where question = 'How does OPG protect client data and confidentiality?'
);

-- =============================================================================
-- 5. Site Settings & Navigation
-- =============================================================================

insert into public.site_settings (setting_key, setting_value, description)
values
  (
    'site.identity',
    '{"name": "Outsourced Pro Global", "tagline": "Global talent solutions with a human point of view."}'::jsonb,
    'Site name and primary brand tagline'
  ),
  (
    'site.contact',
    '{"email": "contact@opglobal.com.hk", "domain": "opglobal.com.hk"}'::jsonb,
    'Official contact details'
  )
on conflict (setting_key) do update
set setting_value = excluded.setting_value,
    description = excluded.description;

insert into public.navigation_items (location, label, url, display_order, is_visible)
values
  ('header', 'About', '/about', 1, true),
  ('header', 'Mission & Vision', '/mission-and-vision', 2, true),
  ('header', 'Services', '/services', 3, true),
  ('header', 'Clients', '/clients', 4, true),
  ('header', 'Careers', '/careers', 5, true),
  ('header', 'Articles', '/articles', 6, true),
  ('header', 'FAQs', '/faqs', 7, true),
  ('footer', 'Privacy Notice', '/privacy', 1, true),
  ('footer', 'Cookie Notice', '/cookies', 2, true),
  ('footer', 'Terms of Use', '/terms', 3, true)
on conflict do nothing;
