import { ipcMain } from "electron"
import { API_ENDPOINT } from "../constants";


type CreateUserType = {
    userName: string;
    fullName: string;
    phone: string
}


export function AdminIpc() {
    ipcMain.handle('admin:create-user', async (_, payload: CreateUserType) => {
        try {
            console.log("payload", payload)
            const response = await fetch(API_ENDPOINT + `/admin/create-user`, {
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
            console.log("created user-->", data)
            return data
        } catch (error) {
            console.error('Error  in creating user:', error)
            return {
                data: null,
                success: false,
                message: `Error - ${error}`
            }
        }

    })
    ipcMain.handle('admin:deactivate-user', async (_, payload: { userId: string }) => {
        try {
            console.log("payload", payload)
            const response = await fetch(API_ENDPOINT + `/admin/deactivate-user`, {
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
            console.log("deactivated user-->", data)
            return data
        } catch (error) {
            console.error('Error  in deactivate user:', error)
            return {
                data: null,
                success: false,
                message: `Error - ${error}`
            }
        }

    })
    ipcMain.handle('admin:activate-user', async (_, payload: { userId: string }) => {
        try {
            console.log("payload", payload)
            const response = await fetch(API_ENDPOINT + `/admin/activate-user`, {
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
            console.log("deactivated user-->", data)
            return data
        } catch (error) {
            console.error('Error  in activate user:', error)
            return {
                data: null,
                success: false,
                message: `Error - ${error}`
            }
        }

    })

}