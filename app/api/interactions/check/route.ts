import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ interactions: [] }, { status: 401 })
    }

    const { newMedId, existingMedIds } = await request.json()
    if (!newMedId || !existingMedIds?.length) {
      return NextResponse.json({ interactions: [] })
    }

    const allPairs = existingMedIds.flatMap((existingId: string) => [
      `and(medication_a_id.eq.${newMedId},medication_b_id.eq.${existingId})`,
      `and(medication_a_id.eq.${existingId},medication_b_id.eq.${newMedId})`,
    ])

    const { data: interactions } = await supabase
      .from('drug_interactions')
      .select(`*, medication_a:medications!medication_a_id(item_name), medication_b:medications!medication_b_id(item_name)`)
      .or(allPairs.join(','))

    return NextResponse.json({ interactions: interactions ?? [] })
  } catch (error) {
    console.error('Interaction check error:', error)
    return NextResponse.json({ interactions: [] }, { status: 500 })
  }
}
