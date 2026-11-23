import styles from './page-skeleton.module.css'

export type PageSkeletonVariant = 'cards' | 'list' | 'article' | 'table'

export interface PageSkeletonProps {
  variant: PageSkeletonVariant
  compact?: boolean
  embedded?: boolean
  label?: string
  className?: string
}

function CardsSkeleton() {
  return (
    <>
      <div className={`${styles.headerStack} ${styles.headerCentered}`}>
        <div
          className={`${styles.skeletonBlock} ${styles.pill} ${styles.eyebrowBar}`}
        />
        <div className={`${styles.skeletonBlock} ${styles.titleBar}`} />
        <div className={`${styles.skeletonBlock} ${styles.leadBar}`} />
      </div>

      <div className={styles.filterRow} aria-hidden="true">
        {[1, 2, 3, 4].map((item) => (
          <div
            className={`${styles.skeletonBlock} ${styles.pill} ${styles.filterPill}`}
            key={item}
          />
        ))}
      </div>

      <div className={styles.cardsGrid} aria-hidden="true">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div className={styles.cardFrame} key={item}>
            <div
              className={`${styles.skeletonBlock} ${styles.cardRadius} ${styles.cardMedia}`}
            />
            <div
              className={`${styles.skeletonBlock} ${styles.pill} ${styles.cardTag}`}
            />
            <div className={`${styles.skeletonBlock} ${styles.cardTitle}`} />
            <div className={`${styles.skeletonBlock} ${styles.cardLine}`} />
            <div
              className={`${styles.skeletonBlock} ${styles.cardLineShort}`}
            />
          </div>
        ))}
      </div>
    </>
  )
}

function ListSkeleton() {
  return (
    <>
      <div className={styles.headerStack}>
        <div
          className={`${styles.skeletonBlock} ${styles.pill} ${styles.eyebrowBar}`}
        />
        <div className={`${styles.skeletonBlock} ${styles.titleBar}`} />
        <div className={`${styles.skeletonBlock} ${styles.leadBar}`} />
      </div>

      <div className={styles.listToolbar} aria-hidden="true">
        <div className={`${styles.skeletonBlock} ${styles.listToolbarItem}`} />
        <div className={`${styles.skeletonBlock} ${styles.listToolbarItem}`} />
      </div>

      <div className={styles.listStack} aria-hidden="true">
        {[1, 2, 3, 4, 5].map((item) => (
          <div className={styles.listRowCard} key={item}>
            <div className={styles.listRowMain}>
              <div className={styles.listRowMeta}>
                <div
                  className={`${styles.skeletonBlock} ${styles.pill} ${styles.listMetaPill}`}
                />
                <div
                  className={`${styles.skeletonBlock} ${styles.pill} ${styles.listMetaPill}`}
                />
              </div>
              <div
                className={`${styles.skeletonBlock} ${styles.listRowTitle}`}
              />
              <div
                className={`${styles.skeletonBlock} ${styles.listRowSubtitle}`}
              />
            </div>
            <div
              className={`${styles.skeletonBlock} ${styles.pill} ${styles.listRowAction}`}
            />
          </div>
        ))}
      </div>
    </>
  )
}

function ArticleSkeleton() {
  return (
    <div className={styles.articleColumn} aria-hidden="true">
      <div
        className={`${styles.skeletonBlock} ${styles.pill} ${styles.backLinkBar}`}
      />
      <div className={`${styles.skeletonBlock} ${styles.articleTitle}`} />
      <div className={`${styles.skeletonBlock} ${styles.leadBarShort}`} />

      <div className={styles.articleMetaRow}>
        <div
          className={`${styles.skeletonBlock} ${styles.pill} ${styles.articleMetaChip}`}
        />
        <div
          className={`${styles.skeletonBlock} ${styles.pill} ${styles.articleMetaChip}`}
        />
      </div>

      <div
        className={`${styles.skeletonBlock} ${styles.cardRadius} ${styles.articleHero}`}
      />

      <div className={styles.articleParagraph}>
        <div className={`${styles.skeletonBlock} ${styles.textLineFull}`} />
        <div className={`${styles.skeletonBlock} ${styles.textLineFull}`} />
        <div className={`${styles.skeletonBlock} ${styles.textLineMed}`} />
        <div className={`${styles.skeletonBlock} ${styles.textLineShort}`} />
      </div>

      <div className={styles.articleParagraph}>
        <div className={`${styles.skeletonBlock} ${styles.textLineFull}`} />
        <div className={`${styles.skeletonBlock} ${styles.textLineMed}`} />
        <div className={`${styles.skeletonBlock} ${styles.textLineShort}`} />
      </div>
    </div>
  )
}

function TableSkeleton() {
  return (
    <>
      <div className={styles.headerStack} aria-hidden="true">
        <div className={`${styles.skeletonBlock} ${styles.titleBar}`} />
        <div className={`${styles.skeletonBlock} ${styles.leadBarShort}`} />
      </div>

      <div className={styles.tableStatsGrid} aria-hidden="true">
        {[1, 2, 3].map((item) => (
          <div className={styles.statCard} key={item}>
            <div className={`${styles.skeletonBlock} ${styles.statLabel}`} />
            <div className={`${styles.skeletonBlock} ${styles.statValue}`} />
          </div>
        ))}
      </div>

      <div className={styles.tableSurface} aria-hidden="true">
        <div className={styles.tableToolbar}>
          <div className={`${styles.skeletonBlock} ${styles.tableSearch}`} />
          <div
            className={`${styles.skeletonBlock} ${styles.pill} ${styles.tableAction}`}
          />
        </div>

        {[1, 2, 3, 4, 5, 6].map((row) => (
          <div className={styles.tableRow} key={row}>
            <div className={`${styles.skeletonBlock} ${styles.tableCell}`} />
            <div className={`${styles.skeletonBlock} ${styles.tableCell}`} />
            <div className={`${styles.skeletonBlock} ${styles.tableCell}`} />
            <div className={`${styles.skeletonBlock} ${styles.tableCell}`} />
          </div>
        ))}
      </div>
    </>
  )
}

export function PageSkeleton({
  variant,
  compact = false,
  embedded = false,
  label = 'Loading content',
  className = '',
}: PageSkeletonProps) {
  const rootClass = [
    styles.skeletonRoot,
    compact ? styles.skeletonCompact : '',
    embedded ? styles.skeletonEmbedded : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <section
      aria-busy="true"
      aria-live="polite"
      className={rootClass}
      role="status"
    >
      <div className={styles.skeletonContainer}>
        {variant === 'cards' && <CardsSkeleton />}
        {variant === 'list' && <ListSkeleton />}
        {variant === 'article' && <ArticleSkeleton />}
        {variant === 'table' && <TableSkeleton />}
      </div>
      <span className="sr-only">{label}</span>
    </section>
  )
}
