import { AlertIpc } from './alert'
import { UserIpc } from './user'
import { AppState, StoreType } from '../types'
import { ActivityIpc } from './activity'
import type ElectronStore from 'electron-store'
import { AttendanceIpc } from './attendance'

export function IPC_Handlers({
  store,
  appState
}: {
  store: ElectronStore<StoreType>
  appState: AppState
}) {
  UserIpc({ store, appState })
  ActivityIpc()
  AttendanceIpc()
  AlertIpc()
}
