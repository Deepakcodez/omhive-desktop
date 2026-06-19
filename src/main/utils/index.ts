import { API_ENDPOINT } from "../constants"
import { TSession } from "../types"



export async function syncToServer(sessions: TSession[]): Promise<void> {
    try {
        const res = await fetch("http://localhost:5001", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessions)
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        console.log(`[sync] Sent ${sessions.length} session(s)`)
    } catch (err) {
        // Put sessions back so they're retried next cycle
        console.error('[sync] Failed, will retry:', err)
        throw new Error(`HTTP error! ${err}` )
    }
}

export const isLoggedIn = async (userId: string): Promise<{
    loggedIn: boolean;
    attendanceId: string;
    loginTime: Date;
    status: "working" | "break" | "logged_out";
} | {
    loggedIn: boolean;
    attendanceId: null;
    loginTime: null;
    status: null;
}> => {
    try {
        const date = new Date().toISOString().split('T')[0]
        const res = await fetch(`${API_ENDPOINT}/user/is-logged-in`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, date })
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        console.log(data.data)
        return data.data
    } catch (err) {
        console.error('[isLoggedIn] Failed:', err)
        return {
            loggedIn: false,
            attendanceId: null,
            loginTime: null,
            status: null,
        }
    }
}