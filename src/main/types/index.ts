import type Store from 'electron-store'

export type TSession = {
  userId: string
  attendanceId: string
  activityType: 'work' | 'break'
  startTime: number
  endTime: number
  duration: number
  software: string
  title: string
  hostname: string
  systemUsername: string
}

export type UserInfoType = {
  userId: string
  userName: string
  attendanceId: string
}

export type AppState = {
  trackingEnabled: boolean
  currentUserId: string | null
  attendanceId: string | null
}

export type UserStoreType = Store<UserInfoType> | null
