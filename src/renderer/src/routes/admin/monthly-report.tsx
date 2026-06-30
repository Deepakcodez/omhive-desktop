import { createFileRoute, Link } from "@tanstack/react-router";
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
    ArrowLeft,
    Clock,
    Coffee,
    Activity,
    AlertCircle,
    FileText,
    Percent,
    Search,
    X
} from "lucide-react";
import { DetailedSession } from "@renderer/features/admin/types";

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

const MONTHS = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
];

function RouteComponent() {
    const [users, setUsers] = useState<User[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [selectedUsername, setSelectedUsername] = useState<string>("");
    const currentLocalDate = new Date();
    const [month, setMonth] = useState<number>(() => currentLocalDate.getMonth() + 1);
    const [year, setYear] = useState<number>(() => currentLocalDate.getFullYear());

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
    const yearsList = useMemo(() => {
        const curYear = new Date().getFullYear();
        return [curYear - 2, curYear - 1, curYear, curYear + 1];
    }, []);

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
                <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border pb-6">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/admin"
                            className="p-2.5 bg-card  text-foreground  rounded-full border border-border transition cursor-pointer flex items-center justify-center shrink-0  "
                            title="Back to Dashboard"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
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
                        <div className="flex flex-col space-y-1.5 min-w-[130px]">
                            <label className="text-foreground text-xs font-semibold uppercase tracking-wider">
                                Month
                            </label>
                            <div className="relative">
                                <select
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                    className="appearance-none w-full bg-card border border-border text-foreground px-4 py-2.5 pr-10 rounded-xl font-medium text-sm cursor-pointer shadow-lg transition  focus:outline-none"
                                >
                                    {MONTHS.map((m) => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-border">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Year Select */}
                        <div className="flex flex-col space-y-1.5 min-w-[100px]">
                            <label className="text-foreground text-xs font-semibold uppercase tracking-wider">
                                Year
                            </label>
                            <div className="relative">
                                <select
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    className="appearance-none w-full bg-card border border-border text-foreground px-4 py-2.5 pr-10 rounded-xl font-medium text-sm cursor-pointer shadow-lg transition  focus:outline-none"
                                >
                                    {yearsList.map((y) => (
                                        <option key={y} value={y}>
                                            {y}
                                        </option>
                                    ))}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-border">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
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
                    <div className="bg-card border border-border rounded-2xl p-20 flex flex-col items-center justify-center text-center space-y-5 shadow-lg max-w-2xl mx-auto my-12">
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
                        {/* Stats Summary Section */}
                        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Card 1: Attendance Rate */}
                            <div className="bg-card border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition duration-300">
                                <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
                                    <Percent className="w-6 h-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Attendance Rate</p>
                                    <h3 className="text-2xl font-bold text-slate-100 mt-1">
                                        {report.summary?.totalDays > 0
                                            ? Math.round((report.summary.presentDays / report.summary.totalDays) * 100)
                                            : 0}%
                                    </h3>
                                    <p className="text-[10px] text-slate-500 mt-0.5">
                                        {report.summary?.presentDays || 0} of {report.summary?.totalDays || 0} days present
                                    </p>
                                </div>
                            </div>

                            {/* Card 2: Total Work Hours */}
                            <div className="bg-card border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition duration-300">
                                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Work Time</p>
                                    <h3 className="text-2xl font-bold text-slate-100 mt-1">
                                        {formatDuration(report.summary?.totalWorkSeconds || 0)}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Logged hours this month</p>
                                </div>
                            </div>

                            {/* Card 3: Total Break Hours */}
                            <div className="bg-card border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition duration-300">
                                <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
                                    <Coffee className="w-6 h-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Break Time</p>
                                    <h3 className="text-2xl font-bold text-slate-100 mt-1">
                                        {formatDuration(report.summary?.totalBreakSeconds || 0)}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Break durations this month</p>
                                </div>
                            </div>

                            {/* Card 4: Avg Work Day */}
                            <div className="bg-card border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition duration-300">
                                <div className="p-3 bg-sky-500/10 text-sky-400 rounded-xl">
                                    <Activity className="w-6 h-6" />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Avg Daily Hours</p>
                                    <h3 className="text-2xl font-bold text-slate-100 mt-1">
                                        {formatDuration(
                                            (report.summary?.totalWorkSeconds || 0) /
                                            (report.summary?.presentDays || 1)
                                        )}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 mt-0.5">Average work session duration</p>
                                </div>
                            </div>
                        </section>

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
    const [activities, setActivities] = useState<DetailedSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const fetchActivity = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await window.api.getUserActivity({
                    userId,
                    date,
                    attendanceId: '',
                    page: 1,
                    limit: 500
                });
                if (response.success && response.data) {
                    setActivities(response.data.data);
                } else {
                    setError(response.message || "No activity records found.");
                }
            } catch (err: any) {
                console.error("Error loading activity:", err);
                setError("Failed to fetch activity logs.");
            } finally {
                setLoading(false);
            }
        };
        fetchActivity();
    }, [userId, date]);

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
        <div className=" fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
            {/* Click outside to close */}
            <div className="absolute inset-0 cursor-default" onClick={onClose} />

            <div className="relative w-full max-w-7xl bg-linear-to-b from-white/15 to-card/50 overflow-hidden border border-border  rounded-2xl flex flex-col max-h-[85vh] shadow-2xl z-10 animate-fade-in backdrop-blur-[100px]">
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
                        className="p-2 bg-card border border-border  shadow-lg shadow-white/10  rounded-full transition cursor-pointer flex items-center justify-center"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search & Actions bar */}
                {!loading && !error && activities.length > 0 && (
                    <div className="px-6 py-4  flex items-center justify-between border-b border-border/40">
                        <span className="text-xs text-slate-400">
                            Showing {filteredLog.length} of {activities.length} activity transitions
                        </span>

                        <div className="relative w-72">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search application or title..."
                                className="w-full bg-card border border-border text-foreground text-xs px-3.5 py-1.5 pl-8 rounded-full focus:outline-none placeholder-foreground/45 transition"
                            />
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                <Search className="h-3.5 w-3.5" />
                            </div>
                        </div>
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
                        <div className="grid grid-cols-1  gap-6">
                            {/* Left Column: App Breakdown Pie Chart */}
                            <div className="lg:col-span-1 ">
                                <div className="bg-card/20 border border-border rounded-xl p-5 flex flex-col justify-between items-center h-full">
                                    <div className=" w-full text-center pb-2 border-b border-border/40">
                                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">App Usage Breakdown</h4>
                                    </div>

                                    <div className="w-full flex">

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