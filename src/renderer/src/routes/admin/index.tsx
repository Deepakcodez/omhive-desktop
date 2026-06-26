import { createFileRoute, Link } from '@tanstack/react-router'
import HourlyTimeline from '@renderer/features/admin/components/hourlyTimeline'
import DailyAttendance from '@renderer/features/admin/components/DailyAttendance'
import ActivityLogTable from '@renderer/features/admin/components/ActivityLogTable'






export const Route = createFileRoute('/admin/')({
  component: RouteComponent
})





function RouteComponent() {

  return (
    <div className="h-screen overflow-hidden   bg-background  text-foreground font-sans antialiased Selection:bg-indigo-500/30 selection:text-indigo-200 select-none ">
      <div className="relative z-10 h-full  mx-auto px-6 py-8 overflow-y-auto hide-scroll" >

        <Link to="/" >
          back
        </Link>
        <div className="relative z-10  mx-auto px-6 py-8 space-y-8 max-w-7xl">
          <DailyAttendance />
          <HourlyTimeline />
          <ActivityLogTable />
        </div>
      </div>
    </div>
  )
}
