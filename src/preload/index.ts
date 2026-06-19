import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  onIdleTime: (callback: (idleTime: number) => void) => {
    ipcRenderer.on('idle-time', (_event, idleTime: number) => callback(idleTime))
  },
  removeIdleTimeListener: () => {
    ipcRenderer.removeAllListeners('idle-time')
  },
  onActivityUpdate: (cb: (session: unknown) => void) => {
    ipcRenderer.on('activity:update', (_event, session) => cb(session))
  },
  // Fetch sessions already buffered before the window opened
  getPendingSessions: () => ipcRenderer.invoke('activity:get-pending'),
  // Clean up listener when component unmounts
  removeActivityListeners: () => {
    ipcRenderer.removeAllListeners('activity:update')
  },
  getAllSession: () => ipcRenderer.invoke('activity:get-all'),
  getSystemInfo: () => ipcRenderer.invoke('user:get-info'),
  loginUser: (payload: {
    username: string
    hostname: string
    os: string
    systemUsername: string
    startTime: number
  }) => ipcRenderer.invoke('user:login', payload),
  breakUser: (payload: { attendanceId: string }) => ipcRenderer.invoke('user:break', payload),
  resumeUser: (payload: { attendanceId: string }) => ipcRenderer.invoke('user:resume', payload),
  logoutUser: (payload: { attendanceId: string }) => ipcRenderer.invoke('user:logout', payload),

  alert: (payload: { title: string; message: string; type?: 'info' | 'warning' | 'error' }) =>
    ipcRenderer.invoke('system:alert', payload)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
