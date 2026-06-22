import { ipcMain } from 'electron'
import os from 'os'
import { API_ENDPOINT } from '../constants'
import { AppState, UserStoreType } from '../types'

const HOSTNAME = os.hostname()
const USERNAME = os.userInfo().username

export function UserIpc({ store, appState }: { store: UserStoreType; appState: AppState }) {
  ipcMain.handle('user:login', async (_, payload: { username: string }) => {
    const bodyData = {
      userName: payload.username,
      hostname: HOSTNAME,
      os: os.platform(),
      systemUsername: USERNAME,
      startTime: new Date().toISOString()
    }
    try {
      const response = await fetch(API_ENDPOINT + '/user/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bodyData)
      })

      const data = await response.json()
      console.log('data', data)
      if (!store) {
        return data
      }
      store.set('userInfo', {
        userId: data.data.userId,
        userName: data.data.username,
        attendanceId: data.data.attendanceId
      })
      appState.trackingEnabled = true
      appState.currentUserId = data.data.userId
      appState.attendanceId = data.data.attendanceId
      return {
        data: data.data,
        success: true,
        message: 'User logged in',
        isAdmin: data.isAdmin
      }
    } catch (error) {
      console.error('Error logging in user:', error)
      appState.trackingEnabled = false
      return {
        data: null,
        success: false,
        message: `Error - ${error}`
      }
    }
  })
  ipcMain.handle('user:break', async (_, payload: { attendanceId: string }) => {
    try {
      const response = await fetch(API_ENDPOINT + '/user/break', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      const data = await response.json()
      console.log(data)
      if (data.success) {
        appState.trackingEnabled = false
      }
      return data
    } catch (error) {
      console.error('Error in taking break:', error)
      appState.trackingEnabled = false
      return {
        data: null,
        success: false,
        message: `Error - ${error}`
      }
    }
  })
  ipcMain.handle('user:resume', async (_, payload: { attendanceId: string }) => {
    try {
      const response = await fetch(API_ENDPOINT + '/user/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      appState.trackingEnabled = true
      return data
    } catch (error) {
      console.error('Error  in resuming user:', error)
      appState.trackingEnabled = false
      return {
        data: null,
        success: false,
        message: `Error - ${error}`
      }
    }
  })
  ipcMain.handle('user:logout', async (_, payload: { attendanceId: string }) => {
    try {
      const response = await fetch(API_ENDPOINT + '/user/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const { data } = await response.json()
      appState.trackingEnabled = false
      return data
    } catch (error) {
      console.error('Error  in resuming user:', error)
      appState.trackingEnabled = false
      return null
    }
  })
  ipcMain.handle('user:set-info', async (_, payload: { userId: string; name: string }) => {
    try {
      const response = await fetch(API_ENDPOINT + '/user/set-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const { data } = await response.json()
      return data
    } catch (error) {
      console.error('Error  in resuming user:', error)
      return null
    }
  })

  ipcMain.handle('user:list', async () => {
    try {
      const response = await fetch(API_ENDPOINT + '/user/list', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error  in resuming user:', error)
      return {
        data: null,
        success: false,
        message: `Error - ${error}`
      }
    }
  })
  ipcMain.handle('user:with-login-logout', async (_, payload: { date: string }) => {
    try {
      console.log("user:with-login-logout payload", payload)
      const today = payload.date || new Date().toISOString().split('T')[0]
      const response = await fetch(API_ENDPOINT + `/user/with-login-logout/${today}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("userf,", data)
      return data
    } catch (error) {
      console.error('Error  in resuming user:', error)
      return {
        data: null,
        success: false,
        message: `Error - ${error}`
      }
    }
  })
  ipcMain.handle('user:attendance', async (_, payload: { month: number, year: number, userId: string }) => {
    try {
      console.log("payload", payload)
      const response = await fetch(API_ENDPOINT + `/user/attendance/month/${payload.month}/year/${payload.year}/userId/${payload.userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      console.log("userf,", data)
      return data
    } catch (error) {
      console.error('Error  in resuming user:', error)
      return {
        data: null,
        success: false,
        message: `Error - ${error}`
      }
    }
  })
}
