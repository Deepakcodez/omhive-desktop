import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState, useMemo, useCallback } from 'react'
import { User } from '../../components/admin/UserSelector'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import UserListwithDetails from '@renderer/components/admin/userListwithDetails'

const IDLE_THRESHOLD = 60 // seconds

const PALETTE = [
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#f43f5e', // Rose
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#14b8a6' // Teal
]

const getAppColor = (app: string, index: number): string => {
  if (app === 'Idle') return '#475569' // Slate 600
  return PALETTE[index % PALETTE.length]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    fill?: string
  }>
  label?: string
}

export const Route = createFileRoute('/admin/')({
  component: RouteComponent
})

// Custom tooltip for stacked BarChart
const CustomTooltip = ({
  active,
  payload,
  label
}: CustomTooltipProps): React.JSX.Element | null => {







  if (active && payload && payload.length) {
    // Sort items by value descending (hide zero values)
    const activeItems = [...payload]
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)

    if (activeItems.length === 0) return null

    return (
      <div className="bg-slate-900/95  border border-slate-800 p-4 rounded-xl shadow-2xl ">
        <p className="font-semibold text-slate-200 mb-2 border-b border-slate-800 pb-1">{label}</p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {activeItems.map((entry, index) => (
            <div key={index} className="flex items-center justify-between space-x-6 text-xs">
              <div className="flex items-center space-x-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-slate-400 font-medium truncate max-w-[120px]">
                  {entry.name}
                </span>
              </div>
              <span className="text-slate-100 font-bold">{entry.value} min</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

interface CustomPieTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      name: string
      value: number
      color: string
    }
  }>
}

// Custom tooltip for PieChart
const CustomPieTooltip = ({ active, payload }: CustomPieTooltipProps): React.JSX.Element | null => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl">
        <div className="flex items-center space-x-2 text-xs">
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: data.color }}
          />
          <span className="text-slate-400 font-medium">{data.name}:</span>
          <span className="text-slate-100 font-bold">{data.value} min</span>
        </div>
      </div>
    )
  }
  return null
}

