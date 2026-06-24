export type TAttendanceSession = {
    attendanceId: string
    loginTime: string
    logoutTime: string | null

    status: 'working' | 'break' | 'logged_out'

    workSeconds: number
    breakSeconds: number
    idleSeconds: number
}

export type TUserAttendance = {
    userId: string
    userName: string
    fullName: string

    totalWorkSeconds: number
    totalBreakSeconds: number
    totalIdleSeconds: number

    sessions: TAttendanceSession[]
}

export type DailyAttendanceResponse = {
    data: TUserAttendance[]
    success: boolean
    message: string
}