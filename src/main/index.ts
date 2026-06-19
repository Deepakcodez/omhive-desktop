import { app, shell, BrowserWindow, ipcMain, powerMonitor } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { activeWindow } from 'get-windows'
import os from 'os'
import type Store from 'electron-store'
import {
  API_ENDPOINT,
  IDLE_THRESHOLD_SEC,
  MIN_SESSION_DURATION_SEC,
  POLL_INTERVAL_MS,
  SYNC_LOCAL_INTERVAL_MS,
  SYNC_REMOTE_INTERVAL_MS
} from './constants'
import type { TSession, UserInfoType } from './types'
import { IPC_Handlers } from './ipc'
import { isLoggedIn, syncToServer } from './utils'

// ── System identity (resolved once at startup) ─────────────────────────────
const HOSTNAME = os.hostname()
const USERNAME = os.userInfo().username

// ── Session state ───────────────────────────────────────────────────────────
let currentSession: TSession | null = null
let pendingSessions: TSession[] = []
let mainWindow: BrowserWindow | null = null
let store: Store<{ sessions: TSession[] }> | null = null
const appState = {
  trackingEnabled: false,
  currentUserId: '',
  attendanceId: ''
}

// ── Helpers ─────────────────────────────────────────────────────────────────
function closeCurrentSession(): TSession | null {
  if (!currentSession) return null
  const duration = (currentSession.endTime - currentSession.startTime) / 1000
  if (duration < MIN_SESSION_DURATION_SEC) return null
  return { ...currentSession, duration }
}

function pushToRenderer(session: TSession): void {
  mainWindow?.webContents.send('activity:update', session)
}

// ── Window ───────────────────────────────────────────────────────────────────
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    title: 'Omhive',
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => mainWindow!.show())

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  const { default: Store } = await import('electron-store')

  store = new Store<{ sessions: TSession[] }>({
    defaults: {
      sessions: []
    }
  })
  const userInfoStore = new Store<UserInfoType>({
    defaults: {
      userId: '',
      userName: '',
      attendanceId: ''
    }
  })

  const userInfo = userInfoStore.get('userInfo') as UserInfoType
  console.log('userId 93', userInfo.userId)
  if (userInfo.userId) {
    try {
      const session = await isLoggedIn(userInfo.userId)

      if (session?.loggedIn) {
        appState.trackingEnabled = true
        appState.currentUserId = userInfo.userId
        appState.attendanceId = session.attendanceId || ''
      }
    } catch (err) {
      console.error(err)
    }
  }

  electronApp.setAppUserModelId('com.omhive')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC: renderer can request pending sessions (e.g. on first load)
  ipcMain.handle('activity:get-pending', () => pendingSessions)
  ipcMain.handle('activity:get-all', () => ({
    sessions: store ? store.get('sessions', []) : []
  }))

  IPC_Handlers({ userInfoStore, appState })

  createWindow()
  // ── Poll: detect active window every second ─────────────────────────────
  setInterval(async () => {
    if (!appState.trackingEnabled) return

    const idleTime = powerMonitor.getSystemIdleTime()

    // Send live idle time to renderer
    mainWindow?.webContents.send('idle-time', idleTime)

    if (idleTime >= IDLE_THRESHOLD_SEC) {
      // User went idle — close any open session
      const closed = closeCurrentSession()
      if (closed) {
        pendingSessions.push(closed)
        pushToRenderer(closed)
      }

      currentSession = null
      return
    }

    const result = await activeWindow()
    if (!result) return

    const software = result.owner.name
    const title = result.title

    if (!currentSession) {
      // First window seen
      currentSession = {
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        activityType: 'work',
        software,
        title,
        hostname: HOSTNAME,
        systemUsername: USERNAME,
        userId: appState.currentUserId,
        attendanceId: appState.attendanceId
      }
      return
    }

    if (currentSession.software === software && currentSession.title === title) {
      // Still in the same window — extend session
      currentSession.endTime = Date.now()
      return
    }

    // Window changed — close previous session
    const closed = closeCurrentSession()
    if (closed) {
      pendingSessions.push(closed)
      pushToRenderer(closed)
    }

    // Start fresh session for new window
    currentSession = {
      startTime: Date.now(),
      endTime: Date.now(),
      duration: 0,
      activityType: 'work',
      software,
      title,
      hostname: HOSTNAME,
      systemUsername: USERNAME,
      userId: appState.currentUserId,
      attendanceId: appState.attendanceId
    }

    console.log('step-1 pendingstatus', pendingSessions)
  }, POLL_INTERVAL_MS)

  // store activity locally after 1 minutes
  setInterval(() => {
    if (!appState.trackingEnabled) return
    if (pendingSessions.length === 0) return

    if (store) {
      const existing = (store.get('sessions') as TSession[]) || []
      store.set('sessions', [...existing, ...pendingSessions])
      pendingSessions = []
      console.log('Saved locally')
    }
    console.log('step-2 pendingstatus', pendingSessions)
  }, SYNC_LOCAL_INTERVAL_MS)

  // ── Sync: batch-send sessions to server every 5 min ──────────────────────
  setInterval(async () => {
    if (!appState.trackingEnabled) return
    const existing = store?.get('sessions', []) || []
    console.log('existing', existing)
    if (existing.length === 0) return
    console.log('step-3 pendingstatus', existing)
    try {
      await syncToServer(existing)
      store?.set('sessions', [])
    } catch (error) {
      console.log('sending to server failed', error)
    }
    console.log('sending to server end')
  }, SYNC_REMOTE_INTERVAL_MS)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Flush any open session before quitting
app.on('before-quit', () => {
  const closed = closeCurrentSession()
  if (closed) syncToServer([closed])
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
