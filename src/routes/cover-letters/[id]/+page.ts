import type { PageLoad } from './$types'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, parent }) => {
  const { supabase, session } = await parent()
  
  if (!session) {
    throw error(401, 'Authentication required')
  }

  const { data: coverLetter, error: coverLetterError } = await supabase
    .from('cover_letters')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (coverLetterError || !coverLetter) {
    throw error(404, 'Cover letter not found')
  }

  return {
    coverLetter,
    session,
    supabase
  }
} 