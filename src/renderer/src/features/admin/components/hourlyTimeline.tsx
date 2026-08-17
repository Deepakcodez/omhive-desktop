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
import toast from 'react-hot-toast'



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
        <div className="bg-linear-to-b from-white/20 to-card border-t border-t-white/40 border-b border-b-neutral-900/5  backdrop-blur-md rounded-xl p-4 shadow-2xl min-w-[200px] text-xs">
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


export default function     HourlyTimeline() {
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

                console.log(data.data.length)
                setGraphData(data?.data)
            }
            if (!data.success) {
                toast.error(`Something went wrong - ${data.message}`)
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


    return (
        <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between ">
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

            </div>


            <div className=" bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col">
                <div className="w-full overflow-x-auto custom-scrollbar">
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


        </div>
    )
}