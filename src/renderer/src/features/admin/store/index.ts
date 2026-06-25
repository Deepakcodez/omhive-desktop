import { create } from 'zustand'
import { DetailedSession } from '../types'

type Store = {
    selectedDate: string
    setSelectedDate: (date: string) => void
    selectedUserId: string
    setSelectedUserId: (userId: string) => void
    activityLog: DetailedSession[]
    setActivityLog: (activityLog: DetailedSession[]) => void
    searchQuery: string
    setSearchQuery: (searchQuery: string) => void
    
}

export const useDailyActivitiesStore = create<Store>()((set) => ({
    selectedDate: new Date().toISOString().split('T')[0],
    setSelectedDate: (date: string) => set(({ selectedDate: date })),

    selectedUserId: "",
    setSelectedUserId: (userId: string) => set(({ selectedUserId: userId })),

    activityLog: [],
    setActivityLog: (activityLog: DetailedSession[]) => set(({ activityLog: activityLog })),

    searchQuery: '',
    setSearchQuery: (searchQuery: string) => set(({ searchQuery: searchQuery })),

}))
