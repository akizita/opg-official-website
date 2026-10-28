import {
  Facebook02Icon,
  InstagramIcon,
  Linkedin01Icon,
  RedditIcon,
  ThreadsIcon,
  TiktokIcon,
} from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'

const socialLinks = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/OPGteam/',
    icon: Facebook02Icon,
  },
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/_opgteam/',
    icon: InstagramIcon,
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@_opgteam',
    icon: TiktokIcon,
  },
  {
    label: 'Threads',
    href: 'https://www.threads.net/@_opgteam',
    icon: ThreadsIcon,
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/outsourced-pro-global/',
    icon: Linkedin01Icon,
  },
  {
    label: 'Reddit',
    href: 'https://www.reddit.com/user/_opgteam/',
    icon: RedditIcon,
  },
]

export function OpgSocialLinks() {
  return (
    <div className="contact-social">
      <p className="contact-social__label">Follow OPG</p>
      <nav aria-label="OPG social media" className="contact-social__links">
        {socialLinks.map(({ href, icon, label }) => (
          <a
            aria-label={`${label} (opens in a new tab)`}
            href={href}
            key={label}
            rel="noopener noreferrer"
            target="_blank"
            title={label}
          >
            <HugeiconsIcon icon={icon} size={20} strokeWidth={1.8} />
          </a>
        ))}
      </nav>
    </div>
  )
}
