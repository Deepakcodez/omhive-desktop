import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { User } from '../../features/admin/components/UserSelector'
import UserListwithDetails from '@renderer/features/admin/components/userListwithDetails'
import Header from '@renderer/features/admin/components/header'
import StatsGrid from '@renderer/features/admin/components/statsGrid'
import HourlyTimeline from '@renderer/features/admin/components/hourlyTimeline'
import { getAppColor } from '@renderer/features/admin/utils'
import { ChartBin, DetailedSession } from '@renderer/features/admin/types'
import DetailedSessionHeader from '@renderer/features/admin/components/DetailedSessionHeader'
import DetailedLogTable from '@renderer/features/admin/components/detailedLogTable'





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

  const [_selectedDate, _setSelectedDate] = useState<string>(() => new Date().toLocaleDateString())
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [now, setNow] = useState<number>(() => Date.now())

  // Inspection states
  const [users, setUsers] = useState<User[]>([])
  const [_loadingUsers, setLoadingUsers] = useState<boolean>(false)
  const [inspectedUser, setInspectedUser] = useState<User | null>(null)
  const [inspectedDate, setInspectedDate] = useState<string>('')
  const [inspectedSessions, setInspectedSessions] = useState<DetailedSession[]>([])
  const [loadingInspection, setLoadingInspection] = useState<boolean>(false)

  const isInspecting = inspectedUser !== null
  const isSelectedToday = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0]
    return inspectedDate === todayStr
  }, [inspectedDate])

  const loadInspectedSessions = useCallback(async (userId: string, dateStr: string) => {
    setLoadingInspection(true)
    try {
      const response = await window.api.getUserActivity({
        userId,
        date: dateStr,
        attendanceId: '',
        limit: 100
      })
      console.log('inspected sessions detailed session data', response)
      if (response.success && response.data) {
        setInspectedSessions(response.data.data)
      } else {
        setInspectedSessions([])
      }
    } catch (err) {
      console.error('Error fetching inspected sessions:', err)
      setInspectedSessions([])
    } finally {
      setLoadingInspection(false)
    }
  }, [])



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




  // Calculate statistics for the selected date
  const stats = useMemo(() => {
    if (inspectedSessions.length === 0) {
      return {
        totalActiveSec: 0,
        totalIdleSec: 0,
        ratio: 0,
        topApp: 'None',
        formattedActive: '0m',
        formattedIdle: '0m',
        workHourProgress: 0,
        remainingSec: WORK_TARGET_SEC
      }
    }

    const firstTime = Math.min(...inspectedSessions.map((s) => new Date(s.startTime).getTime()))
    const lastTime = Math.max(...inspectedSessions.map((s) => new Date(s.endTime).getTime()))
    const endAnchor = isSelectedToday ? now : lastTime
    const elapsedSec = Math.max(0, (endAnchor - firstTime) / 1000)

    const totalActiveSec = inspectedSessions.reduce((acc, s) => acc + s.duration, 0)
    const totalIdleSec = Math.max(0, elapsedSec - totalActiveSec)

    // Calculate top software application
    const appDurations: Record<string, number> = {}
    inspectedSessions.forEach((s) => {
      appDurations[s.software] = (appDurations[s.software] || 0) + s.duration
    })
    let topApp = 'None'
    let maxDur = 0
    Object.entries(appDurations).forEach(([app, dur]) => {
      if (dur > maxDur) {
        maxDur = dur
        topApp = app
      }
    })

    const ratio = elapsedSec > 0 ? Math.round((totalActiveSec / elapsedSec) * 100) : 0

    const formatDuration = (seconds: number): string => {
      const h = Math.floor(seconds / 3600)
      const m = Math.floor((seconds % 3600) / 60)
      const s = Math.floor(seconds % 60)
      if (h > 0) return `${h}h ${m}m ${s}s`
      if (m > 0) return `${m}m ${s}s`
      return `${s}s`
    }

    const workHourProgress = Math.min(Math.round((totalActiveSec / WORK_TARGET_SEC) * 100), 100)
    const remainingSec = WORK_TARGET_SEC - totalActiveSec

    return {
      totalActiveSec,
      totalIdleSec,
      ratio,
      topApp,
      formattedActive: formatDuration(totalActiveSec),
      formattedIdle: formatDuration(totalIdleSec),
      workHourProgress,
      remainingSec
    }
  }, [inspectedSessions, isSelectedToday, now])



  // Hourly bin processing for stacked bar chart
  const { chartBins, uniqueApps } = useMemo((): { chartBins: ChartBin[]; uniqueApps: string[] } => {
    if (inspectedSessions.length === 0) return { chartBins: [], uniqueApps: [] }

    const firstTime = Math.min(...inspectedSessions.map((s) => new Date(s.startTime).getTime()))
    const lastTime = Math.max(...inspectedSessions.map((s) => new Date(s.endTime).getTime()))

    // Truncate start and end times to the start of their respective hours
    const startOfFirstHour = new Date(firstTime)
    startOfFirstHour.setMinutes(0, 0, 0)
    const startOfEndHour = new Date(isSelectedToday ? now : lastTime)
    startOfEndHour.setMinutes(0, 0, 0)

    const bins: ChartBin[] = []
    const apps = new Set<string>()

    let currentHourTime = startOfFirstHour.getTime()
    const endHourTime = startOfEndHour.getTime()

    // Safety limit to avoid rendering too many columns if times are anomalous
    let loopCount = 0
    while (currentHourTime <= endHourTime && loopCount < 48) {
      loopCount++
      const binStart = currentHourTime
      const binEnd = currentHourTime + 60 * 60 * 1000 - 1

      // Total minutes available in this bin so far
      let elapsedMs = 60 * 60 * 1000
      if (isSelectedToday && new Date(now).setMinutes(0, 0, 0) === currentHourTime) {
        elapsedMs = now - binStart
      }
      elapsedMs = Math.max(0, elapsedMs)
      const elapsedMins = elapsedMs / (60 * 1000)

      const activeDurations: Record<string, number> = {}
      let totalActiveMins = 0

      inspectedSessions.forEach((s) => {
        const overlapStart = Math.max(new Date(s.startTime).getTime(), binStart)
        const overlapEnd = Math.min(new Date(s.endTime).getTime(), binEnd)
        if (overlapStart < overlapEnd) {
          const overlapMins = (overlapEnd - overlapStart) / (60 * 1000)
          activeDurations[s.software] = (activeDurations[s.software] || 0) + overlapMins
          totalActiveMins += overlapMins
          apps.add(s.software)
        }
      })

      const activeClamp = Math.min(elapsedMins, totalActiveMins)
      const idleMins = Math.max(0, elapsedMins - activeClamp)

      const binDate = new Date(currentHourTime)
      const h = binDate.getHours()
      const ampm = h >= 12 ? 'PM' : 'AM'
      const displayHour = h % 12 === 0 ? 12 : h % 12
      const label = `${displayHour} ${ampm}`

      bins.push({
        time: label,
        Idle: Math.round(idleMins * 10) / 10,
        ...Object.fromEntries(
          Object.entries(activeDurations).map(([app, mins]) => [app, Math.round(mins * 10) / 10])
        )
      })

      currentHourTime += 60 * 60 * 1000
    }

    return { chartBins: bins, uniqueApps: Array.from(apps) }
  }, [inspectedSessions, isSelectedToday, now])

  // Pie Chart calculations
  const pieChartData = useMemo((): { name: string; value: number; color: string }[] => {
    const data: { name: string; value: number; color: string }[] = []
    const totals: Record<string, number> = {}

    inspectedSessions.forEach((s) => {
      totals[s.software] = (totals[s.software] || 0) + s.duration
    })

    Object.entries(totals).forEach(([app, durSec], idx) => {
      data.push({
        name: app,
        value: Math.round((durSec / 60) * 10) / 10,
        color: getAppColor(app, idx)
      })
    })

    if (stats.totalIdleSec > 0) {
      data.push({
        name: 'Idle Time',
        value: Math.round((stats.totalIdleSec / 60) * 10) / 10,
        color: '#475569'
      })
    }

    return data
  }, [inspectedSessions, stats.totalIdleSec])

  // Activity log search
  const displayedLog = useMemo((): DetailedSession[] => {
    return inspectedSessions.filter((s) => {
      const query = searchQuery.toLowerCase()
      return s.software.toLowerCase().includes(query) || s.title.toLowerCase().includes(query)
    })
  }, [inspectedSessions, searchQuery])

  // const isIdle = idleTime >= IDLE_THRESHOLD

  return (
    <div className="min-h-screen bg-background  text-foreground font-sans antialiased Selection:bg-indigo-500/30 selection:text-indigo-200 select-none">
      <Link to="/" >
        back
      </Link>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Top Header */}
        <Header />
        {/* Stats Grid */}
        <StatsGrid stats={stats} />

        <UserListwithDetails
          onInspectUser={(userId, date) => {
            const userObj = users.find((u) => u.id === userId) || null
            setInspectedUser(userObj)
            setInspectedDate(date)
            if (userObj) {
              loadInspectedSessions(userId, date)
            }
          }}
        />

        {/* Charts Section */}
        {loadingInspection ? (
          <div className="bg-card border border-border rounded-2xl p-24 flex flex-col items-center justify-center text-center space-y-4 animate-fade-in">
            <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 text-sm">Fetching inspected user activities...</p>
          </div>
        ) : inspectedSessions.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-16 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 bg-card rounded-full text-slate-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-300">No Activity Recorded</h3>
              <p className="text-slate-400 text-sm max-w-sm">
                {isInspecting
                  ? <>No activity recorded for <span className="font-semibold text-indigo-400">{inspectedDate}</span>.</>
                  : <>Select a user above to inspect their activity.</>}
              </p>
            </div>
          </div>
        ) : (
          <HourlyTimeline
            chartBins={chartBins}
            uniqueApps={uniqueApps}
            pieChartData={pieChartData}
            stats={stats}
          />
        )}

        {/* Detailed Session Logs */}
        <DetailedSessionHeader searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <DetailedLogTable displayedLog={displayedLog} />
      </div>

    </div>
  )
}
