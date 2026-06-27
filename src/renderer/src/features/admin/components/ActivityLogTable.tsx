import { useEffect, useMemo, useState } from "react";
import { useDailyActivitiesStore } from "../store";
import { ChevronLeft, ChevronRight, Search, } from "lucide-react";
import { DetailedSession } from "../types";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";


const limitsRange = [20, 50, 100, 150, 200]


export default function ActivityLogTable() {
    const { selectedDate, selectedUserId, activityLog, setActivityLog, searchQuery, setSearchQuery, selectedAttendanceId } = useDailyActivitiesStore()
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(50)
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)

    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(total / limit))
    }, [total, limit])

    const fetchActivities = async () => {
        if (!selectedUserId) {
            setActivityLog([])
            setTotal(0)
            return
        }

        try {
            setLoading(true)

            const response = await window.api.getUserActivity({
                userId: selectedUserId,
                date: selectedDate,
                attendanceId: selectedAttendanceId,
                page,
                limit
            })

            console.log("activity--->>>", response)
            setActivityLog(response.data?.data || [])
            setTotal(response.data?.total || 0)
        } finally {
            setLoading(false)
        }
    }

    const handlePageChange = (action: "next" | "prev") => {
        if (action === "next") {
            if (page >= totalPages) return
            setPage((p) => p + 1)
        } else {
            if (page <= 1) return
            setPage((p) => p - 1)
        }
    }

    useEffect(() => {
        setPage(1)
    }, [selectedDate, selectedUserId])
    useEffect(() => {
        fetchActivities()
    }, [selectedDate, selectedUserId, page, limit, selectedAttendanceId])

    const displayedLog = useMemo((): DetailedSession[] => {
        return activityLog.filter((s) => {
            const query = searchQuery.toLowerCase()
            return s.software.toLowerCase().includes(query) || s.title.toLowerCase().includes(query)
        })
    }, [activityLog, searchQuery])

    return (
        <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
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
                        className="w-full bg-card border-y border-y-border text-foreground text-sm px-4 py-2 pl-10 rounded-full focus:outline-none  placeholder-foreground/50 transition"
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground">
                        <Search size={15} />
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
                                {
                                        loading ? (
                                        <tr>
                                            <td colSpan={4} className=" h-120 py-8 text-center text-foreground font-medium">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <Spinner />
                                                    Fetching User Activities...
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                        : displayedLog.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                                                    No matching sessions found.
                                                </td>
                                            </tr>
                                        ) : (
                                            displayedLog.map((session, idx: number) => {
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

            <section className="flex justify-between items-center mt-4">
                <div className="flex items-center gap-4">
                    <p className="text-sm text-slate-400">
                        Showing{" "}
                        {total === 0
                            ? 0
                            : (page - 1) * limit + 1}
                        {" - "}
                        {Math.min(page * limit, total)}
                        {" of "}
                        {total} activities
                    </p>

                    <div className="bg-card border-y border-y-border rounded-full px-2">

                        <Select onValueChange={(value) => {
                            setPage(1)
                            setLimit(Number(value))
                        }}>
                            <SelectTrigger className="w-[180px] border-none outline-none focus:outline-none focus:ring-0 ">
                                <SelectValue placeholder={`${limit} / page`} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectGroup>
                                    {limitsRange.map((item) => (
                                        <SelectItem key={item} value={item.toString()}>
                                            {item} / page
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>

                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">
                        Page {page} of {totalPages}
                    </span>
                    <div className="flex  bg-card border-y border-y-border rounded-full">
                        <button
                            title="Prev Page"
                            disabled={page === 1}
                            onClick={() =>
                                handlePageChange("prev")
                            }
                            className="hover:bg-white/10 rounded-full p-2 disabled:opacity-50"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <button
                            title="Next Page"
                            disabled={page >= totalPages}
                            onClick={() =>
                                handlePageChange("next")
                            }
                            className="hover:bg-white/10 rounded-full p-2 disabled:opacity-50"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </section>
        </div>
    )
}