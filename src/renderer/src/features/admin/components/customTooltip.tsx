import { CustomTooltipProps } from "../types"

export const CustomTooltip = ({
  active,
  payload,
  label
}: CustomTooltipProps): React.JSX.Element | null => {


  if (active && payload && payload.length) {
    // Sort items by value descending (hide zero values)
    const activeItems = [...payload]
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)

    if (activeItems.length === 0) return null

    return (
      <div className="bg-slate-900/95  border border-slate-800 p-4 rounded-xl shadow-2xl ">
        <p className="font-semibold text-slate-200 mb-2 border-b border-slate-800 pb-1">{label}</p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {activeItems.map((entry, index) => (
            <div key={index} className="flex items-center justify-between space-x-6 text-xs">
              <div className="flex items-center space-x-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: entry.color || entry.fill }}
                />
                <span className="text-slate-400 font-medium truncate max-w-[120px]">
                  {entry.name}
                </span>
              </div>
              <span className="text-slate-100 font-bold">{entry.value} min</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}
