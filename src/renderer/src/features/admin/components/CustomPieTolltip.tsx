import { CustomPieTooltipProps } from "../types"

export const CustomPieTooltip = ({ active, payload }: CustomPieTooltipProps): React.JSX.Element | null => {
    if (active && payload && payload.length) {
        const data = payload[0].payload
        return (
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl">
                <div className="flex items-center space-x-2 text-xs">
                    <div
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: data.color }}
                    />
                    <span className="text-slate-400 font-medium">{data.name}:</span>
                    <span className="text-slate-100 font-bold">{data.value} min</span>
                </div>
            </div>
        )
    }
    return null
}

