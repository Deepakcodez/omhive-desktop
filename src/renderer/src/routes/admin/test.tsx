import { createFileRoute } from '@tanstack/react-router'



export const Route = createFileRoute('/admin/test')({
  component: RouteComponent
})

const WORK_TARGET_SEC = 9 * 60 * 60 // 9 hours in seconds




function RouteComponent() {



  const getAllUsers = async () => {
    setLoadingUsers(true)
    try {
      const response = await window.api.listUser()
      if (response.success && response.data) {
        setUsers(response.data)
      }
    } catch (err) {
      console.error('Error fetching users list:', err)
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    getAllUsers()
  }, [])

  // Keep rendering state pure by reading time from state updated via effect
  useEffect((): (() => void) => {
    const timer = setInterval(() => {
      setNow(Date.now())
    }, 2000)
    return (): void => clearInterval(timer)
  }, [])





  return (
    <div className="h-screen overflow-hidden   bg-background  text-foreground font-sans antialiased Selection:bg-indigo-500/30 selection:text-indigo-200 select-none ">
      <div className="relative z-10 h-full max-w-7xl mx-auto px-6 py-8 overflow-y-auto hide-scroll" >

        <Link to="/" >
          back
        </Link>
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
          {/* Top Header */}
          <Header />
          <DailyAttendance />


      

          {/* Detailed Session Logs */}
          <ActivityLogTable
          />
        </div>
      </div>

    </div>
  )
}
