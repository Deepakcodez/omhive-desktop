import { ipcMain } from "electron"
import ElectronStore from "electron-store"
import { StoreType } from "../types"

export const SyncAppIpc = ({
    store,
}: {
    store: ElectronStore<StoreType>
}) => {
    ipcMain.handle('app:sync', () => {
        const appState = store.get('appState')

        return {
            initialized: appState.appInitialized,
            loggedIn: !!appState.currentUserId,
            trackingEnabled: appState.trackingEnabled,
            userId: appState.currentUserId,
            attendanceId: appState.attendanceId,
            isAdmin: appState.isAdmin ?? false
        }
    })
}
