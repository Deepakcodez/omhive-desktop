import { ElectronAPI } from '@electron-toolkit/preload'
import { DailyAttendanceResponse } from 'src/shared/types'


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


export type WorkStatus = 'working' | 'break' | 'logged_out'

export interface AttendanceRecord {
  id: string
  userId: string
  date: string
  loginTime: string
  logoutTime: string | null
  expectedWorkSeconds: number
  totalWorkSeconds: number
  totalBreakSeconds: number
  isPresent: boolean
  status: WorkStatus
  hostname: string
  systemUsername: string
  os: string
  createdAt: string
}

export interface MonthAttendanceResponse {
  data: {
    attendance: AttendanceRecord[]
    summary: {
      totalDays: number
      presentDays: number
      totalWorkSeconds: number
      totalBreakSeconds: number
    }
  }
  success: boolean
  message: string
}





interface Api {
  onIdleTime: (callback: (idleTime: number) => void) => void
  removeIdleTimeListener: () => void
  onActivityUpdate: (cb: (s: TSession) => void) => void
  getPendingSessions: () => Promise<TSession[]>
  removeActivityListeners: () => void
  getAllSession: () => Promise<{ sessions: TSession[] }>
  getSystemInfo: () => Promise<{
    hostname: string
    os: string
    systemUsername: string
    timezone: string
  }>
  listUser: () => Promise<{
    data: {
      id: string;
      userName: string;
      fullName: string;
      phone: string;
      createdAt: Date;
    }[] | null
    success: boolean
    message: string
  }>
  listUserWithLoginLogout: (payload: { date: string }) => Promise<
    UsersWithLoginLogout
  >
  dailyAttendance: (payload: { date: string }) => Promise<DailyAttendanceResponse>
  getUserMonthlyReport: (payload: { month: number, year: number, userId: string }) => Promise<MonthAttendanceResponse>
  loginUser: (payload: { username: string }) => Promise<{
    data: {
      userId: string
      userName: string
      attendanceId: string
      existing: boolean
      loginTime: Date
      status: "working" | "break"
    } | null
    success: boolean
    isAdmin?: boolean
    message: string
  }>
  breakUser: (payload: { attendanceId: string }) => Promise<{
    data: {
      breakId: string
      startTime: Date
      status: "working" | "break"

    } | null
    success: boolean
    message: string
  }>
  resumeUser: (payload: { attendanceId: string }) => Promise<{
    data: {
      durationSeconds: number
      resumedAt: Date
      status: "working" | "break"

    }
    success: boolean
    message: string
  }>
  logoutUser: (payload: { attendanceId: string }) => Promise<{
    alreadyLoggedOut: false
    logoutTime: Date
    totalWorkSeconds: number
    totalBreakSeconds: number
  }>

  getUserActivity: (payload: {
    userId: string
    date: string
    attendanceId: string
    limit: number
  }) => Promise<{
    data: {
      data: {
        id: string;
        attendanceId: string;
        userId: string;
        activityType: "break" | "work";
        startTime: Date;
        endTime: Date;
        duration: number;
        software: string;
        title: string;
        hostname: string;
        systemUsername: string;
      }[];
      total: number;
      limit: number;
      offset: number;
    } | null
    success: boolean
    message: string
  }>;

  alert: (payload: {
    title: string
    message: string
    type?: 'info' | 'warning' | 'error'
  }) => Promise<void>
}

declare global {
  interface TSession {
    startTime: number
    endTime: number
    duration: number
    software: string
    title: string
    hostname: string
    username: string
  }

  interface Window {
    electron: ElectronAPI
    api: Api
  }
}


