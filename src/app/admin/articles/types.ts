export type ArticleActionState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Record<string, string>
  articleId?: string
  slug?: string
}

export const initialArticleActionState: ArticleActionState = {
  status: 'idle',
}
