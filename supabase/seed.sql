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

insert into public.team_members (department_id, full_name, position, bio, photo_url, display_order, is_active)
select d.id, 'Armi Escamilla', 'Managing Director & Founder', 'Experienced global talent strategist specializing in enterprise cross-border operations and high-trust workforce design.', '/images/team/armi-escamilla.jpg', 1, true
from public.departments d where d.slug = 'executive'
and not exists (select 1 from public.team_members where full_name = 'Armi Escamilla');

insert into public.team_members (department_id, full_name, position, bio, photo_url, display_order, is_active)
select d.id, 'Marcus Vance', 'VP of Engineering', 'Leads software architecture, remote development infrastructure, and technical talent assessment.', '/images/team/marcus-vance.jpg', 2, true
from public.departments d where d.slug = 'engineering'
and not exists (select 1 from public.team_members where full_name = 'Marcus Vance');

insert into public.team_members (department_id, full_name, position, bio, photo_url, display_order, is_active)
select d.id, 'Elena Rostova', 'Head of Talent Solutions', 'Oversees recruitment frameworks, behavioral vetting, and international talent matching.', '/images/team/elena-rostova.jpg', 3, true
from public.departments d where d.slug = 'talent-solutions'
and not exists (select 1 from public.team_members where full_name = 'Elena Rostova');

insert into public.team_members (department_id, full_name, position, bio, photo_url, display_order, is_active)
select d.id, 'David Chen', 'Operations & Client Success Lead', 'Ensures smooth cross-timezone workflows, client communication cadence, and SLA compliance.', '/images/team/david-chen.jpg', 4, true
from public.departments d where d.slug = 'operations'
and not exists (select 1 from public.team_members where full_name = 'David Chen');

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
-- 4. Clients & Testimonials
-- =============================================================================

insert into public.clients (name, logo_url, website_url, display_permission, display_order, is_visible)
select 'Apex FinTech Solutions', '/images/clients/apex.svg', 'https://example.com/apex', true, 1, true
where not exists (select 1 from public.clients where name = 'Apex FinTech Solutions');

insert into public.clients (name, logo_url, website_url, display_permission, display_order, is_visible)
select 'CloudScale Global', '/images/clients/cloudscale.svg', 'https://example.com/cloudscale', true, 2, true
where not exists (select 1 from public.clients where name = 'CloudScale Global');

insert into public.clients (name, logo_url, website_url, display_permission, display_order, is_visible)
select 'Pacific Media Group', '/images/clients/pacific-media.svg', 'https://example.com/pacific-media', true, 3, true
where not exists (select 1 from public.clients where name = 'Pacific Media Group');

insert into public.clients (name, logo_url, website_url, display_permission, display_order, is_visible)
select 'Nexus Logistics', '/images/clients/nexus.svg', 'https://example.com/nexus', true, 4, true
where not exists (select 1 from public.clients where name = 'Nexus Logistics');

insert into public.clients (name, logo_url, website_url, display_permission, display_order, is_visible)
select 'Horizon Health Innovations', '/images/clients/horizon.svg', 'https://example.com/horizon', true, 5, true
where not exists (select 1 from public.clients where name = 'Horizon Health Innovations');

insert into public.clients (name, logo_url, website_url, display_permission, display_order, is_visible)
select 'Vantage Software', '/images/clients/vantage.svg', 'https://example.com/vantage', true, 6, true
where not exists (select 1 from public.clients where name = 'Vantage Software');

insert into public.testimonials (quote, author_name, author_role, author_company, consent_reference, display_order, status)
select
  'Outsourced Pro Global transformed our engineering delivery. Their dedicated team integrated into our sprint cycle from week one with zero friction.',
  'Julian Vance',
  'VP of Engineering',
  'Apex FinTech Solutions',
  'OPG-CR-2026-01',
  1,
  'published'
where not exists (select 1 from public.testimonials where author_company = 'Apex FinTech Solutions');

insert into public.testimonials (quote, author_name, author_role, author_company, consent_reference, display_order, status)
select
  'The quality of talent and communication transparency set OPG far apart from traditional offshore agencies. We scaled our operations 3x with complete confidence.',
  'Samantha Wu',
  'Chief Operations Officer',
  'CloudScale Global',
  'OPG-CR-2026-02',
  2,
  'published'
