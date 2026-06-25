import { app, shell, BrowserWindow, ipcMain, powerMonitor } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { activeWindow } from 'get-windows'
import os from 'os'
import {
  IDLE_THRESHOLD_SEC,
  MIN_SESSION_DURATION_SEC,
  POLL_INTERVAL_MS,
  SYNC_LOCAL_INTERVAL_MS,
  SYNC_REMOTE_INTERVAL_MS
} from './constants'
import type { StoreType, TSession, } from './types'
import { IPC_Handlers } from './ipc'
import { isLoggedIn, startIdleSession, stopIdleSession, syncToServer } from './utils'
import { randomUUID } from 'crypto'



// ── System identity (resolved once at startup) ─────────────────────────────
const HOSTNAME = os.hostname()
const USERNAME = os.userInfo().username

// ── Session state ───────────────────────────────────────────────────────────
let currentSession: TSession | null = null
let pendingSessions: TSession[] = []
let mainWindow: BrowserWindow | null = null
let idleStartedAt: number | null = null
let askingClose = false

// ── Helpers ─────────────────────────────────────────────────────────────────
// not current session  return null
// 
function closeCurrentSession(): TSession | null {
  if (!currentSession) return null
  const duration = (currentSession.endTime - currentSession.startTime) / 1000
  const session =
    duration >= MIN_SESSION_DURATION_SEC
      ? { ...currentSession, duration }
      : null

  currentSession = null

  return session
}

function getCurrentSessionSnapshot(): TSession | null {
  if (!currentSession) return null

  const endTime = Date.now()

  return {
    ...currentSession,
    endTime,
    duration: (endTime - currentSession.startTime) / 1000
  }
}


function pushToRenderer(session: TSession): void {
  mainWindow?.webContents.send('activity:update', session)
}

// ── Window ───────────────────────────────────────────────────────────────────
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    x: 1200,
    y: 12,
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

  mainWindow.on('close', async (e) => {
    if (!askingClose) {
      e.preventDefault()
      askingClose = true
      mainWindow?.webContents.send('app:before-close')
    }
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  ipcMain.on('app:close-cancelled', () => {
    askingClose = false
  })

  ipcMain.on('app:close', () => {
    app.quit()
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

  const store = new Store<StoreType>({
    defaults: {
      userInfo: {
        userId: '',
        userName: '',
        attendanceId: ''
      },
      appState: {
        trackingEnabled: false,
        currentUserId: '',
        attendanceId: ''
      },
      sessions: []
    }
  })


  const userInfo = store.get('userInfo')
  console.log("user info--", userInfo)


  if (userInfo.userId) {
    try {
      const session = await isLoggedIn(userInfo.userId)
      if (session?.loggedIn) {

        store.set('appState', {
          trackingEnabled: session.status === 'working',
          currentUserId: userInfo.userId,
          attendanceId: session.attendanceId || userInfo.attendanceId
        })
      }
      const appState = store.get('appState')
      console.log("app state", appState)
      console.log('Creating session', {
        userId: appState.currentUserId,
        attendanceId: appState.attendanceId
      })
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

  IPC_Handlers({ store })

  createWindow()

  // ── Poll: detect active window every second ─────────────────────────────
  setInterval(async () => {
    const appState = store.get('appState')
    if (!appState.trackingEnabled) return

    const idleTime = powerMonitor.getSystemIdleTime()
    console.log({
      idleTime,
      currentSession: !!currentSession,
      trackingEnabled: appState.trackingEnabled
    })

    // Send live idle time to renderer
    mainWindow?.webContents.send('idle-time', idleTime)

    // stop idle time
    if (
      idleStartedAt &&
      idleTime < IDLE_THRESHOLD_SEC
    ) {
      const endTime = Date.now()

      console.log(
        "User returned from idle:",
        (endTime - idleStartedAt) / 1000,
        "seconds"
      )

      try {
        console.log("will stop idle session here")

        await stopIdleSession({
          attendanceId: appState.attendanceId || '',
          endTime: new Date(endTime).toISOString()
        })

        idleStartedAt = null
      } catch (error) {
        console.error("Failed to stop idle session", error)
      }
    }

    // start idle time
    if (idleTime >= IDLE_THRESHOLD_SEC) {
      console.log("user is idea for", idleTime + " sec")
      // User went idle — close any open session

      if (!idleStartedAt) {
        idleStartedAt = Date.now()

        console.log(
          "User became idle at",
          new Date(idleStartedAt)
        )
        console.log("will send ideal session to server here")
        await startIdleSession({
          attendanceId: appState.attendanceId || '',
          userId: appState.currentUserId || '',
          startTime: new Date(idleStartedAt).toISOString()
        })
      }


      const closed = closeCurrentSession()
      if (closed) {
        pendingSessions.push(closed)
        store.delete('currentSession')
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
        syncId: randomUUID(),
        startTime: Date.now(),
        endTime: Date.now(),
        duration: 0,
        activityType: 'work',
        software,
        title,
        hostname: HOSTNAME,
        systemUsername: USERNAME,
        userId: appState.currentUserId || '',
        attendanceId: appState.attendanceId || ''
      }
      return
    }

    if (currentSession.software === software && currentSession.title === title) {
      // Still in the same window — extend session
      console.log("same app opened just increased the time")
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
      syncId: randomUUID(),
      startTime: Date.now(),
      endTime: Date.now(),
      duration: 0,
      activityType: 'work',
      software,
      title,
      hostname: HOSTNAME,
      systemUsername: USERNAME,
      userId: appState.currentUserId || '',
      attendanceId: appState.attendanceId || ''
    }

    console.log('step-1 pendingstatus first entry', pendingSessions[0])
  }, POLL_INTERVAL_MS)

  // save session to the local db if user use same app for a long time
  setInterval(() => {
    const appState = store.get('appState')
    const snapshot = getCurrentSessionSnapshot()

    if (!snapshot || !store) return
    if (!appState.trackingEnabled) return
    store.set('currentSession', snapshot)
  }, 6_000)

  // store activity locally after 1 minutes
  setInterval(() => {
    const appState = store.get('appState')
    if (!appState.trackingEnabled) return
    if (pendingSessions.length === 0) return

    if (store) {
      const existing = (store.get('sessions') as TSession[]) || []
      store.set('sessions', [...existing, ...pendingSessions])
      pendingSessions = []
      console.log('Saved locally')
    } else {
      console.log("no store found in local sync func")
    }
  }, SYNC_LOCAL_INTERVAL_MS)

  // ── Sync: batch-send sessions to server every 5 min ──────────────────────
  setInterval(async () => {
    const sessions = store?.get('sessions', []) || []
    const current = store?.get('currentSession') as TSession
    console.log('data in local db ', sessions)
    const payload = [...sessions]

    if (current) {
      payload.push(current)
    }

    console.log('payload bb', payload)
    if (payload.length === 0) return
    try {
      await syncToServer(payload)
      store?.set('sessions', [])
      // store?.set('currentSession', null)
      
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
