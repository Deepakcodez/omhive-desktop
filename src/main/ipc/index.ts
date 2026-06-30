import { AlertIpc } from './alert'
import { UserIpc } from './user'
import { StoreType } from '../types'
import { ActivityIpc } from './activity'
import type ElectronStore from 'electron-store'
import { AttendanceIpc } from './attendance'

export function IPC_Handlers({
  store,
}: {
  store: ElectronStore<StoreType>
}) {
  UserIpc({ store })
  ActivityIpc()
  AttendanceIpc()
  AlertIpc()
}
