import styles from './careers.module.css'

export default function CareersLoading() {
  return (
    <div
      className={`${styles.page} careers-page`}
      aria-busy="true"
      aria-label="Loading careers"
    >
      <div className={styles.careersGlow} aria-hidden="true" />
      <div className={styles.careersGlowSecondary} aria-hidden="true" />

      <section className={styles.openings}>
        <div className="container">
          <header className={styles.pageHeader}>
            <div className={styles.pageHeaderContent}>
              <div className={`${styles.skeleton} ${styles.loadingEyebrow}`} />
              <div className={`${styles.skeleton} ${styles.loadingTitle}`} />
              <div className={`${styles.skeleton} ${styles.loadingLead}`} />
            </div>
          </header>

          <div className={styles.skeletonWrapper}>
            <div className={`${styles.skeleton} ${styles.skeletonToolbar}`} />
            <div className={styles.jobsList}>
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <div
                  className={`${styles.skeleton} ${styles.skeletonCard}`}
                  key={item}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      <span className="sr-only">Loading career opportunities…</span>
    </div>
  )
}
