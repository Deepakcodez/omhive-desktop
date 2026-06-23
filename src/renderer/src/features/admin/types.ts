export interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{
    name: string
    value: number
    color: string
    fill?: string
  }>
  label?: string
}


export interface CustomPieTooltipProps {
  active?: boolean
  payload?: Array<{
    payload: {
      name: string
      value: number
      color: string
    }
  }>
}



export type StatsType = {
    totalActiveSec: number;
    totalIdleSec: number;
    ratio: number;
    topApp: string;
    formattedActive: string;
    formattedIdle: string;
    workHourProgress: number;   // percentage of 9-hr target (0–100+)
    remainingSec: number;       // seconds left to hit 9-hr target (negative = exceeded)
}


  export interface ChartBin {
    time: string
    Idle: number
    [app: string]: string | number
  }


 export  type DetailedSession = {
  id: string;
  attendanceId: string;
  userId: string;
  activityType: "break" | "work";
  startTime: number | Date;
  endTime: number | Date;
  duration: number;
  software: string;
  title: string;
  hostname: string;
  systemUsername: string;
}