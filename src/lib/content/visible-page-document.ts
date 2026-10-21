import type { SupabaseClient } from '@supabase/supabase-js'

import { getAdminSession } from '@/lib/auth/admin-session'
import { isAdminMfaRequired } from '@/lib/auth/config'
import { canViewContent } from '@/lib/auth/permissions'
import type { PageDocument } from '@/lib/content/page-documents'
import type { VisualPage } from '@/lib/content/page-visual'

export async function getVisiblePageDocument(
  supabase: SupabaseClient,
  page: VisualPage,
  requestedPreview: boolean,
): Promise<PageDocument | null> {
  if (requestedPreview) {
    const session = await getAdminSession()
    if (
      session &&
      canViewContent(session.profile.roleKey) &&
      (!isAdminMfaRequired() || session.currentLevel === 'aal2')
    ) {
      const { data } = await supabase
        .from('page_documents')
        .select('*')
        .eq('slug', page)
        .maybeSingle<PageDocument>()
      return data
    }
  }
  const { data } = await supabase
    .from('page_documents')
    .select('*')
    .eq('slug', page)
    .eq('status', 'published')
    .maybeSingle<PageDocument>()
  return data
}
