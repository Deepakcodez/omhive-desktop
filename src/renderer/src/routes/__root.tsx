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
      const openModal =
        localStorage.getItem('status') !== null

      if (openModal) {
        setShowExitModal(true)
      }
    })

    return unsubscribe
  }, [])



  useEffect(() => {
    const initialize = async () => {
      try {
        const state = await window.api.syncApp();
        console.log("App initialized:", state);

        // useAppStore.setState(state);
      } catch (error) {
        console.error(error);
      }
    };

    initialize();
  }, []);

  useEffect(() => {
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
        {
          showExitModal &&
          <ExitConfirmation setShowExitModal={setShowExitModal} />
        }
        {globalError && (
          <GlobalErrorCard />
        )}

        {
          isQuitting &&
          <QuittingLoader />
        }
      </div>
    </>
  )
}

export const Route = createRootRoute({ component: RootLayout })
