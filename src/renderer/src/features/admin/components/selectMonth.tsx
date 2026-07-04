import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MONTHS } from '../constants'
import { useMonthlyReportStore } from '../store/monthlyReport'

type Props = {}

export default function SelectMonth({ }: Props) {
    const month = useMonthlyReportStore((state) => state.month)
    const setMonth = useMonthlyReportStore((state) => state.setMonth)

    return (
        <div className="flex flex-col  ">

            <div className="relative">
                <Select
                    defaultValue={month.toString()}
                    onValueChange={(val) => setMonth(Number(val))}

                >
                    <SelectTrigger
                        className="w-full bg-card border-y border-y-border text-slate-200 px-4 py-2.5    rounded-full font-medium focus:outline-none text-sm cursor-pointer shadow-lg transition disabled:opacity-50"
                    >
                        <SelectValue placeholder={'Choose a month'} />
                    </SelectTrigger>
                    <SelectContent className='bg-card/40 backdrop-blur-md border border-border/50'>
                        {MONTHS.map((m) => (
                            <SelectItem key={m.value} value={m.value.toString()}>
                                {m.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

            </div>
        </div>
    )
}