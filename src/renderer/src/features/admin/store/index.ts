import { create } from 'zustand'
import { DetailedSession } from '../types'
import { getLocalDate } from '@renderer/lib/utils'

type Store = {
    selectedDate: string
    setSelectedDate: (date: string) => void
    selectedUserId: string
    setSelectedUserId: (userId: string) => void
    activityLog: DetailedSession[]
    setActivityLog: (activityLog: DetailedSession[]) => void
    searchQuery: string
    setSearchQuery: (searchQuery: string) => void
    selectedAttendanceId: string
    setSelectedAttendanceId: (id: string) => void

}

export const useDailyActivitiesStore = create<Store>()((set) => ({
    selectedDate: getLocalDate(),
    setSelectedDate: (date: string) => set(({ selectedDate: date })),

    selectedUserId: "",
    setSelectedUserId: (userId: string) => set(({ selectedUserId: userId })),

    activityLog: [],
    setActivityLog: (activityLog: DetailedSession[]) => set(({ activityLog: activityLog })),

    searchQuery: '',
    setSearchQuery: (searchQuery: string) => set(({ searchQuery: searchQuery })),

    selectedAttendanceId: '',
    setSelectedAttendanceId: (id: string) => set(({ selectedAttendanceId: id }))
}))
