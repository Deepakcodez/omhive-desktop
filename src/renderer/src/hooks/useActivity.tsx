import { useEffect, useState } from 'react'

type TSession = {
  startTime: number
  endTime: number
  duration: number
  software: string
  title: string
  hostname: string
  username: string
}

export function useActivity(): {
  sessions: TSession[]
  totalByApp: Record<string, number>
} {
  const [sessions, setSessions] = useState<TSession[]>([])

  useEffect(() => {
    // Hydrate with any sessions that arrived before the window opened
    window.api.getPendingSessions().then((existing) => {
      setSessions(existing)
    })

    // Stream live updates
    window.api.onActivityUpdate((session) => {
      setSessions((prev) => [session, ...prev])
    })

    return () => window.api.removeActivityListeners()
  }, [])

  // Derived stats
  const totalByApp = sessions.reduce<Record<string, number>>((acc, s) => {
    acc[s.software] = (acc[s.software] ?? 0) + s.duration
    return acc
  }, {})

  return { sessions, totalByApp }
}
