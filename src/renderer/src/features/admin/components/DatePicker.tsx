import { ChevronLeft, ChevronRight } from 'lucide-react'
import React, { useState, useMemo } from 'react'

interface DatePickerProps {
  selectedDate: string // YYYY-MM-DD
  onSelectDate: (date: string) => void
  setShowCalender: React.Dispatch<React.SetStateAction<boolean>>
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const DAYS_OF_WEEK = [
  'Sun',
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat'
]

function getLocalDate() {
  const d = new Date()

  return `${d.getFullYear()}-${String(
    d.getMonth() + 1
  ).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`
}

function parseDate(dateString: string) {
  const [year, month, day] = dateString
    .split('-')
    .map(Number)

  return new Date(year, month - 1, day)
}

export const DatePicker: React.FC<DatePickerProps> = ({
  selectedDate,
  onSelectDate,
  setShowCalender
}) => {

  const calendarRef = React.useRef<HTMLDivElement>(null)

  const initialDate = useMemo(() => {
    if (selectedDate) {
      return parseDate(selectedDate)
    }

    return new Date()
  }, [selectedDate])

  const [currentYear, setCurrentYear] = useState(
    initialDate.getFullYear()
  )

  const [currentMonth, setCurrentMonth] = useState(
    initialDate.getMonth()
  )

  const todayString = getLocalDate()

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear((prev) => prev - 1)
    } else {
      setCurrentMonth((prev) => prev - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear((prev) => prev + 1)
    } else {
      setCurrentMonth((prev) => prev + 1)
    }
  }

  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(
      currentYear,
      currentMonth + 1,
      0
    ).getDate()

    const firstDayIndex = new Date(
      currentYear,
      currentMonth,
      1
    ).getDay()

    const daysInPrevMonth = new Date(
      currentYear,
      currentMonth,
      0
    ).getDate()

    const cells: {
      day: number
      dateString: string
      isCurrentMonth: boolean
    }[] = []

    // Previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i

      const month =
        currentMonth === 0
          ? 11
          : currentMonth - 1

      const year =
        currentMonth === 0
          ? currentYear - 1
          : currentYear

      cells.push({
        day,
        dateString: `${year}-${String(
          month + 1
        ).padStart(2, '0')}-${String(day).padStart(
          2,
          '0'
        )}`,
        isCurrentMonth: false
      })
    }

    // Current month
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push({
        day,
        dateString: `${currentYear}-${String(
          currentMonth + 1
        ).padStart(2, '0')}-${String(day).padStart(
          2,
          '0'
        )}`,
        isCurrentMonth: true
      })
    }

    // Next month
    const remaining = 42 - cells.length

    for (let day = 1; day <= remaining; day++) {
      const month =
        currentMonth === 11
          ? 0
          : currentMonth + 1

      const year =
        currentMonth === 11
          ? currentYear + 1
          : currentYear

      cells.push({
        day,
        dateString: `${year}-${String(
          month + 1
        ).padStart(2, '0')}-${String(day).padStart(
          2,
          '0'
        )}`,
        isCurrentMonth: false
      })
    }

    return cells
  }, [currentYear, currentMonth])


  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        calendarRef.current &&
        !calendarRef.current.contains(
          event.target as Node
        )
      ) {
        setShowCalender(false)
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside
    )

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside
      )
    }
  }, [])

  return (
    <div ref={calendarRef} className="border-t border-t-white/60 border-b border-b-border flex flex-col space-y-2 w-full bg-linear-to-b from-white/20 to-card backdrop-blur-lg rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between px-1 pb-2">
        <h4 className="text-sm font-bold text-slate-100">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h4>

        <div className="flex space-x-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 bg-white/10 cursor-pointer hover:bg-white/20 text-white rounded-full transition"
          >
            <ChevronLeft />
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 bg-white/10 cursor-pointer hover:bg-white/20 text-white rounded-full transition"
          >
            <ChevronRight />

          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell, idx) => {
          const isSelected =
            cell.dateString === selectedDate

          const isToday =
            cell.dateString === todayString

          return (
            <button
              key={idx}
              type="button"
              onClick={() =>
                onSelectDate(cell.dateString)
              }
              className={`
                aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition relative
                ${isSelected
                  ? 'bg-primary text-black shadow-md'
                  : ''
                }
                ${!isSelected && cell.isCurrentMonth
                  ? 'text-slate-300 hover:bg-primary/20'
                  : ''
                }
                ${!isSelected && !cell.isCurrentMonth
                  ? 'text-slate-600 hover:bg-white/10'
                  : ''
                }
              `}
            >
              {cell.day}

              {isToday && (
                <span
                  className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected
                    ? 'bg-white'
                    : 'bg-indigo-500'
                    }`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}