where not exists (select 1 from public.testimonials where author_company = 'CloudScale Global');

insert into public.testimonials (quote, author_name, author_role, author_company, consent_reference, display_order, status)
select
  'Partnering with OPG provided us with vetted domain specialists who took true ownership of key workstreams. An indispensable extension of our leadership team.',
  'Liam Gallagher',
  'Director of People & Talent',
  'Pacific Media Group',
  'OPG-CR-2026-03',
  3,
  'published'
where not exists (select 1 from public.testimonials where author_company = 'Pacific Media Group');

-- =============================================================================
-- 5. FAQs
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
-- =============================================================================
-- 6. Articles, Authors, Categories & Tags
-- =============================================================================

insert into public.authors (slug, full_name, bio, avatar_url, is_active)
values
  ('elena-rostova', 'Elena Rostova', 'VP of Global People & Talent Solutions at OPG, specializing in international workforce scaling.', '/images/authors/elena.jpg', true),
  ('marcus-chen', 'Marcus Chen', 'Head of Technology Delivery at OPG, advising Fortune 500 enterprises on distributed engineering architectures.', '/images/authors/marcus.jpg', true)
on conflict (slug) do update
set full_name = excluded.full_name,
    bio = excluded.bio,
    avatar_url = excluded.avatar_url;

insert into public.article_categories (slug, name, description, is_active)
values
  ('talent-strategy', 'Talent Strategy', 'Insights and playbooks for scaling remote and cross-border teams.', true),
  ('engineering-delivery', 'Engineering Delivery', 'Best practices in software architecture, velocity, and technical team pods.', true),
  ('global-operations', 'Global Operations', 'Regulatory compliance, operational excellence, and enterprise risk management.', true)
on conflict (slug) do update
set name = excluded.name,
    description = excluded.description;

insert into public.article_tags (slug, name, is_active)
values
  ('remote-work', 'Remote Work', true),
  ('leadership', 'Leadership', true),
  ('cloud', 'Cloud Architecture', true),
  ('scaling', 'Scaling Teams', true)
on conflict (slug) do update
set name = excluded.name;

insert into public.articles (slug, title, author_id, excerpt, content, cover_image_url, reading_time_minutes, status, published_at)
select
  'building-high-performing-distributed-teams',
  'Building High-Performing Distributed Teams: Principles for Enterprise Leaders',
  a.id,
  'How global enterprises bridge cultural, timezone, and communication gaps to build remote talent hubs that outperform local co-located teams.',
  '[
    {"type": "paragraph", "content": "Modern distributed teams are no longer just a cost-saving measure; they have become the primary strategic advantage for agile enterprises. When executed with intentional communication cadences and clear ownership boundaries, cross-border talent pods consistently exceed local delivery targets."},
    {"type": "heading", "content": "The Three Pillars of Distributed Velocity"},
    {"type": "paragraph", "content": "1. Asynchronous-First Documentation: Reducing reliance on live sync meetings preserves deep work time across timezones.\n2. Transparent Performance Metrics: Focusing strictly on business deliverables rather than logged hours creates mutual trust.\n3. Integrated Team Culture: Treating remote team members as core colleagues rather than transactional third-party contractors."}
  ]'::jsonb,
  '/images/articles/distributed-teams.jpg',
  5,
  'published',
  now() - interval '2 days'
from public.authors a
where a.slug = 'elena-rostova'
and not exists (select 1 from public.articles where slug = 'building-high-performing-distributed-teams');

insert into public.articles (slug, title, author_id, excerpt, content, cover_image_url, reading_time_minutes, status, published_at)
select
  'engineering-velocity-through-dedicated-pods',
  'Accelerating Engineering Velocity Through Dedicated Technical Pods',
  a.id,
  'Why dedicated offshore engineering pods outperform traditional freelance contracting, ensuring code quality, security compliance, and sprint continuity.',
  '[
    {"type": "paragraph", "content": "Software engineering teams face relentless pressure to deliver features faster without sacrificing security or scalability. Dedicated pods provide pre-aligned engineering talent that plugs straight into your git workflows and CI/CD pipelines."},
    {"type": "heading", "content": "Eliminating Sprint Context Switching"},
    {"type": "paragraph", "content": "By embedding full-stack engineers, QA analysts, and DevOps specialists into dedicated long-term squads, domain knowledge accumulates continuously, leading to dramatic reductions in cycle time and bug regressions."}
  ]'::jsonb,
  '/images/articles/engineering-velocity.jpg',
  6,
  'published',
  now() - interval '5 days'
