import ElectronStore from 'electron-store'
import { API_ENDPOINT, HEARTBEAT_CHECK_MS, PERIODIC_CHECK_MS } from '../constants'
import type { AppState, StoreType, TSession } from '../types'
import { BrowserWindow } from 'electron'


export type SessionStatus = {
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

export type AutoLogoutParams = {
  store: ElectronStore<StoreType>;
  mainWindow: BrowserWindow | null;
  clearCurrentSession: () => void;
  clearPendingSessions: () => void;
  reason?: string;
};



export function getLocalDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata'
  }).format(date)
}


export const getAppState = (store: ElectronStore<StoreType>) => {
  const appState = store.get("appState");

  return {
    initialized: appState.appInitialized,
    loggedIn: !!appState.currentUserId,
    trackingEnabled: appState.trackingEnabled,
    userId: appState.currentUserId,
    attendanceId: appState.attendanceId,
  };
};


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


export async function syncToServer(sessions: TSession[]): Promise<{ success: boolean }> {
  try {
    const res = await fetch(`${API_ENDPOINT}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessions)
    })
    if (!res.ok) {
      return {
        success: false
      }
    }
    console.log(`[sync] Sent ${sessions.length} session(s)`)
    return {
      success: res.ok
    }
  } catch (err) {
    return {
      success: false
    }
  }
}

export const isLoggedIn = async (
  userId: string,
): Promise<SessionStatus> => {
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

export const sendHeartBeat = ({
  store,
  mainWindow,
  clearCurrentSession,
  clearPendingSessions
}: {
  store: ElectronStore<StoreType>
  mainWindow: BrowserWindow | null
  clearCurrentSession: () => void
  clearPendingSessions: () => void
}) => {

  setInterval(async () => {
    const appState = store.get("appState")
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

      if (!resp.ok) {
        throw new Error(
          `Heartbeat failed: ${resp.status}`
        )
      }

      const { data } = await resp.json()

      if (!data.loggedIn) {
        // Session expired on the server — force a local logout so the
        // renderer returns to the login screen and tracking stops.
        handleAutoLogout({
          store,
          mainWindow,
          clearCurrentSession,
          clearPendingSessions,
          reason: "Attendance Expired",
        });
      }
    } catch (error) {
      console.log("heartbeat error -> ", error)

    }
  }, HEARTBEAT_CHECK_MS)
}





export const handleAutoLogout = ({
  store,
  mainWindow,
  clearCurrentSession,
  clearPendingSessions,
  reason = "Attendance Expired",
}: AutoLogoutParams) => {
  const userInfo = store.get("userInfo");

  // Clear application state
  store.set("appState", {
    trackingEnabled: false,
    currentUserId: "",
    attendanceId: "",
    appInitialized: true,
  });

  // Clear stored attendance
  store.set("userInfo", {
    ...userInfo,
    attendanceId: "",
  });

  // Clear activity state
  clearCurrentSession();
  clearPendingSessions();

  store.delete("currentSession");

  // Notify renderer
  if (
    mainWindow &&
    !mainWindow.isDestroyed()
  ) {
    mainWindow.webContents.send(
      "app:auto-logout",
      {
        reason,
      }
    );
  }

  console.log(
    `User automatically logged out: ${reason}`
  );
};

export const quitApp = async ({app, isQuitting,blockerId, powerSaveBlocker, closeCurrentSession}) => {
  if (isQuitting) return;

  isQuitting = true;

  try {
    if (
      blockerId !== null &&
      powerSaveBlocker.isStarted(blockerId)
    ) {
      powerSaveBlocker.stop(blockerId);
      blockerId = null;
    }

    const closed = closeCurrentSession();

    if (closed) {
      await syncToServer([closed]);
    }
  } catch (error) {
    console.error(
      "Error during app shutdown:",
      error
    );
  } finally {
    app.quit();
  }
};