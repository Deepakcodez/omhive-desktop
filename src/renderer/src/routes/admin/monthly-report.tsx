import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { User, UserSelector } from "../../components/admin/UserSelector";
import {
    ArrowLeft,
    Clock,
    Coffee,
    Activity,
    AlertCircle,
    FileText,
    Percent
} from "lucide-react";

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


    return (
        <div className="min-h-screen bg-background text-foreground font-sans antialiased selection:bg-indigo-500/30 selection:text-indigo-200 select-none pb-12">
            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">
                {/* Header */}
                <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-border pb-6">
                    <div className="flex items-center space-x-4">
                        <Link
                            to="/admin"
                            className="p-2.5 bg-card  text-foreground  rounded-full border border-border transition cursor-pointer flex items-center justify-center shrink-0"
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
            </div>
        </div>
    );
}