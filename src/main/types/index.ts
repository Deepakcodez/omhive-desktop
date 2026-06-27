import type Store from 'electron-store'

export type TSession = {
  syncId: string
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
  appInitialized: boolean
}




export type Attendance = {
  id: string
  date: string
  loginTime: string
  logoutTime: string | null
  expectedWorkSeconds: number
  totalWorkSeconds: number
  totalBreakSeconds: number
  status: 'working' | 'break' | 'logged_out'
  hostname: string
  systemUsername: string
  os: string
}

export type UserWithAttendance = {
  id: string
  userName: string
  fullName: string
  phone: string
  attendance: Attendance[]
}

export type UsersWithLoginLogout = {
  data: UserWithAttendance[]
  success: boolean
  message: string
}


export type StoreType = {
  userInfo: UserInfoType
  sessions: TSession[]
  currentSession?: TSession
  appState: AppState,
}



export type UserStoreType = Store<UserInfoType> | null
