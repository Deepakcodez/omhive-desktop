import { AlertIpc } from './alert'
import { loginUserIpc } from './user'

export function IPC_Handlers() {
    loginUserIpc()
    AlertIpc()
}