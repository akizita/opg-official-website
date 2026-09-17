import { ButtonLink } from '@/components/ui/button-link'
import { Card } from '@/components/ui/card'

const services = [
  {
    title: 'Build capable teams',
    text: 'Find people whose skills, working style, and goals fit the work ahead.',
  },
  {
    title: 'Scale with confidence',
    text: 'Create a practical outsourcing model that supports quality and continuity.',
  },
  {
    title: 'Create better opportunities',
    text: 'Connect talented professionals with meaningful roles in global organizations.',
  },
] as const

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="container hero__content">
          <p className="eyebrow">Global talent. Thoughtful partnerships.</p>
          <h1>The right people can move every business forward.</h1>
          <p className="hero__summary">
            Outsourced Pro Global helps organizations build strong teams and
            helps professionals discover their next opportunity.
          </p>
          <div className="button-row" aria-label="Choose your path">
            <ButtonLink href="/services">I’m building a team</ButtonLink>
            <ButtonLink href="/careers" variant="secondary">
              I’m looking for a role
            </ButtonLink>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="services-heading">
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">What we do</p>
              <h2 id="services-heading">People solutions made for real work</h2>
            </div>
            <ButtonLink href="/services" variant="secondary">
              View all services
            </ButtonLink>
          </div>
          <div className="card-grid">
            {services.map((service, index) => (
              <Card
                eyebrow={`0${index + 1}`}
                key={service.title}
                title={service.title}
              >
                <p>{service.text}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section section--ink" aria-labelledby="proof-heading">
        <div className="container split-panel">
          <div>
            <p className="eyebrow eyebrow--light">Why OPG</p>
            <h2 id="proof-heading">
              A global reach, grounded in human judgment.
            </h2>
          </div>
          <p>
            This foundation page validates the approved dual-audience structure.
            Final claims, statistics, client marks, photography, and legal copy
            remain subject to owner approval before launch.
          </p>
        </div>
      </section>

      <section className="section" aria-labelledby="cta-heading">
        <div className="container final-cta">
          <div>
            <p className="eyebrow">Start a conversation</p>
            <h2 id="cta-heading">Your next hire. Your next role.</h2>
          </div>
          <div className="button-row">
            <ButtonLink href="/contact">Contact OPG</ButtonLink>
            <ButtonLink href="/careers" variant="secondary">
              View open roles
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  )
}
