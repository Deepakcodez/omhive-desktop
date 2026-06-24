import { ExitConfirmation } from '@renderer/features/user/components/ExitConfirmation'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

const RootLayout = () => {
  const [showExitModal, setShowExitModal] = useState(false)


    useEffect(() => {
      const unsubscribe = window.api.onBeforeClose(() => {
        const isValidToOpenModal =
          localStorage.getItem('status') !== null

        if (isValidToOpenModal) {
          setShowExitModal(true)
        }
      })

      return unsubscribe
    }, [])


  return (
    <>
      <div>
        <Outlet />
        <Toaster />
        {
          showExitModal &&
          <ExitConfirmation setShowExitModal={setShowExitModal} />

        }
      </div>
    </>
  )
}

export const Route = createRootRoute({ component: RootLayout })
