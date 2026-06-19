import type { UserStoreType } from '../types'
import { AlertIpc } from './alert'
import { UserIpc } from './user'
import { AppState } from '../types'

export function IPC_Handlers({
  userInfoStore,
  appState
}: {
  userInfoStore: UserStoreType
  appState: AppState
}) {
  UserIpc({ store: userInfoStore, appState })
  AlertIpc()
}
