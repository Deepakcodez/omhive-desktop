import { ipcMain } from 'electron'
import os from 'os'
import { API_ENDPOINT } from '../constants'
import { StoreType } from '../types'
import type ElectronStore from 'electron-store'
import { getLocalDate, updateAppState } from '../utils'
import { handleUserLogout } from '../utils/auth'

const HOSTNAME = os.hostname()
const USERNAME = os.userInfo().username

export function UserIpc({ store }: { store: ElectronStore<StoreType> }) {
  ipcMain.handle('user:login', async (_, payload: { username: string }) => {
    const bodyData = {
      userName: payload.username,
      hostname: HOSTNAME,
      os: os.platform(),
      systemUsername: USERNAME,
      startTime: new Date().toISOString(),
      timezone: Intl.DateTimeFormat()
        .resolvedOptions()
        .timeZone
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
      console.log('data of login line 34 in user.ts ipc', data)
      if (!store) {
        return data
      }
      store.set('userInfo', {
        userId: data.data.userId,
        isAdmin: data.data.isAdmin,
        userName: data.data.username,
        attendanceId: data.data.attendanceId
      })


      const isAdmin: boolean = data.data.isAdmin ?? false

      updateAppState(store, {
        trackingEnabled: isAdmin ? false : true, // admins are never tracked
        currentUserId: data.data.userId,
        attendanceId: data.data.attendanceId,
        isAdmin
      })
      return {
        data: data.data,
        success: true,
        message: 'User logged in'
      }
    } catch (error) {
      console.error('Error logging in user:', error)

      updateAppState(store, {
        trackingEnabled: false,
        currentUserId: '',
        attendanceId: ''
      })
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


        updateAppState(store, {
          trackingEnabled: false
        })
      }
      return data
    } catch (error) {
      console.error('Error in taking break:', error)
      updateAppState(store, {
        trackingEnabled: false
      })
      return {
        data: null,
        success: false,
        message: `Error - ${error}`
      }
    }
  })
  ipcMain.handle('user:resume', async (_, payload: { attendanceId: string }) => {
    console.log('resuming user payload', payload)
    try {
      const response = await fetch(API_ENDPOINT + '/user/resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      console.log('resuming user response', response)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      const appState = store.get('appState')
      updateAppState(store, {
        trackingEnabled: appState.isAdmin ? false : true
      })
      return data
    } catch (error) {
      console.error('Error  in resuming user:', error)
      updateAppState(store, {
        trackingEnabled: false
      })
      return {
        data: null,
        success: false,
        message: `Error - ${error}`
      }
    }
  })
  ipcMain.handle('user:logout', async (_, payload: { attendanceId: string }) => {
    console.log('user:logout payload', payload)
    try {
      const data = await handleUserLogout({
        attendanceId: payload.attendanceId
      })
      console.log('user:logout response', data)
      if (data !== null) {
        updateAppState(store, {
          trackingEnabled: false,
          currentUserId: '',
          attendanceId: '',
          isAdmin: false
        })
        const userInfo = store.get('userInfo')
        store.set('userInfo', { ...userInfo, attendanceId: '', isAdmin: false })
      }
      return data
    } catch (error) {
      console.error('Error  in loggin out user:', error)
      updateAppState(store, {
        trackingEnabled: false,
        currentUserId: '',
        attendanceId: '',
        isAdmin: false
      })
      const userInfo = store.get('userInfo')
      store.set('userInfo', { ...userInfo, attendanceId: '', isAdmin: false })
      return null
    }
  })
  ipcMain.handle('user:logout-and-exit', async (_, payload: { attendanceId: string }) => {
    console.log('user:logout-and-exit payload', payload)
    try {
      const data = await handleUserLogout({
        attendanceId: payload.attendanceId
      })
      console.log('user:logout-and-exit response', data)

      // Always clean up store state regardless of API response
      updateAppState(store, {
        trackingEnabled: false,
        currentUserId: '',
        attendanceId: '',
        isAdmin: false
      })

      // Clear stored attendanceId and admin status from userInfo as well
      const userInfo = store.get('userInfo')
      store.set('userInfo', { ...userInfo, attendanceId: '', isAdmin: false })

      return data
    } catch (error) {
      console.error('Error in logout-and-exit:', error)

      // Clean up store even on failure so tracking stops
      updateAppState(store, {
        trackingEnabled: false,
        currentUserId: '',
        attendanceId: '',
        isAdmin: false
      })

      const userInfo = store.get('userInfo')
      store.set('userInfo', { ...userInfo, attendanceId: '', isAdmin: false })

      return null
    } finally {
      // Trigger the full graceful quit sequence:
      // → flushes current tracking session to server
      // → stops power-save blocker
      // → calls app.quit()
      ipcMain.emit('app:close')
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
      console.error('Error  in logout user:', error)
      return null
    }
  })

  ipcMain.handle('user:list', async () => {
    try {
      const response = await fetch(API_ENDPOINT + '/admin/user-list', {
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
      console.error('Error  in listing user:', error)
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
      const today = payload.date || getLocalDate()
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
      console.error('Error  in user with login logout:', error)
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
      console.error('Error  in user attendance:', error)
      return {
        data: null,
        success: false,
        message: `Error - ${error}`
      }
    }
  })
}
