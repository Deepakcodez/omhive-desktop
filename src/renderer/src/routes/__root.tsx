import { createRootRoute,  Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { Toaster } from 'react-hot-toast';

const RootLayout = () => (
    <>
     <div>
        <Outlet />
         <Toaster />
        <TanStackRouterDevtools />
     </div>
    </>
)

export const Route = createRootRoute({ component: RootLayout })