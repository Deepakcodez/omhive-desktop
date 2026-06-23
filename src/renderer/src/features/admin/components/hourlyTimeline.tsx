import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CustomTooltip } from './customTooltip'
import { getAppColor } from '../utils'
import { CustomPieTooltip } from './CustomPieTolltip'
import { ChartBin } from '../types'

type Props = {
    chartBins: ChartBin[],
    uniqueApps: string[],
    pieChartData: any[],
    stats: any
}

export default function HourlyTimeline({ chartBins, uniqueApps, pieChartData, stats }: Props) {
    return (
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
    )
}