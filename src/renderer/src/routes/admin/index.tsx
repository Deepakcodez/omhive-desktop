import { createFileRoute, Link } from '@tanstack/react-router'
import HourlyTimeline from '@renderer/features/admin/components/hourlyTimeline'
import DailyAttendance from '@renderer/features/admin/components/DailyAttendance'
import ActivityLogTable from '@renderer/features/admin/components/ActivityLogTable'
import Button from '@/components/ui/button'
import { ChevronLeft } from 'lucide-react'
import Errorpage from '@/components/Error-page'
import PendingPage from '@/components/PendingPage'






export const Route = createFileRoute('/admin/')({
  component: RouteComponent,
  errorComponent: ({ reset, error }) => <Errorpage error={error} reset={reset} />,
  pendingComponent: () => <PendingPage />
})





function RouteComponent() {

  return (
    <div className="h-screen overflow-hidden   bg-background  text-foreground font-sans antialiased Selection:bg-indigo-500/30 selection:text-indigo-200 select-none ">
      <div className="relative z-10 h-full  mx-auto px-6 py-8 overflow-y-auto hide-scroll" >

        <Link to="/" className='fixed top-2 left-2 '>
          <Button title='Back' className='aspect-square p-1.5'>
            <ChevronLeft  />
          </Button>
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
