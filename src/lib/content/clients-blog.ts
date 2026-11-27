import type { SupabaseClient } from '@supabase/supabase-js'

import { createClient } from '@/lib/supabase/server'

import {
  CLIENTS_BLOG_SETTING_KEY,
  type ClientsBlogConfig,
  cloneDefaultClientsBlogConfig,
  normalizeClientsBlogConfig,
} from './clients-blog-types'

export * from './clients-blog-types'

/**
 * Loads the persisted Clients page Editorial Blog configuration from site_settings,
 * falling back cleanly to the baseline blog showcase configuration when unconfigured.
 */
export async function getClientsBlogConfig(
  client?: SupabaseClient,
): Promise<ClientsBlogConfig> {
  try {
    const supabase = client ?? (await createClient())
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_value, updated_at')
      .eq('setting_key', CLIENTS_BLOG_SETTING_KEY)
      .maybeSingle()

    if (error || !data?.setting_value) {
      return cloneDefaultClientsBlogConfig()
    }

    const normalized = normalizeClientsBlogConfig(data.setting_value)
    if (!normalized.updatedAt && data.updated_at) {
      normalized.updatedAt = data.updated_at
    }
    return normalized
  } catch {
    return cloneDefaultClientsBlogConfig()
  }
}
