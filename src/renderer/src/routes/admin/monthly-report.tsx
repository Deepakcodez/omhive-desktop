import { createFileRoute,  useRouter } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { User, UserSelector } from "../../features/admin/components/UserSelector";
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
} from 'recharts';
import {
    AlertCircle,
    FileText,
    Search,
    X,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { limitsRange, MONTHS } from "@/features/admin/constants";
import { useMonthlyReportStore } from "@/features/admin/store/monthlyReport";
import SelectYear from "@/features/admin/components/SelectYear";
import SelectMonth from "@/features/admin/components/selectMonth";
import Button from "@/components/ui/button";

export const Route = createFileRoute('/admin/monthly-report')({
    component: RouteComponent
})

const getMonthlyRePort = async ({ userId, month, year }: { userId: string, month: number, year: number }) => {
    try {
        const report = await window.api.getUserMonthlyReport({ userId, month, year })
        return report
    } catch (error: any) {
        throw new Error(error.message || "something went wrong")
    }
}


function RouteComponent() {
    const router = useRouter();
    const year = useMonthlyReportStore((state) => state.year)
    const month = useMonthlyReportStore((state) => state.month)

    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedUsername, setSelectedUsername] = useState<string>("");

    const [report, setReport] = useState<any>(null);
    const [loadingReport, setLoadingReport] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);
    const [selectedActivityDate, setSelectedActivityDate] = useState<string | null>(null);

    // Fetch users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const res = await window.api.listUser();
                if (res.success && res.data) {
                    setUsers(res.data);
                }
            } catch (err: any) {
                console.error("Failed to load users:", err);
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    // Fetch report data when inputs change
    useEffect(() => {
        if (!selectedUserId) {
            setReport(null);
            return;
        }

        const fetchReport = async () => {
            setLoadingReport(true);
            setReportError(null);
            try {
                const res = await getMonthlyRePort({ userId: selectedUserId, month, year });
                if (res.success) {
                    setReport(res.data);
                } else {
                    setReportError(res.message || "Failed to fetch report");
                }
            } catch (err: any) {
                console.error("Failed to fetch monthly report:", err);
                setReportError(err.message || "Something went wrong while fetching the report.");
            } finally {
                setLoadingReport(false);
            }
        };

        fetchReport();
    }, [selectedUserId, month, year]);

    // Format seconds to hours and minutes
    const formatDuration = (seconds: number) => {
        if (seconds <= 0 || isNaN(seconds)) return "0h 0m";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h}h ${m}m`;
    };

    // Format ISO time to clean string
    const formatTime = (isoString: string | null) => {
        if (!isoString) return "-";
        try {
            const date = new Date(isoString);
            if (isNaN(date.getTime())) return isoString;
            return date.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });
        } catch {
            return isoString;
        }
    };

    // Format date to local readable format
    const formatRecordDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric"
            });
        } catch {
            return dateStr;
        }
    };

    // Year choices (currentYear - 2 to currentYear + 1)


    const chartData = useMemo(() => {
        if (!report || !report.attendance) return [];
        return report.attendance
            .slice()
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .map((att: any) => {
                const dateObj = new Date(att.date);
                const dayLabel = isNaN(dateObj.getTime())
                    ? att.date
                    : dateObj.toLocaleDateString([], { day: 'numeric', month: 'short' });

                return {
                    name: dayLabel,
                    "Work Hours": att.isPresent ? Math.round((att.totalWorkSeconds / 3600) * 10) / 10 : 0,
                    "Break Hours": att.isPresent ? Math.round((att.totalBreakSeconds / 3600) * 10) / 10 : 0,
                };
            });
    }, [report]);


    return (
        <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200 select-none pb-12">
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4  pb-6">
                    <div className="flex items-center space-x-4">
                        <Button
                            onClick={() => router.history.back()}
                            title='Back'
                            className='aspect-square p-1.5 fixed top-2 left-2 '>
                            <ChevronLeft />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-white">Monthly Report</h1>
                            <p className="text-slate-400 text-sm mt-0.5">
                                Show monthly attendance summaries, work logs, and active session ratios.
                            </p>
                        </div>
                    </div>

                    {/* Filter controls */}
                    <div className="flex flex-wrap items-end gap-4 min-w-[320px] lg:min-w-[500px]">
                        <div className="flex-1 min-w-[200px]">
                            <UserSelector
                                users={users}
                                selectedUserId={selectedUserId}
                                setUsername={setSelectedUsername}
                                onSelectUser={setSelectedUserId}
                                loading={loadingUsers}
                            />
                        </div>

                        {/* Month Select */}
                        <SelectMonth />

                        {/* Year Select */}
                        <SelectYear />
                    </div>
                </header>






                {/* Dashboard body */}
                {reportError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-2xl flex items-center space-x-3 shadow-lg">
                        <AlertCircle className="w-6 h-6 shrink-0" />
                        <div>
                            <h4 className="font-bold">Failed to load report</h4>
                            <p className="text-xs mt-0.5">{reportError}</p>
                        </div>
                    </div>
                )}

                {loadingReport ? (
                    <div className="bg-card border border-border rounded-2xl p-24 flex flex-col items-center justify-center text-center space-y-4 shadow-lg animate-fade-in">
                        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-slate-400 text-sm font-medium">Fetching monthly attendance report...</p>
                    </div>
                ) : !selectedUserId ? (
                    <div className="bg-card border border-border rounded-2xl p-20 flex flex-col items-center justify-center text-center space-y-5 shadow-lg max-w-7xl mx-auto my-12">
                        <div className="p-4 bg-slate-900/60 rounded-full border border-slate-800 text-indigo-400 shadow-inner">
                            <FileText className="w-12 h-12" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-slate-200">No User Selected</h3>
                            <p className="text-slate-400 text-sm max-w-sm">
                                Please select a user from the dropdown menu above to generate and view their monthly attendance summary.
                            </p>
                        </div>
                    </div>
                ) : report ? (
                    <div className="space-y-8 animate-fade-in">


                        {/* Visualization Graph */}
                        {chartData.length > 0 && (
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4 animate-fade-in">
                                <div>
                                    <h3 className="text-lg font-semibold text-slate-200">Monthly Time Distribution</h3>
                                    <p className="text-slate-400 text-xs mt-0.5">
                                        Daily comparison of active work hours vs break hours.
                                    </p>
                                </div>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                                            <XAxis
                                                dataKey="name"
                                                stroke="#64748B"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#64748B"
                                                fontSize={10}
                                                tickLine={false}
                                                axisLine={false}
                                                unit="h"
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#090D16',
                                                    borderColor: '#1E293B',
                                                    borderRadius: '12px',
                                                    color: '#F8FAFC',
                                                    fontSize: '11px',
                                                }}
                                                cursor={{ fill: '#1E293B', opacity: 0.15 }}
                                            />
                                            <Legend
                                                iconType="circle"
                                                iconSize={8}
                                                wrapperStyle={{ fontSize: 11, paddingTop: 10 }}
                                            />
                                            <Bar dataKey="Work Hours" stackId="a" fill="#6366f1" radius={[0, 0, 0, 0]} />
                                            <Bar dataKey="Break Hours" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Table Section */}
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-xl font-bold text-slate-100 flex items-center space-x-2">
                                    <span className="pe-2"> {selectedUsername.toUpperCase() || 'User '} </span> <span>Detailed Work Log</span>
                                    <span className="bg-indigo-500/10 text-indigo-400 text-[10px] px-2 py-0.5 border border-indigo-500/25 rounded-md">
                                        {MONTHS.find(m => m.value === month)?.label} {year}
                                    </span>
                                </h2>
                                <p className="text-slate-400 text-xs mt-0.5">
                                    Chronological daily overview of checked-in times, work hours, breaks, and device environment details.
                                </p>
                            </div>

                            <div className="w-full rounded-2xl bg-card border border-border p-6 shadow-xl">
                                {report.attendance?.length === 0 ? (
                                    <div className="py-12 text-center text-slate-500 font-medium">
                                        No attendance records found for this user in the selected month.
                                    </div>
                                ) : (
                                    /* Table Container using Flexbox */
                                    <div className="flex flex-col border border-border rounded-xl overflow-hidden bg-slate-950/20">
                                        {/* Header Row */}
                                        <div className="flex items-center bg-background px-5 py-3.5 border-b border-border text-[10px] font-bold text-foreground uppercase tracking-wider text-left select-none">
                                            <div className="flex-[1.2] min-w-0">Date</div>
                                            <div className="flex-1">Check In</div>
                                            <div className="flex-1">Check Out</div>
                                            <div className="flex-1">Work Time</div>
                                            <div className="flex-1">Break Time</div>
                                            <div className="flex-[1.5] min-w-0">Device Info</div>
                                            <div className="flex-1 flex justify-end">Status</div>
                                            <div className="w-24 flex justify-end">Details</div>
                                        </div>

                                        {/* Data Rows */}
                                        <div className="divide-y divide-border text-xs text-foreground">
                                            {report.attendance
                                                .slice()
                                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                                .map((att, idx) => {
                                                    return (
                                                        <div
                                                            key={att.id || idx}
                                                            className="flex items-center px-5 py-4 bg-card  transition duration-150 select-none"
                                                        >
                                                            {/* Column 1: Date */}
                                                            <div className="flex-[1.2] min-w-0 flex items-center space-x-2 font-semibold text-slate-200">
                                                                <span>{formatRecordDate(att.date)}</span>
                                                            </div>

                                                            {/* Column 2: Check-In */}
                                                            <div className="flex-1 font-mono text-slate-300">
                                                                {att.isPresent ? formatTime(att.loginTime) : "-"}
                                                            </div>

                                                            {/* Column 3: Check-Out */}
                                                            <div className={`flex-1 font-mono ${att.isPresent && !att.logoutTime ? 'text-indigo-400 font-semibold' : 'text-slate-300'}`}>
                                                                {att.isPresent ? (att.logoutTime ? formatTime(att.logoutTime) : "Active") : "-"}
                                                            </div>

                                                            {/* Column 4: Work duration */}
                                                            <div className="flex-1 font-medium text-slate-300">
                                                                {att.isPresent ? formatDuration(att.totalWorkSeconds) : "-"}
                                                            </div>

                                                            {/* Column 5: Break duration */}
                                                            <div className="flex-1 font-medium text-slate-400">
                                                                {att.isPresent ? `${Math.floor(att.totalBreakSeconds / 60)}m` : "-"}
                                                            </div>

                                                            {/* Column 6: Device Info */}
                                                            <div className="flex-[1.5] min-w-0 text-slate-500 font-medium truncate flex flex-col justify-center space-y-0.5" title={`${att.os || ''} | Host: ${att.hostname || ''} | User: ${att.systemUsername || ''}`}>
                                                                {att.isPresent ? (
                                                                    <>
                                                                        <span className="truncate text-slate-400 leading-tight flex items-center space-x-1">
                                                                            <span className="text-[10px] text-slate-500 capitalize">{att.os || "Unknown OS"}</span>
                                                                            <span className="text-slate-600">•</span>
                                                                            <span className="truncate">{att.hostname || "Unknown Host"}</span>
                                                                        </span>
                                                                        <span className="text-[9px] text-slate-600 truncate leading-none">
                                                                            System User: {att.systemUsername || "-"}
                                                                        </span>
                                                                    </>
                                                                ) : "-"}
                                                            </div>

                                                            {/* Column 7: Status */}
                                                            <div className="flex-1 flex justify-end">
                                                                <span className={`
                                                                    px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border
                                                                    ${!att.isPresent ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                                                                    ${att.isPresent && att.status === 'working' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : ''}
                                                                    ${att.isPresent && att.status === 'break' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : ''}
                                                                    ${att.isPresent && att.status === 'logged_out' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : ''}
                                                                `}>
                                                                    {!att.isPresent ? 'absent' : (att.status === 'logged_out' ? 'present' : att.status)}
                                                                </span>
                                                            </div>

                                                            {/* Column 8: Details Action */}
                                                            <div className="w-24 flex justify-end shrink-0">
                                                                {att.isPresent ? (
                                                                    <button
                                                                        onClick={() => setSelectedActivityDate(att.date)}
                                                                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 hover:scale-[1.03] text-white rounded-lg text-[10px] font-semibold transition duration-150 cursor-pointer"
                                                                    >
                                                                        Detail
                                                                    </button>
                                                                ) : (
                                                                    <span className="text-slate-600 text-[10px] pr-3">-</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : null}

                {selectedActivityDate && (
                    <ActivityModal
                        userId={selectedUserId}
                        userName={selectedUsername}
                        date={selectedActivityDate}
                        onClose={() => setSelectedActivityDate(null)}
                    />
                )}
            </div>
        </div>
    );
}

// ActivityModal Component to display daily activity details
function ActivityModal({
    userId,
    userName,
    date,
    onClose
}: {
    userId: string;
    userName: string;
    date: string;
    onClose: () => void
}) {
    const total = useMonthlyReportStore((s) => s.total)
    const limit = useMonthlyReportStore((s) => s.limit)
    const page = useMonthlyReportStore((s) => s.page)
    const activities = useMonthlyReportStore((s) => s.activities)
    const searchQuery = useMonthlyReportStore((s) => s.searchQuery)

    const setTotal = useMonthlyReportStore((s) => s.setTotal)
    const setLimit = useMonthlyReportStore((s) => s.setLimit)
    const setPage = useMonthlyReportStore((s) => s.setPage)
    const setActivities = useMonthlyReportStore((s) => s.setActivities)
    const setSearchQuery = useMonthlyReportStore((s) => s.setSearchQuery)

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const totalPages = useMemo(() => {
        return Math.max(1, Math.ceil(total / limit))
    }, [total, limit])


    const handlePageChange = (action: "next" | "prev") => {
        if (action === "next") {
            if (page >= totalPages) return
            setPage(page + 1)
        } else {
            if (page <= 1) return
            setPage(page - 1)
        }
    }
    useEffect(() => {
        setPage(1)
    }, [date])
    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await window.api.getUserActivity({
                    userId,
                    date,
                    attendanceId: '',
                    page,
                    limit
                });
                if (response.success && response.data) {
                    setActivities(response.data.data);
                    setTotal(response.data.total || 0);
                } else {
                    setError(response.message || "No activity records found.");
                    setTotal(0);
                }
            } catch (err: any) {
                console.error("Error loading activity:", err);
                setError("Failed to fetch activity logs.");
                setTotal(0);
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, [userId, date, limit, page]);

    const filteredLog = useMemo(() => {
        return activities.filter((s) => {
            const q = searchQuery.toLowerCase();
            return (s.software || "").toLowerCase().includes(q) || (s.title || "").toLowerCase().includes(q);
        });
    }, [activities, searchQuery]);

    // Compute daily app distribution for Pie Chart
    const pieChartData = useMemo(() => {
        const totals: Record<string, number> = {};
        activities.forEach((s) => {
            totals[s.software] = (totals[s.software] || 0) + s.duration;
        });

        const colors = [
            '#6366f1', // Indigo
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#ec4899', // Pink
            '#3b82f6', // Blue
            '#8b5cf6', // Violet
            '#f43f5e', // Rose
            '#06b6d4', // Cyan
            '#84cc16', // Lime
            '#14b8a6'  // Teal
        ];

        return Object.entries(totals).map(([name, val], idx) => ({
            name,
            value: Math.round((val / 60) * 10) / 10, // seconds to minutes
            color: colors[idx % colors.length]
        })).sort((a, b) => b.value - a.value);
    }, [activities]);

    const formatTime = (timeMs: number | Date) => {
        try {
            const d = new Date(timeMs as any);
            if (isNaN(d.getTime())) return String(timeMs);
            return d.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        } catch {
            return String(timeMs);
        }
    };

    const formatDuration = (seconds: number) => {
        if (seconds <= 0 || isNaN(seconds)) return "0s";
        const min = Math.floor(seconds / 60);
        const sec = Math.round(seconds % 60);
        return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
    };

    return (
        <div className=" fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 p-4 bg-black/75 backdrop-blur-xs select-none">
            {/* Click outside to close */}
            <div className="absolute inset-0 cursor-default " onClick={onClose} />

            <div className="relative w-full max-w-370 bg-linear-to-b from-white/15 to-card/50 overflow-hidden border border-border/40  rounded-2xl flex flex-col max-h-[85vh] shadow-2xl z-10 animate-fade-in backdrop-blur-[100px]">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border ">
                    <div>
                        <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
                            {userName.toUpperCase() || 'USER'} - DAILY ACTIVITY LOG
                        </h3>
                        <p className="text-slate-400 text-xs mt-0.5">
                            Window tracking details for {date}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-card border-y border-y-border shadow-lg shadow-black/10  rounded-full transition cursor-pointer flex items-center justify-center active:scale-95
                        
                        "
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search & Actions bar */}
                {!loading && !error && activities.length > 0 && (
                    <div className="px-6 py-4  flex items-center justify-between border-b border-border/40">



                        <div className="relative w-72">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search application or title..."
                                className="w-full bg-card border-y border-border text-foreground text-xs px-3.5 py-2 pl-8 rounded-full focus:outline-none placeholder-foreground/45 transition"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                <Search className="h-3.5 w-3.5" />
                            </div>
                        </div>

                        <section className="flex-1 flex justify-between items-center ml-6">
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

                                <div className="bg-card border-y border-y-border rounded-full px-2 shadow-lg shadow-black/10">

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
                                <div className="flex  bg-card border-y border-y-border rounded-full shadow-lg shadow-black/10">
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
                )}

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-6 min-h-[300px] custom-scrollbar">
                    {loading ? (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center space-y-3">
                            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-slate-500 text-xs">Loading activity logs...</span>
                        </div>
                    ) : error ? (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center space-y-2 text-slate-500">
                            <span className="text-sm font-semibold">{error}</span>
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center text-slate-500">
                            <span className="text-sm font-semibold">No activity logs recorded for this day.</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left Column: App Breakdown Pie Chart */}
                            <div className="lg:col-span-1 relative">
                                <div className="sticky top-0 bg-linear-to-b from-white/10 via-card to-card border border-border rounded-xl p-5 flex flex-col justify-between items-center h-fit">
                                    <div className=" w-full text-center pb-2 border-b border-border/40">
                                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">App Usage Breakdown</h4>
                                    </div>


                                    <div className="w-full flex ">

                                        <div className="h-44 w-6/12 relative flex items-center justify-center my-4 shrink-0">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={pieChartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={45}
                                                        outerRadius={60}
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
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: '#090D16',
                                                            borderColor: '#1E293B',
                                                            borderRadius: '12px',
                                                            color: '#F8FAFC',
                                                            fontSize: '11px',
                                                        }}
                                                    />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>

                                        {/* List of applications */}
                                        <div className="h-44 w-6/12 relative flex flex-col  justify-between  my-4 shrink-0  custom-scrollbar">
                                            {pieChartData.map((entry, index) => (
                                                <div key={index} className="flex items-center justify-between text-[10px]">
                                                    <div className="flex items-center space-x-2 min-w-0">
                                                        <div
                                                            className="w-2 h-2 rounded-full shrink-0"
                                                            style={{ backgroundColor: entry.color }}
                                                        />
                                                        <span className="text-slate-300 truncate max-w-[120px]" title={entry.name}>{entry.name}</span>
                                                    </div>
                                                    <span className="text-slate-400 font-bold shrink-0">{entry.value}m</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Right Column: Detailed activity log list */}
                            <div className="lg:col-span-2">
                                <div className="border border-border rounded-xl overflow-hidden ">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-border bg-linear-to-b from-white/10 to-transparent text-white text-[10px] font-bold uppercase tracking-wider">
                                                    <th className="py-3 px-4">Time Window</th>
                                                    <th className="py-3 px-4">Application</th>
                                                    <th className="py-3 px-4">Window Title</th>
                                                    <th className="py-3 px-4 text-right">Duration</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border text-[11px] text-slate-300">
                                                {filteredLog.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                                                            No matching activity logs found.
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    filteredLog.map((session, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-900/40 transition duration-150">
                                                            <td className="py-3 px-4 font-mono text-slate-400">
                                                                {formatTime(session.startTime)} - {formatTime(session.endTime)}
                                                            </td>
                                                            <td className="py-3 px-4 font-semibold text-indigo-300">
                                                                {session.software}
                                                            </td>
                                                            <td className="py-3 px-4 truncate max-w-xs sm:max-w-md md:max-w-lg" title={session.title}>
                                                                {session.title || <span className="text-slate-600 italic">No Title</span>}
                                                            </td>
                                                            <td className="py-3 px-4 text-right font-bold text-slate-200">
                                                                {formatDuration(session.duration)}
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>



                            </div>
                        </div>
                    )}
                </div>
            </div>



        </div>
    );
}