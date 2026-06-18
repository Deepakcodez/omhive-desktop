import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})




function RouteComponent() {
  const [userName, setUserName] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [workStatus, setWorkStatus] = useState<"working" | "break" | "logged_out" | null>(null)

  const getWorkingStatus = (): "working" | "break" | "logged_out" | null => {
    const status = localStorage.getItem('status')
    return status as "working" | "break" | "logged_out" | null
  }
  const getUserDetail = (): { name: string, id: string } | null => {
    const name = localStorage.getItem('userName')
    const id = localStorage.getItem('userId')
    if (name && id) return { name, id }
    return null
  }
  const setWorkingStatus = (status: "working" | "break" | "logged_out") => {
    localStorage.setItem('status', status)
    setWorkStatus(status)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleAction = async (action: string) => {
    if (action === 'LOGIN') {

      if (!userName.trim()) {
        await window.api.alert({ title: "Username Required", message: "Please enter your username", type: "error" })
        return
      }

      const resp = await window.api.loginUser({ username: userName })
      if (resp === null) {
        await window.api.alert({ title: "Login Failed", message: "You are not authorized to login", type: "error" })
        return
      }
      if (resp?.existing) {
        await window.api.alert({ title: "Already Logged in", message: `Your are Already logged in at ${new Date(resp.loginTime).toLocaleString()}`, type: "info" })
        return
      }
      if (resp?.userId) {
        localStorage.setItem("userId", resp.userId)
        localStorage.setItem("userName", resp.username)
        localStorage.setItem("attendanceId", resp.attendanceId)
        setWorkingStatus('working')
        toast.success("Logged in successfully")
      } else {
        await window.api.alert({ title: "Login Failed", message: "You are not authorized to login", type: "error" })
      }
    }
    if (action === 'BREAK') {
      const attandanceId = localStorage.getItem('attendanceId');
      if (!attandanceId) {
        await window.api.alert({ title: "Not Logged in", message: "You are not logged in", type: "error" })
        return
      }
      const resp = await window.api.breakUser({ attendanceId: attandanceId })
      if (resp === null) {
        await window.api.alert({ title: "Break Failed", message: "You are not authorized to take  break", type: "error" })
        return
      }
      if (resp?.id) {
        localStorage.setItem("breakId", resp.id)
        setWorkingStatus('break')
        toast.success("Break started successfully")
      } else {
        await window.api.alert({ title: "Break Failed", message: "You are not authorized to take  break", type: "error" })
      }

    }

    if (action === 'RESUME') {
      const attandanceId = localStorage.getItem('attendanceId');
      if (!attandanceId) {
        await window.api.alert({ title: "Not on Break", message: "You are not on break", type: "error" })
        return
      }
      const resp = await window.api.resumeUser({ attendanceId: attandanceId })
      if (resp === null) {
        await window.api.alert({ title: "Resume Failed", message: "You are not authorized to resume", type: "error" })
        return
      }
      if (resp?.durationSeconds) {
        localStorage.removeItem("breakId")
        setWorkingStatus('working')
        toast.success("Break resumed successfully")
      } else {
        await window.api.alert({ title: "Resume Failed", message: "You are not authorized to resume", type: "error" })
      }

    }
    if (action === 'LOGOUT') {
      const attandanceId = localStorage.getItem('attendanceId');
      if (!attandanceId) {
        await window.api.alert({ title: "Not Logged in", message: "You are not logged in", type: "error" })
        return
      }
      try {
        const resp = await window.api.logoutUser({ attendanceId: attandanceId })
        if (resp === null) {
          await window.api.alert({ title: "Logout Failed", message: "You are not authorized to logout", type: "error" })
          return
        }
        console.log("ress", resp)
        if (resp?.alreadyLoggedOut) {
          await window.api.alert({ title: "Already Logged Out", message: "You are already logged out", type: "info" })
        } else {
          setWorkingStatus('logged_out')
          await window.api.alert({ type: 'info', title: "Logged Out Successfully", message: `You are logged out successfully. You worked for ${((resp.totalWorkSeconds || 0) / 3600).toFixed(2)} hours` })
        }

      } catch (error) {
        await window.api.alert({ title: "Logout Failed", message: "You are not authorized to logout", type: "error" })

      }

    }
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
        {

          !getUserDetail() &&
          < div className="mb-6">


            <label className="block mb-2 font-medium text-foreground">
              Username
            </label>

            <input
              type="text"
              placeholder="Enter username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full   bg-foreground p-3 outline-none rounded-full"
            />
          </div>
        }

        {
          getUserDetail() && (
            < div className="mb-6">


              <h1 className='text-3xl font-bold text-foreground'>Welcome Back <span className='text-primary uppercase'>{getUserDetail()?.name}</span>!</h1>

            </div>
          )
        }

        {/* Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleAction('LOGIN')}
            className="rounded-lg bg-green-600 text-white py-3 font-semibold hover:opacity-90"
          >
            Login
          </button>

          <button
            onClick={() => {
              if (getWorkingStatus() === 'logged_out') {
                window.api.alert({ title: "Already Logged Out", message: "You are already logged out", type: "info" })
                return
              }
              if (getWorkingStatus() == 'break') {
                console.log("clling resume")
                handleAction('RESUME')
              } else {
                handleAction('BREAK')
              }
            }}
            className="rounded-lg bg-yellow-500 text-white py-3 font-semibold hover:opacity-90"
          >
            {
              getWorkingStatus() === 'break' ? 'Resume' : 'Break'
            }
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
          Status: {getWorkingStatus()?.toUpperCase() || "Not Logged In Yet"}
        </div>
      </div>
    </div >
  )
}