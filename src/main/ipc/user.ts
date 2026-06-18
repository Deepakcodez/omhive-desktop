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
            const response = await fetch('http://localhost:5001/api/user/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData),
            })

            const text = await response.text()

            console.log('Status:', response.status)
            console.log('Response:', text)

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            console.log('User logged in successfully')
        } catch (error) {
            console.error('Error logging in user:', error)
        }
    })
}