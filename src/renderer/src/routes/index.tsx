import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [username, setUsername] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleAction = (action: string) => {
    console.log({
      username,
      action,
      time: new Date().toISOString(),
    })
  }

  return (
    <div className="min-h-screen bg-background flex flex-col gap-4 items-center justify-center p-4 select-none">
      <div>

       <h2 className="text-[10vw] leading-none font-bold mt-2 text-white/20">
            {currentTime.toLocaleTimeString()}
          </h2>
          <p className="mt-4 text-white text-end">
            {currentTime.toLocaleDateString()}
          </p>
      </div>
      <div className="w-full max-w-2xl rounded-2xl bg-card shadow-xl p-6 border border-border">
        {/* Header */}
        <div className="text-center mb-8">

          

         
        </div>

        {/* Username */}
        <div className="mb-6">
          <label className="block mb-2 font-medium text-foreground">
            Username
          </label>

          <input
            type="text"
            placeholder="Enter username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full   bg-foreground p-3 outline-none rounded-full"
          />
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleAction('LOGIN')}
            className="rounded-lg bg-green-600 text-white py-3 font-semibold hover:opacity-90"
          >
            Login
          </button>

          <button
            onClick={() => handleAction('BREAK')}
            className="rounded-lg bg-yellow-500 text-white py-3 font-semibold hover:opacity-90"
          >
            Break
          </button>

          <button
            onClick={() => handleAction('LOGOUT')}
            className="rounded-lg bg-red-600 text-white py-3 font-semibold hover:opacity-90"
          >
            Logout
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Status: Ready
        </div>
      </div>
    </div>
  )
}