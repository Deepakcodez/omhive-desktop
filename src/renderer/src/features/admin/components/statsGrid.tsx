import { StatsType } from "../types"


type Props = {
    stats: StatsType
}

export default function StatsGrid({ stats }: Props) {
    const isGoalMet = stats.workHourProgress >= 100
    const remainingAbs = Math.abs(stats.remainingSec)
    const remH = Math.floor(remainingAbs / 3600)
    const remM = Math.floor((remainingAbs % 3600) / 60)
    const remainingLabel = isGoalMet
        ? `+${remH}h ${remM}m over target`
        : remH > 0
            ? `${remH}h ${remM}m remaining`
            : `${remM}m remaining`

    const progressColor = isGoalMet
        ? 'bg-emerald-500'
        : stats.workHourProgress >= 70
            ? 'bg-indigo-500'
            : stats.workHourProgress >= 40
                ? 'bg-amber-400'
                : 'bg-rose-500'

    const iconColor = isGoalMet ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'

    return (
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Card 1: Active Time */}
            <div className="bg-card border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition duration-300">
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
            <div className="bg-card backdrop-blur-md border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition duration-300">
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
            <div className="bg-card backdrop-blur-md border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition duration-300">
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
            <div className="bg-card backdrop-blur-md border border-border p-5 rounded-2xl flex items-center space-x-4 shadow-lg transition duration-300">
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

            {/* Card 5: Work Target (9h) */}
            <div className="bg-card backdrop-blur-md border border-border p-5 rounded-2xl shadow-lg transition duration-300">
                <div className="flex items-center space-x-3 mb-3">
                    <div className={`p-3 rounded-xl ${iconColor}`}>
                        {isGoalMet ? (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                    d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        )}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Work Target</p>
                        <h3 className="text-2xl font-bold text-slate-100 tracking-tight mt-0.5">
                            {stats.workHourProgress}%
                            <span className="text-sm font-normal text-slate-400 ml-1">of 9h</span>
                        </h3>
                    </div>
                </div>
                {/* Progress bar */}
                <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-2 rounded-full transition-all duration-700 ${progressColor}`}
                        style={{ width: `${stats.workHourProgress}%` }}
                    />
                </div>
                <p className={`text-xs mt-2 font-medium ${isGoalMet ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {remainingLabel}
                </p>
            </div>
        </section>
    )
}