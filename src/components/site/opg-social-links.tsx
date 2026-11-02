import {
  ArrowUpRight01Icon,
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
    account: 'OPGteam',
    href: 'https://www.facebook.com/OPGteam/',
    icon: Facebook02Icon,
  },
  {
    label: 'Instagram',
    account: '@_opgteam',
    href: 'https://www.instagram.com/_opgteam/',
    icon: InstagramIcon,
  },
  {
    label: 'TikTok',
    account: '@_opgteam',
    href: 'https://www.tiktok.com/@_opgteam',
    icon: TiktokIcon,
  },
  {
    label: 'Threads',
    account: '@_opgteam',
    href: 'https://www.threads.net/@_opgteam',
    icon: ThreadsIcon,
  },
  {
    label: 'LinkedIn',
    account: 'Outsourced Pro Global',
    href: 'https://www.linkedin.com/company/outsourced-pro-global/',
    icon: Linkedin01Icon,
  },
  {
    label: 'Reddit',
    account: 'u/_opgteam',
    href: 'https://www.reddit.com/user/_opgteam/',
    icon: RedditIcon,
  },
]

export function OpgSocialLinks() {
  return (
    <div className="contact-social">
      <p className="contact-social__eyebrow">Follow us</p>
      <nav aria-label="OPG social media" className="contact-social__links">
        {socialLinks.map(({ account, href, icon, label }) => (
          <a
            aria-label={`${label}: ${account} (opens in a new tab)`}
            className="contact-social-row"
            href={href}
            key={label}
            rel="noopener noreferrer"
            target="_blank"
          >
            <span aria-hidden="true" className="contact-social__icon">
              <HugeiconsIcon icon={icon} size={20} strokeWidth={1.8} />
            </span>
            <span className="contact-social__account">{account}</span>
            <span aria-hidden="true" className="contact-link-arrow">
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} strokeWidth={2} />
            </span>
          </a>
        ))}
      </nav>
    </div>
  )
}
