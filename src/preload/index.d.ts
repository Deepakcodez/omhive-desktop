import { ElectronAPI } from '@electron-toolkit/preload'

interface Api {
  onIdleTime: (callback: (idleTime: number) => void) => void
  removeIdleTimeListener: () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
