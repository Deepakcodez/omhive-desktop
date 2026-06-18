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
  }) => Promise<void>
  breakUser: (payload: {
    username: string,
  }) => Promise<void>
  logoutUser: (payload: {
    username: string,
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
