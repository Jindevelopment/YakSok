export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import NewScheduleForm from './NewScheduleForm'

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-mint-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <NewScheduleForm />
    </Suspense>
  )
}
