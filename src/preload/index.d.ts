import { ElectronAPI } from '@electron-toolkit/preload'

interface Api {
  onIdleTime: (callback: (idleTime: number) => void) => void
  removeIdleTimeListener: () => void
  onActivityUpdate: (cb: (s: TSession) => void) => void
  getPendingSessions: () => Promise<TSession[]>
  removeActivityListeners: () => void
  getAllSession: () => Promise<{ sessions: TSession[] }>
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
