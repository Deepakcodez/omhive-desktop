import { useEffect, useMemo, useState } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'

import { useDailyActivitiesStore } from '../store'
import { GraphData } from '@shared/types/graph'



const COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#06B6D4', // Cyan
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#6366F1', // Indigo
    '#84CC16', // Lime
]

const formatHour = (timeStr: string) => {
    const hour = parseInt(timeStr.split(':')[0], 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const formattedHour = hour % 12 === 0 ? 12 : hour % 12
    return `${formattedHour} ${ampm}`
}

// const formatMinutes = (mins: number) => {
//     if (mins < 60) return `${mins}m`
//     const hrs = Math.floor(mins / 60)
//     const remainingMins = mins % 60
//     return remainingMins > 0 ? `${hrs}h ${remainingMins}m` : `${hrs}h`
// }

const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null

    // Filter out items with 0 duration and sort by value descending
    const activeItems = payload
        .filter((item: any) => item.value && item.value > 0)
        .sort((a: any, b: any) => b.value - a.value)

    if (activeItems.length === 0) return null

    const total = activeItems.reduce((sum: number, item: any) => sum + item.value, 0)
    const formattedHour = formatHour(label)

    return (
        <div className="bg-linear-to-b from-white/20 to-card border-t border-t-white/40 border-b border-b-white/10  backdrop-blur-md rounded-xl p-4 shadow-2xl min-w-[200px] text-xs">
            <div className="flex justify-between items-center mb-2 border-b border-slate-800/60 pb-1.5">
                <span className="font-semibold text-slate-200">{formattedHour}</span>
                <span className="text-[10px] text-slate-400 font-medium">{Math.round(total)}m total</span>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {activeItems.map((item: any) => (
                    <div key={item.name} className="flex justify-between items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: item.color || item.fill }}
                            />
                            <span className="text-slate-300 truncate max-w-[120px] font-medium">
                                {item.name}
                            </span>
                        </div>
                        <span className="font-semibold text-slate-100 shrink-0">
                            {Math.round(item.value)}m
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// const CustomPieTooltip = ({ active, payload }: any) => {
//     if (!active || !payload || !payload.length) return null
//     const item = payload[0].payload
//     return (
//         <div className="bg-[#0f172a]/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl text-xs flex flex-col gap-1">
//             <div className="flex items-center gap-2">
//                 <div
//                     className="w-2.5 h-2.5 rounded-full"
//                     style={{ backgroundColor: item.color }}
//                 />
//                 <span className="font-semibold text-slate-200">{item.name}</span>
//             </div>
//             <div className="text-slate-400 font-medium">
//                 Time: <span className="text-slate-100 font-semibold">{formatMinutes(item.value)}</span>
//             </div>
//         </div>
//     )
// }

export default function HourlyTimeline() {
    const { selectedDate, selectedUserId, selectedAttendanceId } = useDailyActivitiesStore()
    const [graphData, setGraphData] = useState<GraphData[] | null>(null)
    useEffect(() => {

        const fetchGrpahData = async () => {
            const data = await window.api.getUserGraphActivity({
                userId: selectedUserId,
                date: selectedDate,
                attendanceId: selectedAttendanceId,
            })
            if (data.success && data.data) {
                setGraphData(data?.data)
            }
        }


        fetchGrpahData()
    }, [selectedDate, selectedUserId, selectedAttendanceId])

    // Generate a consistent mapping of software to color
    const appColors = useMemo(() => {
        const colorsMap: Record<string, string> = {
            Idle: '#475569', // Slate-600
            Break: '#f59e0b', // Amber-500
        }

        let appIndex = 0
        graphData?.forEach((item) => {
            const key = item.software === 'Break' || item.software === 'Idle'
                ? item.software
                : (item.activityType === 'break' ? 'Idle' : item.software)
            if (key !== 'Idle' && key !== 'Break' && !colorsMap[key]) {
                colorsMap[key] = COLORS[appIndex % COLORS.length]
                appIndex++
            }
        })
        return colorsMap
    }, [graphData])


    const uniqueApps = useMemo(() => {
        if (!graphData) return []
        return [
            ...new Set(
                graphData
                    .filter((a) => {
                        const key = a.software === 'Break' || a.software === 'Idle'
                            ? a.software
                            : (a.activityType === 'break' ? 'Idle' : a.software)
                        return key !== 'Idle' && key !== 'Break'
                    })
                    .map((a) => a.software)
            ),
        ]
    }, [graphData])

    const chartBins = useMemo(() => {
        const bins: any[] = []

        for (let hour = 0; hour < 24; hour++) {
            bins.push({
                time: `${hour
                    .toString()
                    .padStart(2, '0')}:00`,
            })
        }

        graphData?.forEach(
            (session) => {
                const start = new Date(
                    session.startTime
                )

                const end = session.endTime
                    ? new Date(session.endTime)
                    : new Date()

                let current = new Date(start)

                while (current < end) {
                    const hour =
                        current.getHours()

                    const nextHour =
                        new Date(current)

                    nextHour.setMinutes(60)
                    nextHour.setSeconds(0)
                    nextHour.setMilliseconds(0)

                    const segmentEnd =
                        nextHour < end
                            ? nextHour
                            : end

                    const minutes =
                        (segmentEnd.getTime() -
                            current.getTime()) /
                        60000

                    const key =
                        session.software === 'Break' || session.software === 'Idle'
                            ? session.software
                            : (session.activityType === 'break' ? 'Idle' : session.software)

                    bins[hour][key] =
                        (bins[hour][key] || 0) +
                        minutes

                    current = segmentEnd
                }
            }
        )

        return bins
    }, [graphData])

    // const pieChartData = useMemo(() => {
    //     const map: Record<string, number> = {}

    //     graphData.forEach(
    //         (item: DetailedSession) => {
    //             const key =
    //                 item.software === 'Break' || item.software === 'Idle'
    //                     ? item.software
    //                     : (item.activityType === 'break' ? 'Idle' : item.software)

    //             map[key] =
    //                 (map[key] || 0) +
    //                 item.duration / 60
    //         }
    //     )

    //     return Object.entries(map)
    //         .map(([name, value]) => ({
    //             name,
    //             value: Math.round(value),
    //             color: appColors[name] || '#475569',
    //         }))
    //         .sort((a, b) => b.value - a.value)
    // }, [graphData, appColors])

    // const totalMinutes = pieChartData.reduce(
    //     (acc, cur) => acc + cur.value,
    //     0
    // )

    // const activeMinutes = pieChartData
    //     .filter((x) => x.name !== 'Idle' && x.name !== 'Break')
    //     .reduce(
    //         (acc, cur) => acc + cur.value,
    //         0
    //     )

    // const activeRatio =
    //     totalMinutes === 0
    //         ? 0
    //         : Math.round(
    //             (activeMinutes /
    //                 totalMinutes) *
    //             100
    //         )

    return (
        <div className="grid grid-cols-1 gap-6">
            <div className=" bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-200">
                            Hourly Timeline
                        </h3>

                        <p className="text-slate-400 text-xs mt-0.5">
                            Distribution of
                            software, idle, and break
                            time per hour.
                        </p>
                    </div>

                    <span className="text-xs  border-y border-y-border px-2.5 py-0.5 rounded-full bg-white/10 text-foreground">
                        Minutes
                    </span>
                </div>

                <div className="w-full overflow-x-auto">
                    <div className="h-80 min-w-[900px]">
                        <ResponsiveContainer
                            width="100%"
                            height="100%"
                        >
                            <BarChart
                                data={chartBins}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: -20,
                                    bottom: 0,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#1E293B"
                                    vertical={
                                        false
                                    }
                                />

                                <XAxis
                                    dataKey="time"
                                    stroke="#64748B"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={formatHour}
                                    dy={10}
                                />

                                <YAxis
                                    domain={[
                                        0,
                                        60,
                                    ]}
                                    ticks={[
                                        0,
                                        15,
                                        30,
                                        45,
                                        60,
                                    ]}
                                    stroke="#64748B"
                                    fontSize={10}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(val) => `${val}m`}
                                    dx={-5}
                                />

                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: '#1E293B', opacity: 0.15 }}
                                />

                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    wrapperStyle={{
                                        fontSize: 11,
                                        paddingTop: 16,
                                        color: '#64748B'
                                    }}
                                />

                                {uniqueApps.map(
                                    (app) => (
                                        <Bar
                                            key={
                                                app
                                            }
                                            dataKey={
                                                app
                                            }
                                            stackId="a"
                                            fill={appColors[app] || '#3B82F6'}
                                            stroke="#0f172a"
                                            strokeWidth={1}
                                        />
                                    )
                                )}

                                <Bar
                                    dataKey="Idle"
                                    stackId="a"
                                    fill={appColors['Idle'] || '#475569'}
                                    stroke="#0f172a"
                                    strokeWidth={1}
                                />

                                <Bar
                                    dataKey="Break"
                                    stackId="a"
                                    fill={appColors['Break'] || '#f59e0b'}
                                    stroke="#0f172a"
                                    strokeWidth={1}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-200">
                        App Distribution
                    </h3>

                    <p className="text-slate-400 text-xs mt-0.5">
                        Total time spent per
                        application.
                    </p>
                </div>

                <div className="h-60 relative flex items-center justify-center">
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                    >
                        <PieChart>
                            <Pie
                                data={
                                    pieChartData
                                }
                                cx="50%"
                                cy="50%"
                                innerRadius={
                                    65
                                }
                                outerRadius={
                                    85
                                }
                                paddingAngle={
                                    3
                                }
                                dataKey="value"
                            >
                                {pieChartData.map(
                                    (
                                        entry,
                                        index
                                    ) => (
                                        <Cell
                                            key={
                                                index
                                            }
                                            fill={
                                                entry.color
                                            }
                                        />
                                    )
                                )}
                            </Pie>

                            <Tooltip content={<CustomPieTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="absolute flex flex-col items-center">
                        <span className="text-2xl font-black text-slate-100">
                            {
                                activeRatio
                            }
                            %
                        </span>

                        <span className="text-[10px] uppercase text-slate-500">
                            Active
                        </span>
                    </div>
                </div>

                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {pieChartData.map(
                        (entry) => {
                            const pct = totalMinutes > 0 ? Math.round((entry.value / totalMinutes) * 100) : 0
                            return (
                                <div
                                    key={
                                        entry.name
                                    }
                                    className="flex justify-between text-xs items-center hover:bg-slate-800/40 px-2 py-1 -mx-2 rounded-md transition-colors"
                                >
                                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                                        <div
                                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                            style={{
                                                backgroundColor:
                                                    entry.color,
                                            }}
                                        />

                                        <span className="truncate text-slate-300 font-medium">
                                            {
                                                entry.name
                                            }
                                        </span>
                                        <span className="text-slate-500 text-[10px] font-normal flex-shrink-0">
                                            ({pct}%)
                                        </span>
                                    </div>

                                    <span className="font-semibold text-slate-200 flex-shrink-0">
                                        {
                                            formatMinutes(entry.value)
                                        }
                                    </span>
                                </div>
                            )
                        }
                    )}
                </div>
            </div> */}
        </div>
    )
}