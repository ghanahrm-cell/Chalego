'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  await supabase.rpc('mark_notifications_read', { p_ids: null })
  revalidatePath('/account/notifications')
}
