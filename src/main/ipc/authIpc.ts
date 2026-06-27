import { ipcMain } from "electron"
import ElectronStore from "electron-store"
import { StoreType } from "../types"

export const AuthIpc = ({
    store,
}: {
    store: ElectronStore<StoreType>
}) => {
    ipcMain.handle('auth:status', () => {
        const appState = store.get('appState')

        return {
            initialized: appState.appInitialized,
            loggedIn: !!appState.currentUserId,
            trackingEnabled: appState.trackingEnabled,
            attendanceId: appState.attendanceId
        }
    })

}
