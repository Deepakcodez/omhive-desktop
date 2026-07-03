import { create } from 'zustand'
import { DetailedSession } from '../types'


type Store = {
    total: number
    setTotal: (total: number) => void
    limit: number
    setLimit: (data: number) => void
    page: number
    setPage: (data: number) => void
    activities: DetailedSession[]
    setActivities: (session: DetailedSession[]) => void
    searchQuery: string,
    setSearchQuery: (query: string) => void


}

export const useMonthlyReportStore = create<Store>()((set) => ({
    total: 0,
    setTotal: (total: number) => set(({ total })),

    limit: 50,
    setLimit: (data) => set(({ limit: data })),

    page: 1,
    setPage: (data) => set(({ page: data })),

    activities: [],
    setActivities: (data) => set(({ activities: data })),
    searchQuery: '',
    setSearchQuery: (data) => set(({ searchQuery: data }))




}))
