import type { PageLoad } from './$types'
import { error } from '@sveltejs/kit'

export const load: PageLoad = async ({ params, parent }) => {
  const { supabase, session } = await parent()
  
  if (!session) {
    throw error(401, 'Authentication required')
  }

  const { data: personalStatement, error: personalStatementError } = await supabase
    .from('personal_statements')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single()

  if (personalStatementError || !personalStatement) {
    throw error(404, 'Personal statement not found')
  }

  return {
    personalStatement,
    session,
    supabase
  }
} 