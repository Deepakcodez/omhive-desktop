import GlobalErrorCard from '@/components/ui/global-error-card'
import QuittingLoader from '@/components/ui/quitting-loader'
import { ExitConfirmation } from '@renderer/features/user/components/ExitConfirmation'
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'

const RootLayout = () => {
  const [showExitModal, setShowExitModal] = useState(false);
  const [isQuitting, setIsQuitting] = useState(false);
  const [globalError, setGlobalError] = useState<{
    type: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe =
      window.api.onGlobalError((error) => {
        console.error(
          "Global error:",
          error
        );

        setGlobalError(error);
      });

    return unsubscribe;
  }, []);

  useEffect(() => {
    const unsubscribe = window.api.onBeforeClose(() => {
      // Check if the user currently has an active session (working or on break).
      // `status` is stored in localStorage by index.tsx whenever the user logs in.
      const isUserActive = localStorage.getItem('status') !== null

      if (isUserActive) {
        // User is working or on break — show the exit confirmation modal so
        // they can choose to take a break or logout before closing.
        setShowExitModal(true)
      } else {
        // User is NOT logged in — show the quitting loader immediately so the
        // UI reflects that cleanup is happening, then tell main to close.
        // We set isQuitting here (renderer-side) rather than waiting for the
        // `app:quitting` IPC reply, because the window could close before that
        // round-trip message is processed and rendered.
        setIsQuitting(true)
        window.api.closeApp()
      }
    })

    return unsubscribe
  }, [])


  useEffect(() => {
    const initialize = async () => {
      try {
        // Sync the main-process app state into the renderer on startup.
        // Useful to restore tracking/login state after an unexpected restart.
        const state = await window.api.syncApp();
        console.log("App initialized:", state);
      } catch (error) {
        console.error(error);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
    // Listen for the `app:quitting` signal sent by the main process after the
    // user confirms exit. Show the full-screen loader immediately so the user
    // knows the app is doing cleanup and has NOT frozen.
    const unsubscribe =
      window.api.onAppQuitting(() => {
        setIsQuitting(true);
      });

    return unsubscribe;
  }, []);

  return (
    <>
      <div className='select-none'>
        <Outlet />
        <Toaster />

        {/* Exit confirmation modal — only shown when user is actively working */}
        {showExitModal && (
          <ExitConfirmation
            setShowExitModal={setShowExitModal}
            setIsQuitting={setIsQuitting}
          />
        )}

        {/* Global error overlay — shown on uncaught main-process errors */}
        {globalError && (
          <GlobalErrorCard />
        )}

        {/* Full-screen quitting loader — shown while main process flushes data */}
        {isQuitting && (
          <QuittingLoader />
        )}
      </div>
    </>
  )
}

export const Route = createRootRoute({ component: RootLayout })
