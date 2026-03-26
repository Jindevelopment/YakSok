import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import InteractionClient from '@/components/medicine/InteractionClient'
import type { Medication, DrugInteraction } from '@/types'

export default async function InteractionPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: schedules } = await supabase
    .from('schedules')
    .select(`medication_id, medication:medications(id, item_name, entp_name)`)
    .eq('user_id', user.id)
    .eq('is_active', true)

  const medIds = schedules?.map(s => s.medication_id) ?? []

  let interactions: DrugInteraction[] = []
  if (medIds.length >= 2) {
    const { data } = await supabase
      .from('drug_interactions')
      .select(`*, medication_a:medications!medication_a_id(item_name), medication_b:medications!medication_b_id(item_name)`)
      .or(
        medIds.flatMap((a, i) =>
          medIds.slice(i + 1).map(b =>
            `and(medication_a_id.eq.${a},medication_b_id.eq.${b}),and(medication_a_id.eq.${b},medication_b_id.eq.${a})`
          )
        ).join(',')
      )
    interactions = (data ?? []) as DrugInteraction[]
  }

  const medications: Medication[] = (schedules ?? [])
    .map(s => s.medication as unknown as Medication)
    .filter(Boolean)

  return (
    <InteractionClient
      medications={medications}
      interactions={interactions}
    />
  )
}
