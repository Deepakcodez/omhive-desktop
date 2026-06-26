import { cn } from '@renderer/lib/utils'
import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

export const Route = createFileRoute('/')({
  component: RouteComponent
})

function RouteComponent() {
  const [user, setUser] = useState<{ name: string, id: string } | null>(null)
  const [inputUserName, setInputUserName] = useState('')
  const [currentTime, setCurrentTime] = useState(new Date())
  const [workStatus, setWorkStatus] = useState<'working' | 'break' | null>(null)

  const setWorkingStatus = (status: 'working' | 'break') => {
    localStorage.setItem('status', status)
    setWorkStatus(status)
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])


  useEffect(() => {
    const init = async () => {
      const auth = await window.api.isLoggedIn()

      if (!auth.loggedIn) {
        localStorage.removeItem('status')
        localStorage.removeItem('attendanceId')
      }
    }

    init()
  }, [])
  useEffect(() => {
    const status = localStorage.getItem('status')
    const userId = localStorage.getItem('userId')
    const userName = localStorage.getItem('userName')

    if (status) {
      setWorkStatus(status as 'working' | 'break')
    }

    if (userId && userName) {
      setUser({
        id: userId,
        name: userName
      })
    }
  }, [])

  const handleAction = async (action: 'LOGIN' | 'BREAK' | 'RESUME' | 'LOGOUT') => {
    if (action === 'LOGIN') {
      const username =
        user?.name || inputUserName.trim()

      if (!username) {
        await window.api.alert({
          title: 'Username Required',
          message: 'Please enter your username',
          type: 'error'
        })
        return
      }
      const resp = await window.api.loginUser({ username })
      console.log(resp)
      if (resp?.isAdmin) {
        console.log("admin")
        window.location.href = '/admin'
        return
      }
      if (!resp.success || resp.data === null) {
        await window.api.alert({
          title: 'Login Failed',
          message: 'You are not authorized to login',
          type: 'error'
        })
        return
      }
      if (resp.data.existing) {
        localStorage.setItem('userId', resp.data.userId)
        localStorage.setItem('userName', resp.data.userName)
        localStorage.setItem('attendanceId', resp.data.attendanceId)
        setUser({ name: resp.data.userName, id: resp.data.userId })
        setWorkingStatus(resp.data.status)
        await window.api.alert({
          title: 'Already Logged in',
          message: `Your are Already logged in at ${new Date(resp.data.loginTime).toLocaleString()}`,
          type: 'info'
        })
        return
      }
      if (resp?.data?.userId) {
        localStorage.setItem('userId', resp.data.userId)
        localStorage.setItem('userName', resp.data.userName)
        localStorage.setItem('attendanceId', resp.data.attendanceId)
        setUser({ name: resp.data.userName, id: resp.data.userId })
        setWorkingStatus(resp.data.status)
        toast.success('Logged in successfully')
      }
    }
    if (action === 'BREAK') {
      const attandanceId = localStorage.getItem('attendanceId')
      if (!attandanceId) {
        await window.api.alert({
          title: 'Not Logged in',
          message: 'You are not logged in',
          type: 'error'
        })
        return
      }
      const resp = await window.api.breakUser({ attendanceId: attandanceId })
      if (!resp.success || resp.data === null) {
        await window.api.alert({
          title: 'Break Failed',
          message: resp.message || 'You are not authorized to take  break',
          type: 'error'
        })
        return
      }
      localStorage.setItem('breakId', resp.data?.breakId)
      setWorkingStatus('break')
      toast.success('Break started successfully')
    }

    if (action === 'RESUME') {
      const attandanceId = localStorage.getItem('attendanceId')
      if (!attandanceId) {
        await window.api.alert({
          title: 'Not on Break',
          message: 'You are not on break',
          type: 'error'
        })
        return
      }
      const resp = await window.api.resumeUser({ attendanceId: attandanceId })
      if (!resp.success || resp.data === null) {
        await window.api.alert({
          title: 'Resume Failed',
          message: resp.message || 'You are not authorized to resume',
          type: 'error'
        })
        return
      }
      if (resp?.data?.durationSeconds) {
        localStorage.removeItem('breakId')
        setWorkingStatus('working')
        toast.success('Break resumed successfully')
      } else {
        await window.api.alert({
          title: 'Resume Failed',
          message: resp.message || 'You are not authorized to resume',
          type: 'error'
        })
      }
    }
    if (action === 'LOGOUT') {
      const attandanceId = localStorage.getItem('attendanceId')
      if (!attandanceId) {
        await window.api.alert({
          title: 'Not Logged in',
          message: 'You are not logged in',
          type: 'error'
        })
        return
      }
      try {
        const resp = await window.api.logoutUser({ attendanceId: attandanceId })
        if (resp === null) {
          await window.api.alert({
            title: 'Logout Failed',
            message: 'You are not authorized to logout',
            type: 'error'
          })
          return
        }
        console.log('ress', resp)
        if (resp?.alreadyLoggedOut) {
          await window.api.alert({
            title: 'Already Logged Out',
            message: 'You are already logged out',
            type: 'info'
          })
        } else {
          localStorage.removeItem("attendanceId")
          localStorage.removeItem("status")
          localStorage.removeItem("breakId")
          setWorkStatus(null)
          await window.api.alert({
            type: 'info',
            title: 'Logged Out Successfully',
            message: `You are logged out successfully. You worked for ${((resp.totalWorkSeconds || 0) / 3600).toFixed(2)} hours`
          })
        }
      } catch (error) {
        await window.api.alert({
          title: 'Logout Failed',
          message: 'You are not authorized to logout',
          type: 'error'
        })
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col gap-4 items-center justify-center p-4 select-none">
      <div className='flex flex-col  justify-center items-center'>
        <h2 className="text-[10vw] leading-none font-bold mt-2 text-white/20">
          {currentTime.toLocaleTimeString()}
        </h2>
        <div className='bg-linear-to-b from-white/30 to-card w-fit px-2 border-t border-t-white/30 rounded-full  '>
          <p className=" text-white/40 text-end">{currentTime.toLocaleDateString()}</p>
        </div>
      </div>
      <div className="w-full max-w-2xl rounded-2xl bg-linear-to-b from-white/20 to-card shadow-xl p-6 border border-white/30">
        {/* Header */}
        <div className="text-center mb-8"></div>

        {/* Username */}
        {(!user?.name || !user.id) && (
          <div className="mb-6">
            <label className="block mb-2 font-medium text-foreground">Username</label>

            <input
              type="text"
              placeholder="Enter username"
              value={inputUserName}
              onChange={(e) => setInputUserName(e.target.value)}
              className="w-full   bg-foreground p-3 outline-none rounded-full"
            />
          </div>
        )}

        {user?.name && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">
              Welcome Back <span className="text-primary uppercase">{user?.name}</span>!
            </h1>
          </div>
        )}

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              const isLoggedIn =
                workStatus === 'working' ||
                workStatus === 'break'
              isLoggedIn ?
                handleAction('LOGOUT') :
                handleAction('LOGIN')
            }}
            className={cn("rounded-full text-white py-3 font-semibold hover:opacity-90 active:scale-95  transition-all duration-300",
              (workStatus === 'working' ||
                workStatus === 'break') ? 'bg-linear-to-b from-red-500 to-red-600 border border-red-400' : 'bg-linear-to-b from-green-500 to-green-600')}
          >
            {(workStatus === 'working' ||
              workStatus === 'break') ? 'Logout' : 'Login'}
          </button>

          <button
            onClick={() => {
              const attendanceId =
                localStorage.getItem('attendanceId')
              if (!attendanceId) {
                window.api.alert({
                  title: 'Already Logged Out',
                  message: 'You are already logged out',
                  type: 'info'
                })
                return
              }
              if (workStatus == 'break') {
                console.log('clling resume')
                handleAction('RESUME')
              } else {
                handleAction('BREAK')
              }
            }}
            className={cn("rounded-full  text-white py-3 font-semibold hover:opacity-90 active:scale-95  transition-all duration-300",
              workStatus === 'break' ? "bg-linear-to-b from-purple-500 to-purple-600 border border-purple-400" : "bg-linear-to-b from-yellow-500 to-yellow-600 border border-yellow-400"

            )}
          >
            {workStatus === 'break' ? 'Resume' : 'Break'}
          </button>


        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Status: {workStatus?.toUpperCase() || 'Not Logged In Yet'}
        </div>
        <Link to="/admin">go to dashboard</Link>
      </div>
    </div>
  )
}
