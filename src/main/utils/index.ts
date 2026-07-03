import ElectronStore from 'electron-store'
import { API_ENDPOINT, HEARTBEAT_CHECK_MS, PERIODIC_CHECK_MS } from '../constants'
import type { AppState, StoreType, TSession } from '../types'
import { BrowserWindow } from 'electron'


export function getLocalDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata'
  }).format(date)
}


export function updateAppState(
  store: ElectronStore<StoreType>,
  updates: Partial<AppState>
) {
  const current = store.get('appState')

  store.set('appState', {
    ...current,
    ...updates
  })
}



export async function syncToServer(sessions: TSession[]): Promise<void> {
  try {
    const res = await fetch(`${API_ENDPOINT}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessions)
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    console.log(`[sync] Sent ${sessions.length} session(s)`)
  } catch (err) {
    // Put sessions back so they're retried next cycle
    console.error('[sync] Failed, will retry:', err)
    throw new Error(`HTTP error! ${err}`)
  }
}

export const isLoggedIn = async (
  userId: string,
): Promise<
  | {
    loggedIn: boolean
    attendanceId: string
    loginTime: Date
    status: 'working' | 'break' | 'logged_out'
  }
  | {
    loggedIn: boolean
    attendanceId: null
    loginTime: null
    status: null
  }
> => {
  try {
    const date = new Date().toISOString()
    const res = await fetch(`${API_ENDPOINT}/user/is-logged-in`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    return data.data
  } catch (err) {
    console.error('[isLoggedIn] Failed:', err)
    return {
      loggedIn: false,
      attendanceId: null,
      loginTime: null,
      status: null
    }
  }
}


export const startIdleSession = async ({
  attendanceId,
  userId,
  startTime
}: {
  attendanceId: string,
  userId: string,
  startTime: string
}) => {
  try {
    const res = await fetch(`${API_ENDPOINT}/activity/start-idle-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendanceId, userId, startTime })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    console.log(`[sync] Idle session set`)
  } catch (err) {
    console.error('[sync] Failed to set idle session:', err)
    throw new Error(`HTTP error! ${err}`)
  }

}
export const stopIdleSession = async ({
  attendanceId,
  endTime
}: {
  attendanceId: string,
  endTime: string
}) => {
  try {
    const res = await fetch(`${API_ENDPOINT}/activity/stop-idle-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attendanceId, endTime })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    console.log(`[sync] Idle session set`)
  } catch (err) {
    console.error('[sync] Failed to set idle session:', err)
    throw new Error(`HTTP error! ${err}`)
  }

}

export const sendHeartBeat = (store: ElectronStore<StoreType>) => {

  setInterval(async () => {
    const appState = store.get("appState")
    const userInfo = store.get("userInfo")
    console.log("checking heartbeat")
    if (!appState.trackingEnabled) return

    try {
      const resp = await fetch(`${API_ENDPOINT}/attendance/heartbeat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userId: appState.currentUserId,
          attendanceId: appState.attendanceId,
          time: new Date().toISOString()
        })
      })
      const { data } = await resp.json()

      console.log("is logged in", data)
      if (!data.loggedIn) {
        store.set("appState", {
          ...appState,
          trackingEnabled: false,
          currentUserId: "",
          attendanceId: "",
        })
        store.set('userInfo', {
          ...userInfo,
          attendanceId: ''

        })
      }

    } catch (error) {
      console.log("heartbeat error -> ", error)
      store.set("appState", {
        ...appState,
        trackingEnabled: false,
        currentUserId: "",
        attendanceId: "",
      })
      store.set('userInfo', {
        ...userInfo,
        attendanceId: ''

      })
    }
  }, HEARTBEAT_CHECK_MS)
}

export const periodicValidation = (
  {
    store,
    mainWindow,
    clearCurrentSession,
    clearPendingSessions
  }: {
    store: ElectronStore<StoreType>,
    mainWindow: BrowserWindow | null,
    clearCurrentSession: () => void,
    clearPendingSessions: () => void
  }) => {
  setInterval(async () => {
    const appState = store.get('appState')

    if (!appState.currentUserId) return

    const session = await isLoggedIn(
      appState.currentUserId
    )

    if (!session?.loggedIn) {
      console.log('Attendance expired')

      store.set('appState', {
        trackingEnabled: false,
        currentUserId: '',
        attendanceId: '',
        appInitialized: true
      })

      clearCurrentSession()
      clearPendingSessions()

      store.delete('currentSession')

      mainWindow?.webContents.send(
        'app:auto-logout'
      )
    }
  }, PERIODIC_CHECK_MS)
}



