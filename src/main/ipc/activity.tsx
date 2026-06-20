import { ipcMain } from "electron"
import { API_ENDPOINT } from "../constants"

export function ActivityIpc() {
    ipcMain.handle('activity:track', async (_, payload: { userId: string, attendanceId: string, date: string, limit: number }) => {

        console.log(payload.date)
        try {
            const limit = payload.limit || 100
            const url = new URL(`${API_ENDPOINT}/activity/date/${payload.date}`)
            if (payload.userId) {
                url.searchParams.append('userId', payload.userId)
            }
            if (payload.attendanceId) {
                url.searchParams.append('attendanceId', payload.attendanceId)
            }
            url.searchParams.append('limit', String(limit))

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }

            const contentType = response.headers.get('content-type')
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text()
                throw new Error(`Expected JSON response, but got: ${text.slice(0, 100)}`)
            }

            const data = await response.json()
            console.log('data', data)
            return {
                data: data.data,
                success: true,
                message: data.message
            }
        } catch (error) {
            console.error('Error fetching user activity:', error)
            return {
                data: null,
                success: false,
                message: `Error - ${error}`
            }
        }
    })

}