from public.authors a
where a.slug = 'marcus-chen'
and not exists (select 1 from public.articles where slug = 'engineering-velocity-through-dedicated-pods');

insert into public.articles (slug, title, author_id, excerpt, content, cover_image_url, reading_time_minutes, status, published_at)
select
  'navigating-global-talent-compliance-2026',
  'Navigating Global Talent Compliance in 2026',
  a.id,
  'Essential guidance for managing legal, IP protection, and data governance obligations across international jurisdictions.',
  '[
    {"type": "paragraph", "content": "As international labor regulations evolve rapidly, enterprise organizations must protect their intellectual property, maintain strict ISO/SOC compliance, and avoid misclassification hazards."},
    {"type": "heading", "content": "Securing IP and Work Product"},
    {"type": "paragraph", "content": "Robust international agreements ensure immediate and irrevocable assignment of all work product and IP to the client enterprise, backed by local corporate legal entities in each delivery jurisdiction."}
  ]'::jsonb,
  '/images/articles/talent-compliance.jpg',
  4,
  'published',
  now() - interval '10 days'
from public.authors a
where a.slug = 'elena-rostova'
and not exists (select 1 from public.articles where slug = 'navigating-global-talent-compliance-2026');

-- Article Mappings
insert into public.article_category_mappings (article_id, category_id)
select art.id, cat.id
from public.articles art
cross join public.article_categories cat
where art.slug = 'building-high-performing-distributed-teams' and cat.slug = 'talent-strategy'
on conflict do nothing;

insert into public.article_category_mappings (article_id, category_id)
select art.id, cat.id
from public.articles art
cross join public.article_categories cat
where art.slug = 'engineering-velocity-through-dedicated-pods' and cat.slug = 'engineering-delivery'
on conflict do nothing;

insert into public.article_category_mappings (article_id, category_id)
select art.id, cat.id
from public.articles art
cross join public.article_categories cat
where art.slug = 'navigating-global-talent-compliance-2026' and cat.slug = 'global-operations'
on conflict do nothing;

insert into public.article_tag_mappings (article_id, tag_id)
select art.id, tag.id
from public.articles art
cross join public.article_tags tag
where art.slug = 'building-high-performing-distributed-teams' and tag.slug in ('remote-work', 'leadership')
on conflict do nothing;

insert into public.article_tag_mappings (article_id, tag_id)
select art.id, tag.id
from public.articles art
cross join public.article_tags tag
where art.slug = 'engineering-velocity-through-dedicated-pods' and tag.slug in ('scaling', 'cloud')
on conflict do nothing;

insert into public.article_tag_mappings (article_id, tag_id)
select art.id, tag.id
from public.articles art
cross join public.article_tags tag
where art.slug = 'navigating-global-talent-compliance-2026' and tag.slug in ('leadership', 'remote-work')
on conflict do nothing;

-- =============================================================================
-- 7. Careers (Job Openings)
-- =============================================================================

insert into public.job_openings (
  slug,
  title,
  department_id,
  location,
  work_arrangement,
  employment_type,
  summary,
  description,
  external_apply_url,
  status,
  published_at
)
select
  'senior-full-stack-engineer',
  'Senior Full Stack Engineer (TypeScript & Cloud)',
  d.id,
  'Remote (Global)',
  'remote',
  'full_time',
  'Lead high-impact web application development and cloud backend services for enterprise client solutions.',
  '[
    {"type": "heading", "content": "The Opportunity"},
    {"type": "paragraph", "content": "We are looking for an experienced Senior Full Stack Engineer proficient in Next.js, Node.js, TypeScript, and modern relational databases to build mission-critical enterprise platforms."},
    {"type": "heading", "content": "Requirements"},
    {"type": "paragraph", "content": "- 5+ years building scalable web applications with React/Next.js and TypeScript.\n- Deep understanding of SQL, PostgreSQL, REST/GraphQL APIs, and cloud architectures.\n- Strong communication skills and experience collaborating across global timezones."}
  ]'::jsonb,
  'https://outsourcedproglobal.applytojob.com',
  'published',
  now() - interval '3 days'
