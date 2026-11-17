-- Migration: Seed default client partners and executive testimonials displayed on the public website
-- Ensures admin management (/admin/testimonials?tab=client) has immediate visibility and operation over live client endorsements

insert into public.clients (id, name, logo_url, website_url, display_permission, display_order, is_visible)
values
  ('c1100000-0000-4000-8000-000000000001', 'Northstar Labs', '/images/clients/northstar.svg', 'https://northstarlabs.example.com', true, 1, true),
  ('c1100000-0000-4000-8000-000000000002', 'Meridian Health', '/images/clients/meridian.svg', 'https://meridianhealth.example.com', true, 2, true),
  ('c1100000-0000-4000-8000-000000000003', 'Harborline Finance', '/images/clients/harborline.svg', 'https://harborlinefinance.example.com', true, 3, true),
  ('c1100000-0000-4000-8000-000000000004', 'Atlas Commerce', '/images/clients/atlas.svg', 'https://atlascommerce.example.com', true, 4, true),
  ('c1100000-0000-4000-8000-000000000005', 'Veridian Operations', '/images/clients/veridian.svg', 'https://veridianops.example.com', true, 5, true)
on conflict (id) do update set
  name = excluded.name,
  logo_url = excluded.logo_url,
  website_url = excluded.website_url,
  is_visible = excluded.is_visible;

insert into public.testimonials (id, client_id, author_company, headline, quote, author_name, author_role, photo_url, rating, status, display_order, consent_reference)
values
  (
    't1100000-0000-4000-8000-000000000001',
    'c1100000-0000-4000-8000-000000000001',
    'Northstar Labs',
    'Exceeded All Expectations on Velocity & Scale',
    'Outsource Pro Global integrated seamlessly into our GitHub and Jira workflows within two weeks. Their QA and full-stack engineering pod didn’t just execute sprint tickets—they overhauled our automated CI/CD pipeline, reducing release regression cycles by 65%. It feels like having our own senior in-house engineers down the hall.',
    'Marcus Vance',
    'VP of Engineering & Product Infrastructure',
    '/images/testimonial-marcus-vance.jpg',
    5,
    'published',
    1,
    'OPG-CR-2026-NL'
  ),
  (
    't1100000-0000-4000-8000-000000000002',
    'c1100000-0000-4000-8000-000000000002',
    'Meridian Health',
    'Uncompromised Clinical Compliance & 24/7 Care',
    'In digital health, empathy and compliance cannot be compromised. OPG built us a dedicated 24/7 clinical coordination pod that achieved a 99.8% SLA adherence rate and full HIPAA/Privacy compliance from month one. Our patients receive compassionate care within seconds, day or night.',
    'Dr. Eleanor Evans, MD',
    'Chief Medical & Operations Officer',
    '/images/testimonial-eleanor-evans.jpg',
    5,
    'published',
    2,
    'OPG-CR-2026-MH'
  ),
  (
    't1100000-0000-4000-8000-000000000003',
    'c1100000-0000-4000-8000-000000000003',
    'Harborline Finance',
    'Slashing Fintech OpEx & Model Backlog by 48%',
    'Finding mathematically rigorous fintech talent with SOC 2 compliance discipline is notoriously difficult. The specialized modeling pod OPG assembled for Harborline exceeded every technical benchmark, slashing our model reconciliation backlog and lowering our operational overhead by 48%.',
    'Alistair Finch, CFA',
    'Head of Quantitative Risk & Regulatory Systems',
    '/images/testimonial-alistair-finch.jpg',
    5,
    'published',
    3,
    'OPG-CR-2026-HF'
  ),
  (
    't1100000-0000-4000-8000-000000000004',
    'c1100000-0000-4000-8000-000000000004',
    'Atlas Commerce',
    'Flawless Peak Synchronization Across 14 Hubs',
    'When seasonal demand surges during Q4 peak events, OPG’s dedicated operations pod scales with us effortlessly. Their multi-lingual support and vendor reconciliation pods have eliminated order bottlenecks across 14 international fulfillment hubs with near-zero error rates.',
    'Elena Rostova',
    'Global Director of Supply Chain & E-Commerce Ops',
    '/images/testimonial-elena-rostova.jpg',
    5,
    'published',
    4,
    'OPG-CR-2026-AC'
  ),
  (
    't1100000-0000-4000-8000-000000000005',
    'c1100000-0000-4000-8000-000000000005',
    'Veridian Operations',
    'The Gold Standard in Remote Delivery & Insights',
    'OPG represents the gold standard in remote talent delivery. Their business intelligence pod engineered automated reporting pipelines that saved our executive team over 35 hours weekly in manual data assembly. The transparency, caliber, and proactive communication are unmatched.',
    'David Sterling',
    'Managing Director & Principal Consultant',
    '/images/testimonial-david-sterling.jpg',
    5,
    'published',
    5,
    'OPG-CR-2026-VO'
  )
on conflict (id) do update set
  headline = excluded.headline,
  quote = excluded.quote,
  author_name = excluded.author_name,
  author_role = excluded.author_role,
  photo_url = excluded.photo_url,
  rating = excluded.rating,
  status = excluded.status;
