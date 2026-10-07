import type { Article, ArticleCategory, ArticleTag, Author } from './articles'

const opgAuthor: Author = {
  id: 'opg-linkedin-publisher',
  slug: 'outsourced-pro-global',
  full_name: 'Outsourced Pro Global',
  role_title: 'Editorial Team',
  bio: 'Empowering businesses and connecting exceptional global talent.',
  avatar_url: null,
  is_active: true,
  created_at: '2026-07-15T05:00:03.000+00:00',
}

export const featuredArticleCategory: ArticleCategory = {
  id: -1,
  slug: 'people-and-culture',
  name: 'People & Culture',
  description: 'Stories about talent, growth, leadership, and life at OPG.',
  is_active: true,
}

const talentSpotlightTag: ArticleTag = {
  id: -1,
  slug: 'talent-spotlight',
  name: 'Talent Spotlight',
  is_active: true,
}

const lifeAtOpgTag: ArticleTag = {
  id: -2,
  slug: 'life-at-opg',
  name: 'Life at OPG',
  is_active: true,
}

export const featuredArticles: Article[] = [
  {
    id: 'linkedin-where-mistakes-become-milestone',
    slug: 'where-mistakes-become-milestone',
    title: 'Where Mistakes Become Milestone: A Journey into Talent Acquisition',
    author_id: opgAuthor.id,
    author: opgAuthor,
    categories: [featuredArticleCategory],
    tags: [talentSpotlightTag, lifeAtOpgTag],
    excerpt:
      'Allen’s journey from an uncertain internship to Talent Acquisition Specialist shows how feedback, support, and persistence can turn early mistakes into career milestones.',
    cover_image_url:
      'https://media.licdn.com/dms/image/v2/D5612AQFEB4WAHue5mw/article-cover_image-shrink_720_1280/B56aDRKAPiIAAQ-/0/1790215458496?e=2147483647&v=beta&t=aVEtF0yO_kXAtaknNAesrLaFj0ZdA0cLvXYMVZxwDUk',
    reading_time_minutes: 6,
    status: 'published',
    seo_title:
      'Where Mistakes Become Milestone: A Journey into Talent Acquisition',
    seo_description:
      'How an OPG internship, honest feedback, and a supportive team helped Allen build a meaningful career in Talent Acquisition.',
    source_url:
      'https://www.linkedin.com/pulse/where-mistakes-become-milestone-journey-talent-acquisition-t118e/',
    view_count: null,
    like_count: 10,
    comment_count: 0,
    created_by: null,
    updated_by: null,
    published_by: null,
    created_at: '2026-09-18T06:38:22.000+00:00',
    updated_at: '2026-09-24T02:04:30.000+00:00',
    published_at: '2026-09-18T06:38:22.000+00:00',
    content: [
      {
        type: 'paragraph',
        content:
          'Careers rarely follow a straight path, and sometimes the best opportunities start with uncertainty.',
      },
      {
        type: 'paragraph',
        content:
          'When Allen joined Outsourced Pro Global, she was not chasing a title. Exhausted from working onsite and trying to balance her career with motherhood, she stepped into an internship in Talent Acquisition, completely unaware of how much the role would shape her.',
      },
      {
        type: 'heading',
        level: 3,
        content: 'Accidental Passion: Beyond the Job Description',
      },
      {
        type: 'paragraph',
        content:
          'Working in Talent Acquisition was never part of Allen’s original career plan. At the time, she had grown tired of working onsite and was struggling to balance her career with motherhood. Instead of chasing a specific job title, she was searching for a remote opportunity that could offer a healthier balance between her professional and personal life.',
      },
      {
        type: 'paragraph',
        content:
          'When the opportunity to join Outsourced Pro Global as an intern came along, she decided to take the chance.',
      },
      {
        type: 'paragraph',
        content:
          'What Allen did not expect was how much the role would teach her. Every interview introduced her to a different story, background, and perspective. She gradually discovered that recruitment was far more than just filling open positions: it required listening closely, understanding unique candidate insights, and learning something new from every interaction. What began as a practical decision to work from home soon became a career she genuinely loved.',
      },
      {
        type: 'heading',
        level: 3,
        content: 'A Disastrous First Month: Receiving and Accepting Feedback',
      },
      {
        type: 'paragraph',
        content:
          'Her start, however, was far from smooth sailing. Allen candidly describes her initial weeks as a trial by fire, with interview scheduling proving to be her most challenging task due to the high level of coordination and accuracy required.',
      },
      {
        type: 'paragraph',
        content:
          'A scheduling error early on led to a one-on-one candid conversation with a hiring manager.',
      },
      {
        type: 'blockquote',
        content:
          "At first, I wasn't sure how to feel. Looking back, I realized the feedback came from a place of wanting me to improve. It helped me recognise my mistakes and prevented me from continuing the wrong process, which became an important learning experience.",
        citation: 'Allen',
      },
      {
        type: 'paragraph',
        content:
          'Rather than stepping back, she reached out for help and chose to rely on the people around her.',
      },
      {
        type: 'blockquote',
        content:
          'The Talent Acquisition Team played a huge role in encouraging me. Their guidance, patience, and support reminded me not to give up and motivated me to keep improving every day.',
        citation: 'Allen',
      },
      {
        type: 'heading',
        level: 3,
        content: 'From Efficiency to Effectiveness',
      },
      {
        type: 'paragraph',
        content:
          'When you have just been criticised, the natural instinct is often to put your head down and rush to fix things just to prove your worth. But as Allen found her footing, her mindset shifted from simply surviving the day to truly mastering her craft.',
      },
      {
        type: 'blockquote',
        content:
          'Your own mistakes can be costly, but someone else’s mistake can be a free lesson.',
        citation: 'Allen',
      },
      {
        type: 'paragraph',
        content:
          'Recognising that rushing often leads to avoidable errors, she learned that speed does not equal productivity. Today, she makes a point to slow down, double-check her details, and fully understand every task before moving forward. By choosing accuracy over speed, her confidence grew, allowing her to take full ownership of her projects and support the wider team.',
      },
      {
        type: 'heading',
        level: 3,
        content:
          'More than a Promotion: Proof that She Chose to Keep Moving Forward',
      },
      {
        type: 'paragraph',
        content:
          'When Allen reflects on her proudest career milestone, her promotion from intern to Talent Acquisition Specialist immediately stands out. She admits that she likes to brag about it a little, and for good reason. Not every internship becomes an opportunity to keep growing in the same field.',
      },
      {
        type: 'blockquote',
        content:
          'Becoming a Specialist changed my perspective on my career. It inspired me to continuously learn, take ownership of my work, and value integrity by keeping my commitments to candidates and communicating with honesty and transparency throughout the recruitment process.',
        citation: 'Allen',
      },
      {
        type: 'paragraph',
        content:
          'An intern who once felt overwhelmed by unfamiliar tasks had grown into someone trusted with greater responsibilities. Her promotion did not erase the hardships of her beginning: it gave those experiences real meaning. Today, she thrives in the daily dynamics of recruitment, finding reward in knowing her contributions make a positive impact on both the team and the candidates supported.',
      },
      {
        type: 'heading',
        level: 3,
        content: 'Her Advice for Anyone Facing Career Challenges',
      },
      {
        type: 'paragraph',
        content:
          'For anyone feeling discouraged because their career is not unfolding as planned, Allen offers a simple reminder: your journey is only beginning.',
      },
      {
        type: 'paragraph',
        content:
          'Be patient with yourself when things do not go your way. Focus on what you can control, remain open to learning, and remember that you do not have to navigate every challenge alone. Support is often closer than you think, but allowing yourself to reach out is an essential part of moving forward.',
      },
      {
        type: 'paragraph',
        content:
          'Allen’s story shows that progress is not about having everything figured out. It is about embracing the lessons, accepting support, and continuing to move forward until you become someone your younger self would be proud of.',
      },
    ],
  },
  {
    id: 'linkedin-tribute-to-true-connection',
    slug: 'tribute-to-true-connection',
    title:
      'A Tribute to True Connection: Stepping Up to Standing Out in Talent Acquisition',
    author_id: opgAuthor.id,
    author: opgAuthor,
    categories: [featuredArticleCategory],
    tags: [talentSpotlightTag, lifeAtOpgTag],
    excerpt:
      'Joy’s unconventional path into recruitment reveals why empathy, ownership, and genuine human connection are essential to exceptional Talent Acquisition.',
    cover_image_url:
      'https://media.licdn.com/dms/image/v2/D5612AQEMIgkn_HPf5g/article-cover_image-shrink_720_1280/B56Z_zbov7KYAU-/0/1786495538259?e=2147483647&v=beta&t=eBTzSi9KUUIXsm4SjhOsIOHB-R9HZ5CwzkR6r4a2NLg',
    reading_time_minutes: 8,
    status: 'published',
    seo_title:
      'A Tribute to True Connection: Standing Out in Talent Acquisition',
    seo_description:
      'An OPG Talent Spotlight on how empathy, courage, and authentic connection shaped Joy’s career in recruitment.',
    source_url:
      'https://www.linkedin.com/pulse/tribute-true-connection-stepping-up-standing-out-tzslc/',
    view_count: null,
    like_count: 16,
    comment_count: 3,
    created_by: null,
    updated_by: null,
    published_by: null,
    created_at: '2026-08-12T05:00:08.000+00:00',
    updated_at: '2026-09-18T05:03:19.000+00:00',
    published_at: '2026-08-12T05:00:08.000+00:00',
    content: [
      {
        type: 'paragraph',
        content:
          'In today’s hyper-connected yet often isolated corporate world, the true differentiator for any successful organization is not just its technology or its product—it is its people. But how do we find, nurture, and connect with those people?',
      },
      {
        type: 'paragraph',
        content:
          'Welcome to this Talent Spotlight, featuring Joy, a Recruitment Specialist who has mastered the delicate art of balancing urgent business needs with profound human empathy.',
      },
      {
        type: 'paragraph',
        content:
          'Her journey into Human Resources is anything but conventional. It is a story of stepping into the unknown, unlearning the myth of the perfect candidate, overcoming imposter syndrome, and redefining what it means to be a talent acquisition professional.',
      },
      {
        type: 'heading',
        level: 3,
        content:
          'The Reluctant Recruiter: Finding Connection in a Structured World',
      },
      {
        type: 'paragraph',
        content:
          'If you had asked Joy during her college years if she saw herself in Human Resources, the answer would have been a resounding no. Among all her major subjects, Industrial/Organizational Psychology was the one she struggled with the most.',
      },
      {
        type: 'paragraph',
        content:
          'At the time, she was naturally drawn to the facets of psychology that focused intimately on understanding people. I/O Psychology, by contrast, felt overly structured, rigid, and strictly company-focused. She accepted that HR might just be a temporary detour—a place to build skills while she figured out what she truly wanted to pursue.',
      },
      {
        type: 'blockquote',
        content: 'What kept the spark alive? It was the human connection.',
        citation: 'Joy',
      },
      {
        type: 'paragraph',
        content:
          'Once she stepped into the actual role, the theory faded and the reality of the people took over. Whether interviewing candidates, discovering what motivates individuals, or collaborating with hiring managers, she found that these daily interactions held incredible value. She realized that I/O Psychology is not about choosing the organization over the individual. It is about finding harmony between the two.',
      },
      {
        type: 'heading',
        level: 3,
        content: 'The Power of the Deep End',
      },
      {
        type: 'paragraph',
        content:
          'Growth rarely happens when we are comfortable. For Joy, the ultimate test came during the holiday season. With most of the team away, she found herself stepping up to manage the talent needs of key stakeholders.',
      },
      {
        type: 'paragraph',
        content:
          'At the same time, she was racing to source, hire, and onboard an intern before the new year. Suddenly, she was navigating complex problems, making critical decisions, and balancing competing priorities without her usual safety net of mentors.',
      },
      {
        type: 'blockquote',
        content:
          'The scary news is: you’re on your own now. The cool news is: you’re on your own now.',
        citation: 'Taylor Swift, 2022 graduation speech',
      },
      {
        type: 'paragraph',
        content:
          'Being on her own was not just intimidating; it was an opportunity to take ownership. By navigating roadblocks and closing a difficult-to-fill role, she proved to herself that she was capable, resourceful, and ready for the next level.',
      },
      {
        type: 'heading',
        level: 3,
        content: 'Beyond the Resume: Unlearning the Unicorn Myth',
      },
      {
        type: 'paragraph',
        content:
          'Through hard-to-fill roles, Joy learned that modern recruitment requires tenacity, grit, and a willingness to look past the surface. A resume only tells a fraction of the story.',
      },
      {
        type: 'paragraph',
        content:
          'Someone can possess all the right technical skills on paper yet lack the adaptability or cultural alignment needed to thrive. Today, she approaches every role with patience and intention. Recruitment is not simply about filling a vacancy quickly; it is about understanding the deeper needs of both the hiring manager and the talent.',
      },
      {
        type: 'heading',
        level: 3,
        content: 'Doing It Scared: Becoming Comfortable with the Uncomfortable',
      },
      {
        type: 'paragraph',
        content:
          'Stepping into rooms with highly experienced stakeholders can trigger imposter syndrome. Joy is candid that she still experiences nerves when conducting interviews or navigating high-level conversations.',
      },
      {
        type: 'paragraph',
        content:
          'The biggest transformation in her career has not been the absence of fear, but how she responds to it. Confidence does not magically appear before action—it is forged by doing the work. With time, practice, and exposure, the unfamiliar becomes second nature.',
      },
      {
        type: 'heading',
        level: 3,
        content: 'Redefining Success: Small Moments, Big Impact',
      },
      {
        type: 'paragraph',
        content:
          'If you ask Joy to name her proudest professional milestone, she will not point to a hiring metric. She points to the quiet, authentic relationships she has cultivated.',
      },
      {
        type: 'paragraph',
        content:
          'For her, the biggest wins happen when a candidate says the exchange felt like a genuine discussion rather than an interview, or when a hiring manager feels comfortable enough to share the person behind the role. Creating a safe space where people feel heard and respected is her hallmark of success.',
      },
      {
        type: 'heading',
        level: 3,
        content: 'Her Advice for Navigating Your Own Career Hurdles',
      },
      {
        type: 'list',
        items: [
          'Do not force your “why.” Give yourself permission to explore, try new things, and stumble. Sometimes clarity follows the first step.',
          'Practicality is valid. Choosing stability and security can be a necessary and commendable career decision.',
          'Keep the spark alive. Stay curious, keep showing up, and trust that clarity can come with time.',
        ],
      },
      {
        type: 'paragraph',
        content:
          'Joy’s journey is a reminder that career paths are rarely linear and that our most challenging moments often teach the most valuable professional lessons.',
      },
    ],
  },
  {
    id: 'linkedin-beyond-the-internship',
    slug: 'beyond-the-internship',
    title: 'Beyond the Internship: Fostering Next-Generation Talents',
    author_id: opgAuthor.id,
    author: opgAuthor,
    categories: [featuredArticleCategory],
    tags: [lifeAtOpgTag],
    excerpt:
      'Meet the interns improving OPG’s automation, recruitment, and HR operations while turning classroom knowledge into meaningful, real-world contribution.',
    cover_image_url:
      'https://media.licdn.com/dms/image/v2/D5612AQEGeuFuSzynyg/article-cover_image-shrink_720_1280/B56Z9j1b46GUAQ-/0/1784086382607?e=2147483647&v=beta&t=BiXYCH0h1z9D59er7WSG8WkyfYL64YNwxuR6bcwn4g8',
    reading_time_minutes: 5,
    status: 'published',
    seo_title: 'Beyond the Internship: Fostering Next-Generation Talents',
    seo_description:
      'How OPG interns are creating real impact across automation, recruitment, and human resources.',
    source_url:
      'https://www.linkedin.com/pulse/beyond-internship-fostering-next-generation-talents-ph4cc/',
    view_count: null,
    like_count: 12,
    comment_count: 3,
    created_by: null,
    updated_by: null,
    published_by: null,
    created_at: '2026-07-15T05:00:03.000+00:00',
    updated_at: '2026-07-15T05:28:28.000+00:00',
    published_at: '2026-07-15T05:00:03.000+00:00',
    content: [
      {
        type: 'blockquote',
        content:
          'We cannot always build the future for our youth, but we can build our youth for the future.',
        citation: 'Franklin D. Roosevelt',
      },
      {
        type: 'paragraph',
        content:
          'This quote highlights the purpose of a meaningful internship program. An internship should not simply assign daily tasks to fill time. It should give students the tools, real-world experience, and confidence they need to shape their professional journeys.',
      },
      {
        type: 'paragraph',
        content:
          'At OPG, we believe investing in young talent is key to future innovation. Our interns joined across three vital areas—Automation, Recruitment, and Human Resources—and brought fresh perspectives, energy, and a strong desire to learn from day one.',
      },
      {
        type: 'heading',
        level: 2,
        content: 'Streamlining Processes: The Automation Team',
      },
      {
        type: 'paragraph',
        content:
          'Our Automation Team interns have been transforming the way we work. Instead of just learning about technology, they built automated workflows that make daily operations smoother, including systems for automated job ad posting and job description formatting.',
      },
      {
        type: 'paragraph',
        content:
          'Because their work focuses heavily on optimizing hiring processes, the Automation team works closely with Recruitment. These initiatives, alongside other ongoing projects, have saved hours of manual work and improved efficiency.',
      },
      {
        type: 'heading',
        level: 3,
        content: 'Nurturing Our Culture: The HR Team',
      },
      {
        type: 'paragraph',
        content:
          'Our HR Team interns serve as part of the heartbeat of our workplace culture. They provide essential support to ensure the workplace runs smoothly and remains a positive environment for everyone.',
      },
      {
        type: 'list',
        items: [
          'Onboarding that gives new hires a warm and seamless welcome.',
          'Talent coordination that keeps schedules and projects organized.',
          'Employee relations support that helps connect current team members.',
        ],
      },
      {
        type: 'heading',
        level: 3,
        content: 'Connecting Global Talent: The Recruitment Team',
      },
      {
        type: 'paragraph',
        content:
          'Working hand in hand with our automation efforts, Recruitment Team interns took on significant responsibilities from the start. They did not just shadow senior recruiters; they stepped into key parts of the hiring process.',
      },
      {
        type: 'list',
        items: [
          'Conducting onshore interviews for a fast-paced international labor market.',
          'Handling offshore interviews to connect with global talent.',
          'Managing talent pipelines to keep recruitment moving smoothly.',
        ],
      },
      {
        type: 'paragraph',
        content:
          'Their ability to communicate professionally with candidates from different cultures and backgrounds has been impressive.',
      },
      {
        type: 'heading',
        level: 3,
        content: 'Bridging the Gap Between Classroom and Industry',
      },
      {
        type: 'paragraph',
        content:
          'What makes these achievements remarkable is that our interns are accomplishing them while still being students. Balancing university deadlines with corporate responsibilities is no small feat.',
      },
      {
        type: 'paragraph',
        content:
          'Our program exposes students to the realities of business while they complete their degrees. It provides a safe but challenging environment where classroom knowledge can be applied to real situations.',
      },
      {
        type: 'heading',
        level: 3,
        content: 'The Journey Ahead',
      },
      {
        type: 'paragraph',
        content:
          'Most of our interns are only beginning their journey with us. They have already made a strong impression, and we remain committed to supporting their professional growth in the months ahead.',
      },
      {
        type: 'paragraph',
        content:
          'Thank you to each of our interns for your energy and outstanding contributions. We are excited to watch you learn, grow, and achieve great things during your time with OPG.',
      },
    ],
  },
]