from public.departments d
where d.slug = 'engineering'
and not exists (select 1 from public.job_openings where slug = 'senior-full-stack-engineer');

insert into public.job_openings (
  slug,
  title,
  department_id,
  location,
  work_arrangement,
  employment_type,
  summary,
  description,
  external_apply_url,
  status,
  published_at
)
select
  'technical-recruitment-specialist',
  'Technical Talent Acquisition Specialist',
  d.id,
  'Remote (Asia-Pacific)',
  'remote',
  'full_time',
  'Identify, screen, and place top-tier engineering and digital talent with enterprise client teams.',
  '[
    {"type": "heading", "content": "The Opportunity"},
    {"type": "paragraph", "content": "Join our fast-growing Talent Solutions team to source, evaluate, and match exceptional professionals with global technology companies."},
    {"type": "heading", "content": "Requirements"},
    {"type": "paragraph", "content": "- 3+ years experience in technical talent acquisition or recruitment consultancy.\n- Proven track record placing software engineers, architects, and product specialists.\n- Experience in candidate relationship management and competency assessment."}
  ]'::jsonb,
  'https://outsourcedproglobal.applytojob.com',
  'published',
  now() - interval '7 days'
from public.departments d
where d.slug = 'talent-solutions'
and not exists (select 1 from public.job_openings where slug = 'technical-recruitment-specialist');

insert into public.job_openings (
  slug,
  title,
  department_id,
  location,
  work_arrangement,
  employment_type,
  summary,
  description,
  external_apply_url,
  status,
  published_at
)
select
  'operations-delivery-manager',
  'Client Operations Delivery Manager',
  d.id,
  'Tokyo / Remote',
  'hybrid',
  'full_time',
  'Drive operational excellence, client satisfaction, and quality standards across cross-border talent engagements.',
  '[
    {"type": "heading", "content": "The Opportunity"},
    {"type": "paragraph", "content": "As Operations Delivery Manager, you will oversee client workflows, monitor SLA delivery metrics, and foster high-trust client relationships."},
    {"type": "heading", "content": "Requirements"},
    {"type": "paragraph", "content": "- 4+ years managing operational client delivery or account management.\n- Strong analytical mindset, process optimization skills, and executive communication.\n- Fluency in English; Japanese proficiency is advantageous."}
  ]'::jsonb,
  'https://outsourcedproglobal.applytojob.com',
  'published',
  now() - interval '12 days'
from public.departments d
where d.slug = 'operations'
and not exists (select 1 from public.job_openings where slug = 'operations-delivery-manager');

-- =============================================================================
-- 8. Search Documents Index
-- =============================================================================

insert into public.search_documents (entity_type, entity_id, title, excerpt, url_path)
select
  'page_document',
  slug,
  title,
  summary,
  case when slug = 'home' then '/' else '/' || slug end
from public.page_documents
where status = 'published'
on conflict (entity_type, entity_id) do update
set title = excluded.title,
    excerpt = excluded.excerpt,
    url_path = excluded.url_path;

insert into public.search_documents (entity_type, entity_id, title, excerpt, url_path)
select
  'service',
  slug,
  title,
  summary,
  '/services/' || slug
from public.services
where status = 'published'
on conflict (entity_type, entity_id) do update
set title = excluded.title,
    excerpt = excluded.excerpt,
    url_path = excluded.url_path;

insert into public.search_documents (entity_type, entity_id, title, excerpt, url_path)
select
  'faq',
  id::text,
  question,
  answer,
  '/faqs'
from public.faqs
where status = 'published'
on conflict (entity_type, entity_id) do update
set title = excluded.title,
    excerpt = excluded.excerpt,
    url_path = excluded.url_path;

insert into public.search_documents (entity_type, entity_id, title, excerpt, url_path)
select
  'article',
  slug,
  title,
  excerpt,
  '/articles/' || slug
from public.articles
where status = 'published'
on conflict (entity_type, entity_id) do update
set title = excluded.title,
    excerpt = excluded.excerpt,
    url_path = excluded.url_path;

insert into public.search_documents (entity_type, entity_id, title, excerpt, url_path)
select
  'job_opening',
  slug,
  title,
  summary,
  '/careers/' || slug
from public.job_openings
where status = 'published'
on conflict (entity_type, entity_id) do update
set title = excluded.title,
    excerpt = excluded.excerpt,
    url_path = excluded.url_path;

