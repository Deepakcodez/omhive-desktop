import { ipcMain } from 'electron'
import os from 'os'
import { API_ENDPOINT } from '../constants'

const HOSTNAME = os.hostname()
const USERNAME = os.userInfo().username

export function loginUserIpc() {
    ipcMain.handle('user:login', async (_, payload: { username: string }) => {
        const bodyData = {
            userName: payload.username,
            hostname: HOSTNAME,
            os: os.platform(),
            systemUsername: USERNAME,
            startTime: new Date().toISOString(),
        }
        console.log('loginUserIpc : ', bodyData)
        try {
            const response = await fetch(API_ENDPOINT + '/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const { data } = await response.json()
            return data
        } catch (error) {
            console.error('Error logging in user:', error)
            return null
        }
    })
    ipcMain.handle('user:break', async (_, payload: { attendanceId: string }) => {

        try {
            const response = await fetch(API_ENDPOINT + '/user/break', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            const { data } = await response.json()
            return data
        } catch (error) {
            console.error('Error in taking break:', error)
            return null
        }
    })
    ipcMain.handle('user:resume', async (_, payload: { attendanceId: string }) => {

        try {
            const response = await fetch(API_ENDPOINT + '/user/resume', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
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
}