import { ElectronAPI } from '@electron-toolkit/preload'

interface Api {
  onIdleTime: (callback: (idleTime: number) => void) => void
  removeIdleTimeListener: () => void
  onActivityUpdate: (cb: (s: TSession) => void) => void
  getPendingSessions: () => Promise<TSession[]>
  removeActivityListeners: () => void
  getAllSession: () => Promise<{ sessions: TSession[] }>
  getSystemInfo: () => Promise<{ hostname: string, os: string, systemUsername: string, timezone: string }>
  loginUser: (payload: {
    username: string,
  }) => Promise<{
    userId: string,
    username: string,
    attendanceId: string,
    existing: boolean,
    loginTime: Date
  } | null>
  breakUser: (payload: {
    attendanceId: string,
  }) => Promise<{
    startTime: Date;
    attendanceId: string;
    id: string;
    endTime: Date | null;
    durationSeconds: number;
  }>
  resumeUser: (payload: { attendanceId: string }) => Promise<{ durationSeconds: number }>
  logoutUser: (payload: {
    attendanceId: string,
  }) => Promise<{
    alreadyLoggedOut: false;
    logoutTime: Date;
    totalWorkSeconds: number;
    totalBreakSeconds: number;
  }>


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
