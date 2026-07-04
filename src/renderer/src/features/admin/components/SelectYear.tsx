import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMonthlyReportStore } from '../store/monthlyReport'
import { useMemo } from 'react';


export default function SelectYear() {
    const year = useMonthlyReportStore((state) => state.year)
    const setYear = useMonthlyReportStore((state) => state.setYear)

    const yearsList = useMemo(() => {
        const curYear = new Date().getFullYear();
        return [curYear - 2, curYear - 1, curYear, curYear + 1];
    }, []);

    return (
        <div className="flex flex-col space-y-1.5 min-w-[100px]">

            <div className="relative">
                <Select
                    defaultValue={year.toString()}
                    onValueChange={(value) => setYear(Number(value))}
                >
                    <SelectTrigger
                        className="w-full bg-card border-y border-y-border text-slate-200 px-4 py-2.5    rounded-full font-medium focus:outline-none text-sm cursor-pointer shadow-lg transition disabled:opacity-50"
                    >
                        <SelectValue placeholder={'Choose a year'} />
                    </SelectTrigger>
                    <SelectContent className='bg-card/40 backdrop-blur-md border border-border/50'>
                        {yearsList.map((y) => (
                            <SelectItem key={y} value={y.toString()}>
                                {y}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

            </div>
        </div>
    )
}