import { Calendar, RotateCcw } from 'lucide-react'
import React, { useEffect, useMemo } from 'react'

export type Attendance = {
    id: string
    date: string
    loginTime: string
    logoutTime: string | null
    expectedWorkSeconds: number
    totalWorkSeconds: number
    totalBreakSeconds: number
    status: 'working' | 'break' | 'logged_out'
    hostname: string
    systemUsername: string
    os: string
}

export type UserWithAttendance = {
    id: string
    userName: string
    fullName: string
    phone: string
    attendance: Attendance[]
}

export type UsersWithLoginLogout = {
    data: UserWithAttendance[]
    success: boolean
    message: string
}

export default function UserListwithDetails() {
    const [userDetails, setUserDetails] = React.useState<UserWithAttendance[]>([]);
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);

    const getUserDetails = async () => {
        setLoading(true)
        setError(null)
        try {
            const res: UsersWithLoginLogout =
                await window.api.listUserWithLoginLogout()
            if (res.success && res.data) {
                setUserDetails(res.data)
            } else {
                setError(res.message || "Failed to load user details")
            }
        } catch (err) {
            console.error("Error loading user details:", err)
            setError("Failed to fetch user list")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        getUserDetails()
    }, [])

    // Flatten data for table view
    const rows = useMemo(() => {
        const list: Array<{
            user: { fullName: string; userName: string; phone: string }
            attendance: Attendance | null
        }> = []

        userDetails?.forEach((user) => {
            if (user.attendance && user.attendance.length > 0) {
                user.attendance.forEach((att) => {
                    list.push({
                        user: { fullName: user.fullName, userName: user.userName, phone: user.phone },
                        attendance: att
                    })
                })
            } else {
                list.push({
                    user: { fullName: user.fullName, userName: user.userName, phone: user.phone },
                    attendance: null
                })
            }
        })

        // Sort by date (latest first)
        list.sort((a, b) => {
            if (!a.attendance) return 1
            if (!b.attendance) return -1
            return new Date(b.attendance.date).getTime() - new Date(a.attendance.date).getTime()
        })

        return list
    }, [userDetails])

    const formatTime = (isoString: string | null) => {
        if (!isoString) return 'Active'
        try {
            return new Date(isoString).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            })
        } catch {
            return isoString
        }
    }

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        if (h > 0) return `${h}h ${m}m`
        return `${m}m`
    }

    return (
        <>

            <div className="flex items-center justify-between">

                <div className="flex items-center justify-between w-full space-x-3">
                    <div>
                        <h2 className="text-xl font-bold text-slate-100">
                            Users Attendance Sheet
                        </h2>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Real-time status tracking and active sessions for registered users.
                        </p>
                    </div>
                    <div>

                        <button
                            // onClick={getUserDetails}
                            disabled={loading}
                            className="p-2 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition disabled:opacity-50 cursor-pointer"
                            title="Refresh"
                        >
                            <Calendar />
                        </button>
                        <button
                            onClick={getUserDetails}
                            disabled={loading}
                            className="p-2 hover:bg-slate-900 border border-slate-900 hover:border-slate-800 text-slate-400 hover:text-slate-200 rounded-xl transition disabled:opacity-50 cursor-pointer"
                            title="Refresh"
                        >
                            <RotateCcw />
                        </button>
                    </div>
                </div>
            </div>


            <div className="w-full rounded-2xl bg-card border border-border p-6 shadow-xl space-y-4">


                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-xs">
                        {error}
                    </div>
                )}

                {/* Table Container using Flexbox */}
                    {/* Header Row */}
                    <div className="flex items-center bg-background px-5 py-3 border-b border-border text-[10px] font-bold text-foreground uppercase tracking-wider text-left select-none">
                        <div className="flex-[1.5] min-w-0">User</div>
                        <div className="flex-1">Date</div>
                        <div className="flex-1">Login Time</div>
                        <div className="flex-1">Logout Time</div>
                        <div className="flex-1">Work Time</div>
                        <div className="flex-1">Break Time</div>
                        <div className="flex-1 flex justify-end">Status</div>
                    </div>

                    {/* Data Rows */}
                    <div className="divide-y divide-border text-xs text-foreground">
                        {loading && userDetails.length === 0 ? (
                            <div className="py-12 flex flex-col items-center justify-center space-y-3">
                                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                                <span className="text-slate-500">Loading records...</span>
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="py-10 text-center text-slate-500 font-medium">
                                No attendance records found.
                            </div>
                        ) : (
                            rows.map((row, idx) => {
                                const hasAttendance = row.attendance !== null
                                const att = row.attendance
                                return (
                                    <div
                                        key={idx}
                                        className="flex items-center px-5 py-3.5 hover:bg-white/10 transition duration-150 select-none"
                                    >
                                        {/* Column 1: User */}
                                        <div className="flex-[1.5] flex items-center space-x-3 min-w-0">
                                            <div className="w-8 h-8 rounded-full bg-primary border border-primary flex items-center justify-center text-black font-bold text-xs uppercase shrink-0">
                                                {(row.user.fullName || row.user.userName || 'U')[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-200 truncate leading-snug">
                                                    {row.user.fullName || row.user.userName}
                                                </p>
                                                <p className="text-[10px] text-slate-500 truncate">
                                                    @{row.user.userName}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Column 2: Date */}
                                        <div className="flex-1 font-mono text-slate-400">
                                            {hasAttendance ? att!.date : '-'}
                                        </div>

                                        {/* Column 3: Login */}
                                        <div className="flex-1 font-mono text-slate-300">
                                            {hasAttendance ? formatTime(att!.loginTime) : '-'}
                                        </div>

                                        {/* Column 4: Logout */}
                                        <div className={`flex-1 font-mono ${hasAttendance && !att!.logoutTime ? 'text-indigo-400 font-semibold' : 'text-slate-300'}`}>
                                            {hasAttendance ? formatTime(att!.logoutTime) : '-'}
                                        </div>

                                        {/* Column 5: Work duration */}
                                        <div className="flex-1 font-medium text-slate-300">
                                            {hasAttendance ? formatDuration(att!.totalWorkSeconds) : '-'}
                                        </div>

                                        {/* Column 6: Break duration */}
                                        <div className="flex-1 font-medium text-slate-400">
                                            {hasAttendance ? `${Math.floor(att!.totalBreakSeconds / 60)}m` : '-'}
                                        </div>

                                        {/* Column 7: Status */}
                                        <div className="flex-1 flex justify-end">
                                            {hasAttendance ? (
                                                <span className={`
                                                px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border
                                                ${att!.status === 'working' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                                                ${att!.status === 'break' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' : ''}
                                                ${att!.status === 'logged_out' ? 'bg-slate-800/40 text-slate-400 border-slate-800' : ''}
                                            `}>
                                                    {att!.status === 'logged_out' ? 'offline' : att!.status}
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800/20 text-slate-600 border border-slate-900">
                                                    No Session
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>

            </div>
        </>

    )
}