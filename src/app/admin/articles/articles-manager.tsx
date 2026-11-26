'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { deleteArticleAction } from '@/app/admin/articles/actions'
import { AdminConfirmDialog } from '@/components/admin/admin-confirm-dialog'
import {
  OpgIconArticles,
  OpgIconLikes,
  OpgIconSearch,
  OpgIconTrash,
  OpgIconViews,
  OpgIconVisits,
} from '@/components/icons/opg-icons'
import { canEditDraft } from '@/lib/auth/permissions'
import { resolveSafeArticleImage } from '@/lib/content/article-image'
import type { AdminArticleItem } from '@/lib/content/articles'

import styles from './articles.module.css'

type FilterStatus = 'all' | 'published' | 'draft' | 'in_review' | 'archived'

export function ArticlesManager({
  articles,
  roleKey,
}: {
  articles: AdminArticleItem[]
  roleKey: string
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all')
  const [articleToDelete, setArticleToDelete] =
    useState<AdminArticleItem | null>(null)

  const canManage = canEditDraft(roleKey)

  // Overall analytics calculations
  const totalArticles = articles.length
  const publishedArticles = articles.filter(
    (a) => a.status === 'published',
  ).length
  const totalViews = articles.reduce((sum, a) => sum + (a.views || 0), 0)
  const totalLikes = articles.reduce((sum, a) => sum + (a.likes || 0), 0)

  // Filtered articles list
  const filteredArticles = useMemo(() => {
    return articles.filter((article) => {
      // Status filtering
      if (statusFilter !== 'all') {
        if (statusFilter === 'in_review') {
          if (
            article.status !== 'in_review' &&
            article.status !== 'changes_requested'
          )
            return false
        } else if (article.status !== statusFilter) {
          return false
        }
      }

      // Search filtering
      if (search.trim()) {
        const query = search.toLowerCase().trim()
        const matchTitle = article.title.toLowerCase().includes(query)
        const matchExcerpt = article.excerpt.toLowerCase().includes(query)
        const matchAuthor = article.author_name.toLowerCase().includes(query)
        const matchCategory = article.category_name.toLowerCase().includes(query)
        const matchSlug = article.slug.toLowerCase().includes(query)
        if (
          !matchTitle &&
          !matchExcerpt &&
          !matchAuthor &&
          !matchCategory &&
          !matchSlug
        ) {
          return false
        }
      }

      return true
    })
  }, [articles, statusFilter, search])

  // Count helper
  const getCount = (status: FilterStatus) => {
    if (status === 'all') return articles.length
    if (status === 'in_review') {
      return articles.filter(
        (a) => a.status === 'in_review' || a.status === 'changes_requested',
      ).length
    }
    return articles.filter((a) => a.status === status).length
  }

  return (
    <div className={styles.workspace}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <h1 className={styles.title}>Articles & Insights</h1>
          <p className={styles.subtitle}>
            Manage, publish, edit, and track audience engagement across all thought leadership publications.
          </p>
        </div>

        <div className={styles.headerActions}>
          {canManage && (
            <Link className={styles.createBtn} href="/admin/articles/new">
              <OpgIconArticles size={18} />
              <span>Create Article</span>
            </Link>
          )}
        </div>
      </div>

      {/* Analytics Ribbon */}
      <section
        aria-label="Articles Overview Metrics"
        className={styles.analyticsRibbon}
      >
        <article className={styles.metricCard}>
          <div className={styles.metricIconWrap}>
            <OpgIconArticles size={22} />
          </div>
          <div className={styles.metricData}>
            <span className={styles.metricValue}>
              {totalArticles.toLocaleString()}
            </span>
            <span className={styles.metricLabel}>Total Stories</span>
          </div>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricIconWrap}>
            <OpgIconViews size={22} />
          </div>
          <div className={styles.metricData}>
            <span className={styles.metricValue}>
              {publishedArticles.toLocaleString()}
            </span>
            <span className={styles.metricLabel}>Published Live</span>
          </div>
        </article>

        <article className={styles.metricCard}>
          <div className={styles.metricIconWrap}>
            <OpgIconVisits size={22} />
          </div>
          <div className={styles.metricData}>
            <span className={styles.metricValue}>
              {totalViews.toLocaleString()}
            </span>
            <span className={styles.metricLabel}>Total Article Views</span>
          </div>
        </article>

        <article className={`${styles.metricCard} ${styles.metricCardGold}`}>
          <div className={styles.metricIconWrap}>
            <OpgIconLikes size={22} />
          </div>
          <div className={styles.metricData}>
            <span className={styles.metricValue}>
              {totalLikes.toLocaleString()}
            </span>
            <span className={styles.metricLabel}>Total Reader Likes</span>
          </div>
        </article>
      </section>

      {/* Toolbar: Search & Black Filter Tabs */}
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <OpgIconSearch className={styles.searchIcon} size={18} />
          <input
            aria-label="Search articles by title, category, or keyword"
            className={styles.searchInput}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title, category, or keyword…"
            type="search"
            value={search}
          />
        </div>

        <div className={styles.filterTabs} role="tablist">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'published', label: 'Published' },
              { id: 'draft', label: 'Drafts' },
              { id: 'in_review', label: 'In Review' },
              { id: 'archived', label: 'Archived' },
            ] as const
          ).map((tab) => {
            const isActive = statusFilter === tab.id
            const count = getCount(tab.id)
            return (
              <button
                aria-selected={isActive}
                className={`${styles.filterTab} ${isActive ? styles.filterTabActive : ''}`}
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                role="tab"
                type="button"
              >
                {isActive && (
                  <motion.span
                    className={styles.rubberIndicator}
                    layoutId="rubberSegmentIndicator"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 32,
                      mass: 0.85,
                    }}
                  />
                )}
                <span className={styles.filterTabContent}>
                  <span>{tab.label}</span>
                  <span className={styles.filterTabBadge}>{count}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Articles Table */}
      <div className={styles.tableCard}>
        {filteredArticles.length > 0 ? (
          <div className={styles.tableContainer}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.thArticle}>Article</th>
                  <th className={styles.thCategory}>Category</th>
                  <th className={styles.thStatus}>Status</th>
                  <th className={styles.thPerformance}>Engagement</th>
                  <th className={styles.thDate}>Date</th>
                  <th className={styles.thActions}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredArticles.map((article) => {
                  const isPublished = article.status === 'published'
                  const isReview =
                    article.status === 'in_review' ||
                    article.status === 'changes_requested'
                  const isDraft = article.status === 'draft'

                  return (
                    <tr
                      className={styles.tr}
                      key={article.id || article.slug}
                    >
                      {/* 1. Article Info */}
                      <td className={styles.tdArticle}>
                        <div className={styles.articleCell}>
                          <div className={styles.tableThumbnail}>
                            {article.cover_image_url ? (
                              (() => {
                                const img = resolveSafeArticleImage(
                                  article.cover_image_url,
                                )
                                return (
                                  <Image
                                    alt=""
                                    aria-hidden="true"
                                    fill
                                    sizes="56px"
                                    src={img.src}
                                    unoptimized={img.unoptimized}
                                  />
                                )
                              })()
                            ) : (
                              <div className={styles.thumbnailPlaceholder}>
                                <OpgIconArticles size={18} />
                              </div>
                            )}
                          </div>
                          <div className={styles.articleTitleCol}>
                            <Link
                              className={styles.tableArticleTitle}
                              href={`/admin/articles/${article.id || article.slug}/edit`}
                              title={article.title}
                            >
                              {article.title}
                            </Link>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.45rem',
                                flexWrap: 'wrap',
                              }}
                            >
                              <span className={styles.tableArticleSlug}>
                                /{article.slug}
                              </span>
                              {article.is_featured && (
                                <span className={styles.featuredInlineBadge}>
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Professional Category Tag */}
                      <td className={styles.tdCategory}>
                        <span className={styles.categoryTag}>
                          {article.category_name}
                        </span>
                      </td>

                      {/* 3. Professional Status Tag */}
                      <td className={styles.tdStatus}>
                        <span
                          className={`${styles.statusTag} ${
                            isPublished
                              ? styles.statusPublished
                              : isDraft
                                ? styles.statusDraft
                                : isReview
                                  ? styles.statusReview
                                  : styles.statusArchived
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={styles.statusDot}
                          />
                          <span>
                            {isPublished
                              ? 'Published'
                              : isDraft
                                ? 'Draft'
                                : isReview
                                  ? 'In Review'
                                  : 'Archived'}
                          </span>
                        </span>
                      </td>

                      {/* 5. Engagement Metrics */}
                      <td className={styles.tdPerformance}>
                        <div className={styles.metricsGroup}>
                          <span
                            className={styles.metricItem}
                            title={`${article.views.toLocaleString()} Total Views`}
                          >
                            <OpgIconVisits size={14} />
                            <span>{article.views.toLocaleString()}</span>
                          </span>
                          <span
                            className={styles.metricItem}
                            title={`${article.likes.toLocaleString()} Reader Likes`}
                          >
                            <OpgIconLikes size={14} />
                            <span>{article.likes.toLocaleString()}</span>
                          </span>
                        </div>
                      </td>

                      {/* 6. Date & Read Time */}
                      <td className={styles.tdDate}>
                        <div className={styles.dateCol}>
                          <span className={styles.dateText}>
                            {article.published_at
                              ? new Date(
                                  article.published_at,
                                ).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })
                              : 'Unpublished'}
                          </span>
                          <span className={styles.readingTimeText}>
                            {article.reading_time_minutes} min read
                          </span>
                        </div>
                      </td>

                      {/* 7. Actions */}
                      <td className={styles.tdActions}>
                        <div className={styles.actionsGroup}>
                          {canManage && (
                            <button
                              aria-label={`Delete ${article.title}`}
                              className={styles.actionBtnDelete}
                              onClick={() => setArticleToDelete(article)}
                              title="Delete article"
                              type="button"
                            >
                              <OpgIconTrash size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.emptyCard}>
            <div className={styles.emptyIconWrap}>
              <OpgIconArticles size={40} />
            </div>
            <h2 className={styles.emptyTitle}>No Articles Found</h2>
            <p className={styles.emptyDesc}>
              {search.trim()
                ? `No articles match your search "${search}". Try clearing your search or selecting a different status tab.`
                : 'No articles currently match this status filter.'}
            </p>
            {canManage && (
              <Link className={styles.emptyCreateBtn} href="/admin/articles/new">
                <OpgIconArticles size={18} />
                <span>Create New Article</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal for Safety */}
      <AdminConfirmDialog
        cancelText="Cancel"
        confirmText="Delete Article"
        description={
          articleToDelete
            ? `Are you sure you want to permanently delete "${articleToDelete.title}"? This will remove the article, its editorial history, and public access.`
            : 'Are you sure you want to delete this article?'
        }
        formAction={async (formData) => {
          if (articleToDelete) {
            formData.set('articleId', articleToDelete.id)
            formData.set('slug', articleToDelete.slug)
            await deleteArticleAction(formData)
            setArticleToDelete(null)
          }
        }}
        isOpen={Boolean(articleToDelete)}
        onClose={() => setArticleToDelete(null)}
        title="Confirm Article Deletion"
        tone="danger"
      />
    </div>
  )
}
