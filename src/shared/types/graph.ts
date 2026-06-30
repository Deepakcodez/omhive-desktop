export type GraphData = ({
    id: string;
    syncId: string;
    attendanceId: string;
    userId: string;
    activityType: "idle";
    startTime: Date;
    endTime: Date | null;
    duration: number;
    software: string;
    title: string;
    hostname: string;
    systemUsername: string;
} | {
    id: string;
    syncId: string;
    attendanceId: string;
    userId: string;
    activityType: "break" | "work";
    startTime: Date;
    endTime: Date;
    duration: number;
    software: string;
    title: string;
    hostname: string;
    systemUsername: string;
})