import { createClient } from './server'

export async function getHouseholdId(): Promise<string | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()
  const row = data as { household_id: string } | null
  return row?.household_id ?? null
}

export async function getUserAndHousehold(): Promise<{ userId: string; userEmail: string; householdId: string } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', user.id)
    .single()
  const row = data as { household_id: string } | null
  if (!row) return null
  return { userId: user.id, userEmail: user.email ?? '', householdId: row.household_id }
}
