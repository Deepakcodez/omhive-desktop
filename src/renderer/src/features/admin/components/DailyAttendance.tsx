import { Activity, useEffect, useState } from 'react'
import type { TUserAttendance } from '@shared/types'
import {
    Calendar,
    ChevronDown,
    ChevronRight,

    RotateCw
} from 'lucide-react'
import { cn } from '@renderer/lib/utils'
import { DatePicker } from './DatePicker'
import { useDailyActivitiesStore } from '../store'
import { Link } from '@tanstack/react-router'

const fetchDailyAttendance = async (date: string): Promise<TUserAttendance[]> => {
    const res = await window.api.dailyAttendance({
        date: date
    })

    return res.data
}

function formatSeconds(seconds: number) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)

    return `${h}h ${m}m`
}

function formatTime(date: string | null) {
    if (!date) return 'Active'

    return new Date(date).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
    })
}




export default function DailyAttendance() {
    const { selectedDate, setSelectedDate, setSelectedUserId, setSelectedAttendanceId } = useDailyActivitiesStore()
    const [attendance, setAttendance] = useState<TUserAttendance[]>([])
    const [loading, setLoading] = useState(false)
    const [expanded, setExpanded] = useState<string | null>(null)
    const [refetch, setRefetch] = useState(false)
    const [isShowCalender, setShowCalender] = useState(false)

    useEffect(() => {
        const load = async () => {
            setLoading(true)

            try {
                const data = await fetchDailyAttendance(selectedDate)
                console.log(data)
                setAttendance(data)
            } finally {
                setLoading(false)
            }
        }

        load()
    }, [selectedDate, refetch])

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
                Loading...
            </div>
        )
    }

    return (
        <div className="space-y-2">
            <div className='flex justify-between items-center'>
                <h2 className='text-2xl'>Daily Attendance</h2>
                <div className='flex gap-1 items-center'>
                    <Link
                        to="/admin/monthly-report"
                        title='Monthly Report'
                        className='bg-card rounded-full px-4 py-2 border-y border-y-border text-sm cursor-default'>
                        See Monthly Report
                    </Link>
                    <div className='relative'>

                        <button
                            onClick={() => setShowCalender(!isShowCalender)}
                            className='p-2 rounded-full bg-card border-y border-y-white/30 active:scale-95 duration-300'>
                            <Calendar size={18} />
                        </button>
                        <Activity mode={isShowCalender ? 'visible' : 'hidden'}>
                            <div className='absolute z-10 mt-2 -right-8  shrink-0 w-max'>
                                <DatePicker
                                    selectedDate={selectedDate}
                                    onSelectDate={setSelectedDate}
                                    setShowCalender={setShowCalender}
                                />
                            </div>
                        </Activity>
                    </div>
                    <button
                        title='Refetch Data'
                        onClick={() => setRefetch((prev) => !prev)}
                        className='group p-2 rounded-full bg-card border-y border-y-white/30 active:scale-95 duration-300'
                    >
                        <RotateCw size={18} className='group-active:animate-spin' />
                    </button>
                </div>
            </div>
            {attendance.map((user, i) => {
                const open = expanded === user.userId

                return (
                    <>
                        <div
                            key={user.userId + i}
                            className="overflow-hidden rounded-xl border border-border bg-card"
                        >
                            <button
                                title={`Click to get activities of @${user.userName}`}
                                onClick={() => {
                                    setExpanded(open ? null : user.userId)
                                    setSelectedUserId(user.userId)
                                    setSelectedAttendanceId('')
                                }}
                                className="flex w-full items-center gap-4 p-3 "
                            >
                                <div className="flex w-64 items-center gap-3">
                                    {
                                        open ? (
                                            <ChevronDown size={16} />
                                        ) : (
                                            <ChevronRight size={16} />
                                        )}

                                    <div className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary",)}>
                                        <div className={cn('absolute h-4 w-4 rounded-full ',
                                            user.sessions.length > 0 && user?.sessions[0]?.status === 'working' && 'animate-ping bg-primary')} />
                                        {user.fullName[0].toUpperCase()}
                                    </div>

                                    <div className="text-left relative pe-4  ">
                                        <div className="font-medium leading-none">
                                            {user.fullName}
                                        </div>

                                        <div className="text-xs text-muted-foreground">
                                            @{user.userName}
                                        </div>
                                        <div className={cn('absolute  top-0 -right-12 px-2 rounded-full text-xs ', user.sessions.length == 0 ? 'bg-red-600/40' : 'bg-green-600/40')}>
                                            <p className='text-neutral-200'>
                                                {user.sessions.length === 0 ? 'Absent' : 'Present'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-1 justify-end gap-8 text-sm">
                                    <div className="text-center">
                                        <div className="font-semibold">
                                            {user.sessions.length}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Sessions
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="font-semibold text-green-600">
                                            {formatSeconds(
                                                user.totalWorkSeconds
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Work
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="font-semibold text-yellow-600">
                                            {formatSeconds(
                                                user.totalBreakSeconds
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Break
                                        </div>
                                    </div>

                                    <div className="text-center">
                                        <div className="font-semibold text-red-600">
                                            {formatSeconds(
                                                user.totalIdleSeconds
                                            )}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Idle
                                        </div>
                                    </div>
                                </div>
                            </button>

                            {open && (
                                <div className="border-t border-t-border p-3">
                                    <div className="space-y-2">
                                        {user.sessions.map((session) => (
                                            <button
                                                key={session.attendanceId}
                                                title='click to get activities of that session'
                                                onClick={() => setSelectedAttendanceId(session.attendanceId)}
                                                className="w-full  flex items-center justify-between rounded-full border border-dashed border-primary/30 px-4 py-2 text-sm bg-muted/5"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className="font-medium">
                                                        {formatTime(
                                                            session.loginTime
                                                        )}
                                                        {' → '}
                                                        {formatTime(
                                                            session.logoutTime
                                                        )}
                                                    </span>

                                                    <span
                                                        className={cn(
                                                            'rounded-full px-2 py-1 text-xs',
                                                            {
                                                                'bg-green-100 text-green-700':
                                                                    session.status ===
                                                                    'working',
                                                                'bg-yellow-100 text-yellow-700':
                                                                    session.status ===
                                                                    'break',
                                                                'bg-red-100 text-red-700':
                                                                    session.status ===
                                                                    'logged_out'
                                                            }
                                                        )}
                                                    >
                                                        {session.status}
                                                    </span>
                                                </div>

                                                <div className="flex gap-5 text-xs">
                                                    <span>
                                                        W:{' '}
                                                        {formatSeconds(
                                                            session.workSeconds
                                                        )}
                                                    </span>

                                                    <span>
                                                        B:{' '}
                                                        {formatSeconds(
                                                            session.breakSeconds
                                                        )}
                                                    </span>

                                                    <span>
                                                        I:{' '}
                                                        {formatSeconds(
                                                            session.idleSeconds
                                                        )}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )
            })}
        </div>
    )
}