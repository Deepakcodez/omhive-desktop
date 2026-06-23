import { PALETTE } from "./constants"

export const getAppColor = (app: string, index: number): string => {
  if (app === 'Idle') return '#475569' // Slate 600
  return PALETTE[index % PALETTE.length]
}
