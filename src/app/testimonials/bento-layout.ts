import type { CandidateTestimonial } from '@/lib/content/candidate-testimonials'

export type BentoColumnEntry = {
  index: number
  isFeatured: boolean
  item: CandidateTestimonial
}

/**
 * Estimate relative vertical visual weight of a testimonial card so multi-column
 * bento distribution balances columns cleanly on both SSR and client resizes.
 */
export function estimateTestimonialCardWeight(
  item: CandidateTestimonial,
  columnWidthFactor = 1,
): number {
  const quoteLength = item.quote.trim().length
  const authorLength =
    item.author_name.trim().length + (item.role_title?.trim().length ?? 0)
  const charsPerLine = Math.max(24, Math.round(40 * columnWidthFactor))
  const quoteLines = Math.max(2, Math.ceil(quoteLength / charsPerLine))
  const authorExtra = authorLength > 34 ? 18 : 0
  return 116 + quoteLines * 22 + authorExtra
}

/**
 * Distribute testimonial cards across `columnCount` vertical stacks by always
 * placing the next card into the shortest column, eliminating internal gaps.
 */
export function distributeTestimonialsBento(
  items: CandidateTestimonial[],
  columnCount: number,
): BentoColumnEntry[][] {
  const safeCount = Math.max(1, Math.min(columnCount, Math.max(1, items.length)))
  if (items.length === 0) return []

  const columns: BentoColumnEntry[][] = Array.from(
    { length: safeCount },
    () => [],
  )
  const heights = Array.from({ length: safeCount }, () => 0)

  items.forEach((item, index) => {
    let targetCol = 0
    for (let col = 1; col < safeCount; col += 1) {
      if (heights[col] < heights[targetCol]) {
        targetCol = col
      }
    }

    const widthFactor = safeCount === 3 && targetCol === 0 ? 1.12 : 1
    columns[targetCol].push({
      index,
      isFeatured: index === 0,
      item,
    })
    heights[targetCol] += estimateTestimonialCardWeight(item, widthFactor) + 16
  })

  return columns
}
