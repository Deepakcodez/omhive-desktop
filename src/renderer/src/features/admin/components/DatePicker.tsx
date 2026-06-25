import React, { useState, useMemo } from 'react'

interface DatePickerProps {
  selectedDate: string // YYYY-MM-DD format
  onSelectDate: (date: string) => void
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const DatePicker: React.FC<DatePickerProps> = ({ selectedDate, onSelectDate }) => {
  // Parse initial state date or default to today
  const initialDate = useMemo(() => {
    if (selectedDate) {
      const parsed = new Date(selectedDate)
      if (!isNaN(parsed.getTime())) return parsed
    }
    return new Date()
  }, [selectedDate])

  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear())
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth()) // 0-11

  // Handle month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }

  // Generate calendar days
  const calendarCells = useMemo(() => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay()
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate()

    const cells: { day: number; dateString: string; isCurrentMonth: boolean }[] = []

    // Previous month's overlapping days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i
      const month = currentMonth === 0 ? 11 : currentMonth - 1
      const year = currentMonth === 0 ? currentYear - 1 : currentYear
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ day, dateString, isCurrentMonth: false })
    }

    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ day, dateString, isCurrentMonth: true })
    }

    // Next month's overlapping days (to pad grid to a multiple of 7, up to 42 cells)
    const remainingCells = 42 - cells.length
    for (let day = 1; day <= remainingCells; day++) {
      const month = currentMonth === 11 ? 0 : currentMonth + 1
      const year = currentMonth === 11 ? currentYear + 1 : currentYear
      const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      cells.push({ day, dateString, isCurrentMonth: false })
    }

    return cells
  }, [currentYear, currentMonth])

  // Helper to format ISO selectedDate input for comparison
  const formattedSelectedDate = useMemo(() => {
    if (!selectedDate) return ''
    try {
      const d = new Date(selectedDate)
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    } catch {
      return selectedDate
    }
  }, [selectedDate])

  return (
    <div className="border-t border-t-white/60 border-b border-b-border flex flex-col space-y-2 w-full bg-linear-to-b from-white/20 to-card backdrop-blur-lg rounded-2xl p-4 shadow-xl ">
      <div className="flex items-center justify-between px-1 pb-2">
        <h4 className="text-sm font-bold text-slate-100">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </h4>
        <div className="flex space-x-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 bg-white/10 cursor-pointer hover:bg-white/20  text-white hover:text-slate-200 rounded-full  transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 bg-white/10 cursor-pointer hover:bg-white/20  text-white hover:text-slate-200 rounded-full  transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekdays header */}
      <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider pb-1">
        {DAYS_OF_WEEK.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell, idx) => {
          const isSelected = cell.dateString === formattedSelectedDate
          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(cell.dateString)}
              className={`
                aspect-square flex items-center justify-center rounded-lg text-xs font-semibold transition relative
                ${isSelected ? 'bg-primary text-black shadow-md shadow-indigo-600/20' : ''}
                ${!isSelected && cell.isCurrentMonth ? 'text-slate-300 hover:bg-primary/20 hover:text-slate-100 cursor-pointer' : ''}
                ${!isSelected && !cell.isCurrentMonth ? 'text-slate-600 hover:bg-red-500/20 hover:text-slate-500 cursor-pointer' : ''}
              `}
            >
              {cell.day}
              {/* Highlight today dot */}
              {cell.dateString === new Date().toISOString().split('T')[0] && (
                <span
                  className={`absolute bottom-1 w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
