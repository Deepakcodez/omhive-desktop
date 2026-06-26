import { useMemo } from 'react'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from 'recharts'

import { useDailyActivitiesStore } from '../store'

type DetailedSession = {
    id: string
    attendanceId: string
    userId: string
    activityType: 'break' | 'work'
    startTime: number | Date
    endTime: number | Date
    duration: number
    software: string
    title: string
    hostname: string
    systemUsername: string
}

const COLORS = [
    '#3B82F6',
    '#22C55E',
    '#F59E0B',
    '#EF4444',
    '#8B5CF6',
    '#06B6D4',
    '#EC4899',
    '#84CC16',
]

function getAppColor(index: number) {
    return COLORS[index % COLORS.length]
}

export default function HourlyTimeline() {
    const { activityLog } = useDailyActivitiesStore()

    const uniqueApps = useMemo(() => {
        return [
            ...new Set(
                activityLog
                    .filter(
                        (a: DetailedSession) =>
                            a.activityType === 'work'
                    )
                    .map((a: DetailedSession) => a.software)
            ),
        ]
    }, [activityLog])

    const chartBins = useMemo(() => {
        const bins: any[] = []

        for (let hour = 0; hour < 24; hour++) {
            bins.push({
                time: `${hour
                    .toString()
                    .padStart(2, '0')}:00`,
            })
        }

        activityLog.forEach(
            (session: DetailedSession) => {
                const start = new Date(
                    session.startTime
                )

                const end = new Date(
                    session.endTime
                )

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
                        session.activityType ===
                        'break'
                            ? 'Idle'
                            : session.software

                    bins[hour][key] =
                        (bins[hour][key] || 0) +
                        minutes

                    current = segmentEnd
                }
            }
        )

        return bins
    }, [activityLog])

    const pieChartData = useMemo(() => {
        const map: Record<string, number> = {}

        activityLog.forEach(
            (item: DetailedSession) => {
                const key =
                    item.activityType ===
                    'break'
                        ? 'Idle'
                        : item.software

                map[key] =
                    (map[key] || 0) +
                    item.duration / 60
            }
        )

        return Object.entries(map)
            .map(([name, value], index) => ({
                name,
                value: Math.round(value),
                color:
                    name === 'Idle'
                        ? '#475569'
                        : getAppColor(index),
            }))
            .sort((a, b) => b.value - a.value)
    }, [activityLog])

    const totalMinutes = pieChartData.reduce(
        (acc, cur) => acc + cur.value,
        0
    )

    const activeMinutes = pieChartData
        .filter((x) => x.name !== 'Idle')
        .reduce(
            (acc, cur) => acc + cur.value,
            0
        )

    const activeRatio =
        totalMinutes === 0
            ? 0
            : Math.round(
                  (activeMinutes /
                      totalMinutes) *
                      100
              )

    return (
        <div className="grid grid-cols-2 gap-6">
            <div className=" bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-200">
                            Hourly Timeline
                        </h3>

                        <p className="text-slate-400 text-xs mt-0.5">
                            Distribution of
                            software and idle
                            time per hour.
                        </p>
                    </div>

                    <span className="text-xs font-semibold uppercase border border-border px-2.5 py-1 rounded-full bg-primary text-background">
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
                                    vertical={
                                        false
                                    }
                                />

                                <XAxis
                                    dataKey="time"
                                    fontSize={
                                        11
                                    }
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
                                />

                                <Tooltip />

                                <Legend />

                                {uniqueApps.map(
                                    (
                                        app,
                                        index
                                    ) => (
                                        <Bar
                                            key={
                                                app
                                            }
                                            dataKey={
                                                app
                                            }
                                            stackId="a"
                                            fill={getAppColor(
                                                index
                                            )}
                                        />
                                    )
                                )}

                                <Bar
                                    dataKey="Idle"
                                    stackId="a"
                                    fill="#475569"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-card border border-border rounded-2xl p-6 shadow-xl flex flex-col justify-between">
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

                            <Tooltip />
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

                <div className="space-y-2 max-h-32 overflow-y-auto">
                    {pieChartData.map(
                        (entry) => (
                            <div
                                key={
                                    entry.name
                                }
                                className="flex justify-between text-xs"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{
                                            backgroundColor:
                                                entry.color,
                                        }}
                                    />

                                    <span>
                                        {
                                            entry.name
                                        }
                                    </span>
                                </div>

                                <span className="font-semibold">
                                    {
                                        entry.value
                                    }
                                    m
                                </span>
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    )
}