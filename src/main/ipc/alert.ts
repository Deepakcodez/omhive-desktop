import { ipcMain, dialog, BrowserWindow } from 'electron'

type AlertPayload = {
  title: string
  message: string
  type?: 'info' | 'warning' | 'error'
}

export const AlertIpc = () => {
  ipcMain.handle  ('system:alert', async (_, payload: AlertPayload) => {
    const win = BrowserWindow.getFocusedWindow()

    return dialog.showMessageBox(win!, {
      type: payload.type ?? 'info',
      title: payload.title,
      message: payload.message,
      buttons: ['OK']
    })
  })
}
