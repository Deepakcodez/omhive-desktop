import ElectronStore from 'electron-store'
import { API_ENDPOINT } from '../constants'
import type { AppState, StoreType, TSession } from '../types'


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
  userId: string
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
    const date = new Date().toISOString().split('T')[0]
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