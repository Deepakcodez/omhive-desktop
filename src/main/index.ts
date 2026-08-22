import { app, shell, BrowserWindow, ipcMain, powerMonitor, powerSaveBlocker } from 'electron'
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
  SYNC_REMOTE_INTERVAL_MS,
  WorkStatus
} from './constants'
import type { StoreType, TSession, } from './types'
import { IPC_Handlers } from './ipc'
import { isLoggedIn, sendHeartBeat, SessionStatus, startIdleSession, stopIdleSession, syncToServer } from './utils'
import { randomUUID } from 'crypto'




// ── System identity (resolved once at startup) ─────────────────────────────
const HOSTNAME = os.hostname()
const USERNAME = os.userInfo().username

// ── Session state ───────────────────────────────────────────────────────────
let currentSession: TSession | null = null
let pendingSessions: TSession[] = []
let UserSession: SessionStatus | null = null
let mainWindow: BrowserWindow | null = null
let idleStartedAt: number | null = null

/**
 * Whether we are already in the process of quitting.
 * Guards against duplicate quit calls from `app:close` IPC / `before-quit`.
 */
let isQuitting = false

/**
 * Whether the exit-confirmation modal is currently shown in the renderer.
 * Prevents the native `close` event from re-triggering the modal while it
 * is already open.
 */
let askingClose = false

/** Power-save blocker ID — held while the app is running. */
let blockerId: number | null = null;

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

  mainWindow.on('close', (e) => {
    // Allow close when we are already in the graceful quit sequence
    if (isQuitting) return

    // Modal already open — ignore this duplicate close event
    if (askingClose) {
      e.preventDefault()
      return
    }

    // Prevent the default close so we can show the exit-confirmation modal.
    // The renderer will either:
    //   • call window.api.closeCancelled() → user dismissed → reset askingClose
    //   • call window.api.closeApp()       → user confirmed → triggers quit flow
    e.preventDefault()
    askingClose = true
    mainWindow?.webContents.send('app:before-close')
  })

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


// ── IPC: close-flow handlers ─────────────────────────────────────────────────
// Registered at module level (NOT inside createWindow) so they are set up
// exactly once. Putting them inside createWindow causes listener accumulation
// on macOS when the window is re-created via the dock 'activate' event.

/**
 * User dismissed the exit modal → reset the flag so the next close attempt
 * triggers the modal again.
 */
ipcMain.on('app:close-cancelled', () => {
  askingClose = false
})

/**
 * User confirmed quitting (chose logout or break-and-exit in the modal).
 *
 * Sequence:
 *  1. Guard against duplicate calls.
 *  2. Send `app:quitting` → renderer shows a full-screen loader so the user
 *     knows the app is busy and has NOT frozen.
 *  3. Stop the power-save blocker.
 *  4. Flush the current tracking session to the server.
 *  5. Call app.quit() to let Electron complete the teardown.
 */
ipcMain.on('app:close', async () => {
  if (isQuitting) return
  isQuitting = true

  // Show the quitting loader in the renderer immediately
  mainWindow?.webContents.send('app:quitting')

  try {
    // Release the power-save blocker
    if (blockerId !== null && powerSaveBlocker.isStarted(blockerId)) {
      powerSaveBlocker.stop(blockerId)
      blockerId = null
    }

    // Flush the current tracking session to the server before closing
    const closed = closeCurrentSession()
    if (closed) {
      await syncToServer([closed])
    }
  } catch (error) {
    console.error('Error during graceful shutdown:', error)
  } finally {
    app.quit()
  }
})


const sendGlobalError = (
  type: "uncaught-exception" | "unhandled-rejection",
  error: unknown
) => {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  mainWindow.webContents.send("app:global-error", {
    type,
    message:
      error instanceof Error
        ? error.message
        : String(error),
  });
}


// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  const { default: Store } = await import('electron-store')
  // app state which shared throughout the app
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
        attendanceId: '',
        appInitialized: false
      },
      sessions: []
    }
  })


  const userInfo = store.get('userInfo')

  try {
    if (userInfo.userId) {
      UserSession = await isLoggedIn(userInfo.userId);

      if (UserSession.loggedIn) {
        store.set("appState", {
          trackingEnabled: UserSession.status === WorkStatus.WORKING,
          currentUserId: userInfo.userId,
          attendanceId: UserSession.attendanceId,
          appInitialized: true,
        });
      } else {
        store.set("appState", {
          trackingEnabled: false,
          currentUserId: "",
          attendanceId: "",
          appInitialized: true,
        });

        store.set("userInfo", {
          ...userInfo,
          attendanceId: "",
        });
      }
    } else {
      store.set("appState", {
        trackingEnabled: false,
        currentUserId: "",
        attendanceId: "",
        appInitialized: true,
      });

      store.set("userInfo", {
        ...userInfo,
        attendanceId: "",
      });
    }

  } catch (error) {
    console.error("App initialization failed:", error);

    mainWindow?.webContents.send(
      "app:init-error",
      {
        message: "Unable to validate your session."
      }
    );
  }

  // sync app status in between renderer and main process

  // prevent app from sleep
  // while app running system will not sleep when user is ideal
  blockerId = powerSaveBlocker.start("prevent-display-sleep");





  electronApp.setAppUserModelId('com.omhive')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC: renderer can request pending sessions (e.g. on first load)
  ipcMain.handle('activity:get-pending', () => pendingSessions)
  ipcMain.handle('activity:get-all', () => ({
    sessions: store ? store.get('sessions', []) : []
  }))


  // UserIpc({ store })   user related IPC
  // ActivityIpc()       activity related IPC
  // AttendanceIpc()   attendance related IPC
  // AlertIpc()        alert related IPC
  // AdminIpc()        admin related IPC
  // SyncAppIpc({ store }) sync app related IPC

  //IPC handllers
  IPC_Handlers({ store })

  createWindow()

  // ── Poll: detect active window every second ─────────────────────────────
  setInterval(async () => {
    const appState = store.get('appState')
    if (!appState.trackingEnabled) return

    const idleTime = powerMonitor.getSystemIdleTime()
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
    const payload = [...sessions]

    if (current) {
      payload.push(current)
    }
    if (payload.length === 0) return
    try {
      const result = await syncToServer(payload)
      if (result.success) {
        store?.set('sessions', [])
        store?.set('currentSession', null)
      }

    } catch (error) {
      console.log('sending to server failed', error)
    }
    console.log('sending to server end')
  }, SYNC_REMOTE_INTERVAL_MS)


  // send heartbeat to the server every 30 second , 
  // set last seen value  
  //  in db
  // if no response from the server then auto logout

  sendHeartBeat({
    store,
    mainWindow,
    clearCurrentSession: () => { currentSession = null },
    clearPendingSessions: () => { pendingSessions = [] }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})



process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);

  sendGlobalError(
    "uncaught-exception",
    error
  );
});

process.on("unhandledRejection", (reason) => {
  console.error(
    "Unhandled Promise Rejection:",
    reason
  );

  sendGlobalError(
    "unhandled-rejection",
    reason
  );
});



// ── Safety-net cleanup on quit ───────────────────────────────────────────────
// `before-quit` fires for every quit path (including Cmd+Q on macOS and
// Task-Manager kills). We use it to guarantee the power-save blocker is
// released even if the normal `app:close` IPC path was bypassed.
app.on('before-quit', () => {
  if (blockerId !== null && powerSaveBlocker.isStarted(blockerId)) {
    powerSaveBlocker.stop(blockerId)
    blockerId = null
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()

})
