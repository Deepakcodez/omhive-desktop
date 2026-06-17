import { app, shell, BrowserWindow, ipcMain, powerMonitor } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { activeWindow } from 'get-windows'
import os from 'os'
import type Store from 'electron-store'

export type TSession = {
  startTime: number
  endTime: number
  duration: number
  software: string
  title: string
  hostname: string
  username: string
}

const IDLE_THRESHOLD_SEC = 60
const MIN_SESSION_DURATION_SEC = 10
const SYNC_LOCAL_INTERVAL_MS = 60_000
const SYNC_REMOTE_INTERVAL_MS = 300_000
const POLL_INTERVAL_MS = 2_000
const API_ENDPOINT = 'http://localhost:5001/post-data'

// ── System identity (resolved once at startup) ─────────────────────────────
const HOSTNAME = os.hostname()
const USERNAME = os.userInfo().username

// ── Session state ───────────────────────────────────────────────────────────
let currentSession: Omit<TSession, 'duration'> | null = null
let pendingSessions: TSession[] = []
let mainWindow: BrowserWindow | null = null
let store: Store<{ sessions: TSession[] }> | null = null

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

async function syncToServer(sessions: TSession[]): Promise<void> {
  try {
    const res = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessions)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    console.log(`[sync] Sent ${sessions.length} session(s)`)
  } catch (err) {
    // Put sessions back so they're retried next cycle
    pendingSessions = [...sessions, ...pendingSessions]
    console.error('[sync] Failed, will retry:', err)
  }
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

  electronApp.setAppUserModelId('com.omhive')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC: renderer can request pending sessions (e.g. on first load)
  ipcMain.handle('activity:get-pending', () => pendingSessions)
  ipcMain.handle('activity:get-all', () => ({
    sessions: store ? store.get('sessions', []) : []
  }))

  createWindow()

  console.log(app.getPath('userData'))
  // ── Poll: detect active window every second ─────────────────────────────
  setInterval(async () => {
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
        software,
        title,
        hostname: HOSTNAME,
        username: USERNAME
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
      software,
      title,
      hostname: HOSTNAME,
      username: USERNAME
    }
  }, POLL_INTERVAL_MS)

  // store activity locally after 1 minutes
  setInterval(() => {
    if (pendingSessions.length === 0) return

    if (store) {
      const existing = (store.get('sessions') as TSession[]) || []
      store.set('sessions', [...existing, ...pendingSessions])
      pendingSessions = []
      console.log('Saved locally')
    }
  }, SYNC_LOCAL_INTERVAL_MS)

  // ── Sync: batch-send sessions to server every 5 min ──────────────────────
  setInterval(async () => {
    if (pendingSessions.length === 0) return
    const batch = [...pendingSessions]
    console.log('batch :', batch)
    pendingSessions = []
    await syncToServer(batch)
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
