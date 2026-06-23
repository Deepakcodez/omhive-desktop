
type Props = {
    displayedLog: any,

}

export default function DetailedLogTable({ displayedLog }: Props) {
    return (
        <section className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-4">


            <div className="border border-border rounded-xl overflow-hidden bg-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-border bg-card text-slate-400 text-[11px] font-bold uppercase tracking-wider">
                                <th className="py-3.5 px-4">Time Window</th>
                                <th className="py-3.5 px-4">Application</th>
                                  <th className="py-3.5 px-4">Window Title</th>
                                <th className="py-3.5 px-4 text-right">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50 text-xs text-slate-300">
                            {displayedLog.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="py-8 text-center text-slate-500 font-medium">
                                        No matching sessions found.
                                    </td>
                                </tr>
                            ) : (
                                displayedLog.map((session, idx) => {
                                    const startTimeStr = new Date(session.startTime).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })
                                    const endTimeStr = new Date(session.endTime).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })

                                    const min = Math.floor(session.duration / 60)
                                    const sec = Math.round(session.duration % 60)
                                    const durStr = min > 0 ? `${min}m ${sec}s` : `${sec}s`

                                    return (
                                        <tr key={idx} className="hover:bg-slate-900/20 transition duration-150">
                                            <td className="py-3.5 px-4 font-mono text-slate-400">
                                                {startTimeStr} - {endTimeStr}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-indigo-300">
                                                {session.software}
                                            </td>
                                            <td
                                                className="py-3.5 px-4 truncate max-w-xs sm:max-w-md md:max-w-lg"
                                                title={session.title}
                                            >
                                                {session.title || (
                                                    <span className="text-slate-600 italic">No Title</span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-bold text-slate-200">
                                                {durStr}
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}