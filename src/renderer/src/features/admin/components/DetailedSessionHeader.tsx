import { Dispatch, SetStateAction } from "react"


type Props = {
    searchQuery: string
    setSearchQuery: Dispatch<SetStateAction<string>>
}

export default function DetailedSessionHeader({ searchQuery, setSearchQuery }: Props) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h3 className="text-lg font-semibold text-foreground">Chronological Activity Log</h3>
                <p className="text-slate-400 text-xs mt-0.5">
                    Detailed window transition events for the day.
                </p>
            </div>

            {/* Search Input */}
            <div className="relative max-w-sm w-full">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search app or window title..."
                    className="w-full bg-card border border-border text-foreground text-sm px-4 py-2 pl-10 rounded-full focus:outline-none  placeholder-foreground/50 transition"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-foreground">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>
            </div>
        </div>
    )
}