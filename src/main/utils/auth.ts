import ElectronStore from "electron-store"
import { StoreType } from "../types"
import { API_ENDPOINT } from "../constants"
import { updateAppState } from "."

export const handleUserLogout = async ({
    attendanceId
}: {
    attendanceId: string
}) => {
    try {
        console.log('logging out user', attendanceId)
        const response = await fetch(API_ENDPOINT + '/user/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ attendanceId: attendanceId })
        })

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        const { data } = await response.json()
        console.log('logout response', data)
        
        return data
    } catch (error) {
        console.error('Error  in logging out user:', error)
        
        return null
    }
}

export const handleUserBreak = async ({
    store,
    payload
}: {
    store: ElectronStore<StoreType>,
    payload: {
        attendanceId: string,

    }
}) => {
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
}


export const handleUserResume = async ({
    store,
    payload
}: {
    store: ElectronStore<StoreType>,
    payload: {
        attendanceId: string,

    }
}) => {
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
        updateAppState(store, {
            trackingEnabled: true
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
}