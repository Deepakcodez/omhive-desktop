import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { User } from '../../features/admin/components/UserSelector'
import UserListwithDetails from '@renderer/features/admin/components/userListwithDetails'
import Header from '@renderer/features/admin/components/header'
import StatsGrid from '@renderer/features/admin/components/statsGrid'
import HourlyTimeline from '@renderer/features/admin/components/hourlyTimeline'
import { getAppColor } from '@renderer/features/admin/utils'
import { ChartBin, DetailedSession } from '@renderer/features/admin/types'
import DetailedSessionHeader from '@renderer/features/admin/components/ActivityLogHeader'
import DetailedLogTable from '@renderer/features/admin/components/ActivityLogTable'
import DailyAttendance from '@renderer/features/admin/components/DailyAttendance'
import ActivityLogTable from '@renderer/features/admin/components/ActivityLogTable'
import { useDailyActivitiesStore } from '@renderer/features/admin/store'





// type DetailedSessionResponse = {
//   data: DetailedSession[]
//   limit: number
//   offset: number
//   total: number
//   message: string
//   success: boolean
// }


export const Route = createFileRoute('/admin/')({
  component: RouteComponent
})

const WORK_TARGET_SEC = 9 * 60 * 60 // 9 hours in seconds




function RouteComponent() {

  return (
    <div className="h-screen overflow-hidden   bg-background  text-foreground font-sans antialiased Selection:bg-indigo-500/30 selection:text-indigo-200 select-none ">
      <div className="relative z-10 h-full  mx-auto px-6 py-8 overflow-y-auto hide-scroll" >

        <Link to="/" >
          back
        </Link>
        <div className="relative z-10  mx-auto px-6 py-8 space-y-8">
   

          <div className='grid grid-cols-2 gap-2'>

            <div className='space-y-6'>
              <DailyAttendance />
              <ActivityLogTable />
            </div>
            <HourlyTimeline />
          </div>
        </div>
      </div>

    </div>
  )
}