function RouteComponent() {
  const [idleTime, setIdleTime] = useState<number>(0)
  const [sessions, setSessions] = useState<TSession[]>([])
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toLocaleDateString())
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [now, setNow] = useState<number>(() => Date.now())
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false)

  // Inspection states
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false)
  const [inspectedUser, setInspectedUser] = useState<User | null>(null)
  const [inspectedDate, setInspectedDate] = useState<string>('')
  const [inspectedSessions, setInspectedSessions] = useState<TSession[]>([])
  const [loadingInspection, setLoadingInspection] = useState<boolean>(false)

  const loadInspectedSessions = useCallback(async (userId: string, dateStr: string) => {
    setLoadingInspection(true)
    try {
      const response = await window.api.getUserActivity({
        userId,
        date: dateStr,
        attendanceId: '',
        limit: 500
      })
      if (response.success && response.data) {
        setInspectedSessions(response.data)
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

  const handleApplyInspection = (userId: string, dateStr: string) => {
    const userObj = users.find((u) => u.id === userId) || null
    setInspectedUser(userObj)
    setInspectedDate(dateStr)
    setIsInspectorOpen(false)
    if (userObj) {
      loadInspectedSessions(userId, dateStr)
    }
  }

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

  // Load database sessions and pending sessions
  const loadSessions = useCallback(async (): Promise<void> => {
    try {
      const dbData = await window.api.getAllSession()
      const pendingData = await window.api.getPendingSessions()

      const all = [...(dbData?.sessions || []), ...(pendingData || [])]

      // De-duplicate sessions by startTime to ensure clean charts
      const unique = all.reduce<TSession[]>((acc, s) => {
        if (!acc.some((x) => x.startTime === s.startTime)) {
          acc.push(s)
        }
        return acc
      }, [])

      // Sort descending by startTime (latest first)
      unique.sort((a, b) => b.startTime - a.startTime)
      setSessions(unique)
    } catch (error) {
      console.error('Failed to load sessions:', error)
    }
  }, [])

  useEffect((): (() => void) => {
    Promise.resolve().then((): Promise<void> => loadSessions())

    // Setup IPC listeners
    window.api.onIdleTime((time) => setIdleTime(time))
    window.api.onActivityUpdate((session) => {
      setSessions((prev) => {
        if (prev.some((s) => s.startTime === session.startTime)) return prev
        const updated = [session, ...prev]
        return updated.sort((a, b) => b.startTime - a.startTime)
      })
    })

    // Refresh data periodically
    const interval = setInterval(loadSessions, 10000)

    return (): void => {
      clearInterval(interval)
      window.api.removeIdleTimeListener()
      window.api.removeActivityListeners()
    }
  }, [loadSessions])

  const isInspecting = inspectedUser !== null

  // Get unique sorted list of dates (most recent first)
  const uniqueDates = useMemo((): string[] => {
    const dates = new Set<string>()
    dates.add(new Date().toLocaleDateString())

    const activeSessionsList = isInspecting ? inspectedSessions : sessions
    activeSessionsList.forEach((s) => {
      dates.add(new Date(s.startTime).toLocaleDateString())
    })
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  }, [isInspecting, inspectedSessions, sessions])

  // Filter sessions for selected date
  const filteredSessions = useMemo((): TSession[] => {
    if (isInspecting) {
      return inspectedSessions
    }
    return sessions.filter((s) => new Date(s.startTime).toLocaleDateString() === selectedDate)
  }, [isInspecting, inspectedSessions, sessions, selectedDate])

  const isSelectedToday = useMemo(() => {
    if (isInspecting) {
      const todayStr = new Date().toISOString().split('T')[0]
      return inspectedDate === todayStr
    }
    return selectedDate === new Date().toLocaleDateString()
  }, [isInspecting, inspectedDate, selectedDate])

  // Calculate statistics for the selected date
  const stats = useMemo(() => {
    if (filteredSessions.length === 0) {
      return {
        totalActiveSec: 0,
        totalIdleSec: 0,
        ratio: 0,
        topApp: 'None',
        formattedActive: '0m',
        formattedIdle: '0m'
      }
    }

    const firstTime = Math.min(...filteredSessions.map((s) => new Date(s.startTime).getTime()))
    const lastTime = Math.max(...filteredSessions.map((s) => new Date(s.endTime).getTime()))
    const endAnchor = isSelectedToday ? now : lastTime
    const elapsedSec = Math.max(0, (endAnchor - firstTime) / 1000)

    const totalActiveSec = filteredSessions.reduce((acc, s) => acc + s.duration, 0)
    const totalIdleSec = Math.max(0, elapsedSec - totalActiveSec)

    // Calculate top software application
    const appDurations: Record<string, number> = {}
    filteredSessions.forEach((s) => {
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

    return {
      totalActiveSec,
      totalIdleSec,
      ratio,
      topApp,
      formattedActive: formatDuration(totalActiveSec),
      formattedIdle: formatDuration(totalIdleSec)
    }
  }, [filteredSessions, isSelectedToday, now])

  interface ChartBin {
    time: string
    Idle: number
    [app: string]: string | number
  }

  // Hourly bin processing for stacked bar chart
  const { chartBins, uniqueApps } = useMemo((): { chartBins: ChartBin[]; uniqueApps: string[] } => {
    if (filteredSessions.length === 0) return { chartBins: [], uniqueApps: [] }

    const firstTime = Math.min(...filteredSessions.map((s) => new Date(s.startTime).getTime()))
    const lastTime = Math.max(...filteredSessions.map((s) => new Date(s.endTime).getTime()))

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

      filteredSessions.forEach((s) => {
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
  }, [filteredSessions, isSelectedToday, now])

  // Pie Chart calculations
  const pieChartData = useMemo((): { name: string; value: number; color: string }[] => {
    const data: { name: string; value: number; color: string }[] = []
    const totals: Record<string, number> = {}

    filteredSessions.forEach((s) => {
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
  }, [filteredSessions, stats.totalIdleSec])

  // Activity log search
  const displayedLog = useMemo((): TSession[] => {
    return filteredSessions.filter((s) => {
      const query = searchQuery.toLowerCase()
      return s.software.toLowerCase().includes(query) || s.title.toLowerCase().includes(query)
    })
  }, [filteredSessions, searchQuery])

  const isIdle = idleTime >= IDLE_THRESHOLD

  return (
    <div className="min-h-screen bg-background  text-foreground font-sans antialiased Selection:bg-indigo-500/30 selection:text-indigo-200 select-none">
      <Link to="/" >
        back
      </Link>
      <Link to="/admin/monthly-report" >
        monthly report
      </Link>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4  pb-6">
          <div className="space-y-1">
            <h1 className="text-3xl tracking-tight">Omhive Activity Center</h1>
            <p className="text-slate-400 text-sm">
              Visualizing work sessions, app usage, and desktop idle state.
            </p>
          </div>

          {isInspecting ? (
            <div className="flex flex-wrap items-center gap-4 bg-indigo-950/20 border border-indigo-500/25 px-5 py-3 rounded-2xl backdrop-blur-md animate-fade-in">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {(inspectedUser?.fullName || inspectedUser?.userName || 'U')[0].toUpperCase()}
                </div>
                <div className="space-y-0.5">
                  <p className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">Inspecting User</p>
                  <h4 className="text-sm font-bold text-slate-100">
                    {inspectedUser?.fullName || inspectedUser?.userName} <span className="text-slate-500 font-medium text-xs">(@{inspectedUser?.userName})</span>
                  </h4>
                </div>
              </div>

              <div className="h-6 w-px bg-slate-800/80 hidden sm:block" />

              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Selected Date</p>
                <p className="text-xs font-bold text-slate-300">{inspectedDate}</p>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <button
                  onClick={() => setIsInspectorOpen(true)}
                  className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-300 px-3.5 py-1.5 rounded-full font-semibold text-xs cursor-pointer active:scale-95 transition duration-150"
                >
                  Change Select
                </button>
                <button
                  onClick={() => {
                    setInspectedUser(null)
                    setInspectedSessions([])
                  }}
                  className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 px-3.5 py-1.5 rounded-full font-semibold text-xs cursor-pointer active:scale-95 transition duration-150 flex items-center space-x-1"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Exit</span>
                </button>
              </div>
            </div>
          ) : (
            /* Controls & Active State */
            <div className="flex flex-wrap items-center gap-4">
              {/* Status indicator */}
              <div className="flex items-center space-x-2 bg-card border border-border px-4 py-2 rounded-full">
                <span className="relative flex h-2 w-2">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isIdle ? 'bg-amber-400' : 'bg-primary'}`}
                  ></span>
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${isIdle ? 'bg-amber-500' : 'bg-primary2'}`}
                  ></span>
                </span>
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-300">
                  {isIdle ? `Idle: ${idleTime}s` : 'Active'}
                </span>
              </div>

              {/* Inspect User Button */}
              <button
                onClick={() => setIsInspectorOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.02] text-white px-5 py-2 rounded-full font-semibold focus:outline-none text-xs cursor-pointer shadow-lg hover:shadow-indigo-500/20 active:scale-95 transition-all duration-200 flex items-center space-x-2 border border-indigo-500/20"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Inspect User</span>
              </button>

              {/* Date Select Dropdown */}
              <div className="relative">
                <select
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="appearance-none bg-card border border-border text-slate-200 px-4 py-2 pr-10 rounded-full font-medium focus:outline-none  text-sm cursor-pointer shadow-lg hover:border-slate-700 transition"
                >
                  {uniqueDates.map((date) => (
                    <option key={date} value={date}>
                      {date === new Date().toLocaleDateString() ? `Today (${date})` : date}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-slate-800">
                  <svg
                    className="fill-current h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Active Time */}
          <div className="bg-card border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg  transition duration-300">
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Total Active
              </p>
              <h3 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                {stats.formattedActive}
              </h3>
            </div>
          </div>

          {/* Card 2: Idle Time */}
          <div className="bg-card backdrop-blur-md border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg  transition duration-300">
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.07 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Total Idle
              </p>
              <h3 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                {stats.formattedIdle}
              </h3>
            </div>
          </div>

          {/* Card 3: Active Ratio */}
          <div className="bg-card backdrop-blur-md border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg  transition duration-300">
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Active Ratio
              </p>
              <h3 className="text-2xl font-bold text-slate-100 tracking-tight mt-1">
                {stats.ratio}%
              </h3>
            </div>
          </div>

          {/* Card 4: Top Application */}
          <div className="bg-card backdrop-blur-md border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg  transition duration-300">
            <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Top App
              </p>
              <h3
                className="text-lg font-bold text-slate-100 tracking-tight mt-1 truncate"
                title={stats.topApp}
              >
                {stats.topApp}
              </h3>
            </div>
          </div>
        </section>

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
        ) : filteredSessions.length === 0 ? (
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
                There are no active desktop tracking sessions stored for the date of{' '}
                <span className="font-semibold text-indigo-400">
                  {isInspecting ? inspectedDate : selectedDate}
                </span>.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Stacked Bar Chart: Hourly timeline */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-200">Hourly Timeline</h3>
                  <p className="text-slate-400 text-xs mt-0.5">
                    Distribution of software and idle time per hour.
                  </p>
                </div>
                <span className="text-xs  font-semibold uppercase  border border-border px-2.5 py-1 rounded-full bg-primary text-background">
                  Values in minutes
                </span>
              </div>

              <div className="w-full overflow-x-auto custom-scrollbar pr-1 pb-1">
                <div className="h-80 min-w-[800px] w-full shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartBins} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                      <XAxis
                        dataKey="time"
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="#64748B"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 60]}
                        ticks={[0, 15, 30, 45, 60]}
                      />
                      <Tooltip
                        content={<CustomTooltip />}
                        cursor={{ fill: '#1E293B', opacity: 0.3 }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: 11, paddingTop: 15 }}
                      />
                      {/* Unique Apps stacked */}
                      {uniqueApps.map((app, idx) => (
                        <Bar
                          key={app}
                          dataKey={app}
                          stackId="a"
                          fill={getAppColor(app, idx)}
                          radius={[0, 0, 0, 0]}
                        />
                      ))}
                      {/* Idle stacked */}
                      <Bar dataKey="Idle" stackId="a" fill="#334155" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Pie Chart: App Usage Distribution */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-200">App Distribution</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  Proportional breakdown of total logged time.
                </p>
              </div>

              <div className="h-60 w-full relative flex items-center justify-center shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="#090D16"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>

                {/* Center text indicating focus percentage */}
                <div className="absolute flex flex-col items-center text-center">
                  <span className="text-2xl font-black text-slate-100">{stats.ratio}%</span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                    Active
                  </span>
                </div>
              </div>

              {/* List of top colors/shares */}
              <div className="space-y-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                {pieChartData.map((entry, index) => (
                  <div key={index} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-slate-300 truncate max-w-[150px]">{entry.name}</span>
                    </div>
                    <span className="text-slate-400 font-bold">{entry.value}m</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Session Logs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Chronological Activity Log</h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Detailed window transition events for the day.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search app or window title..."
              className="w-full bg-card border border-border text-foreground text-sm px-4 py-2 pl-10 rounded-full focus:outline-none  placeholder-foreground/50 transition"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
        </div>
        <section className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">


          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-card text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Time Window</th>
                    <th className="py-3.5 px-4">Application</th>
                    <th className="py-3.5 px-4">Window Title</th>
                    <th className="py-3.5 px-4 text-right">Duration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                  {displayedLog.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                        No matching sessions found.
                      </td>
                    </tr>
                  ) : (
                    displayedLog.map((session, idx) => {
                      const startTimeStr = new Date(session.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })
                      const endTimeStr = new Date(session.endTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })

                      const min = Math.floor(session.duration / 60)
                      const sec = Math.round(session.duration % 60)
                      const durStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`

                      return (
                        <tr key={idx} className="hover:bg-slate-900/20 transition duration-150">
                          <td className="py-3.5 px-4 font-mono text-slate-400">
                            {startTimeStr} - {endTimeStr}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-indigo-300">
                            {session.software}
                          </td>
                          <td
                            className="py-3.5 px-4 truncate max-w-xs sm:max-w-md md:max-w-lg"
                            title={session.title}
                          >
                            {session.title || (
                              <span className="text-slate-600 italic">No Title</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold text-slate-200">
                            {durStr}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

    </div>
  )
}
