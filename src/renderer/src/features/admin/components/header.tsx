import { Link } from '@tanstack/react-router'

type Props = {}

export default function Header({ }: Props) {
    return (
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4  pb-6">
            <div className="space-y-1">
                <h1 className="text-3xl tracking-tight">Omhive Activity Center</h1>
                <p className="text-slate-400 text-sm">
                    Visualizing work sessions, app usage, and desktop idle state.
                </p>
            </div>

            <Link
                to="/admin/monthly-report"
                title='Monthly Report'
                className='bg-card rounded-full px-4 py-2 border border-border text-sm cursor-default'>
                See Monthly Report
            </Link>
        </header>

    )
}