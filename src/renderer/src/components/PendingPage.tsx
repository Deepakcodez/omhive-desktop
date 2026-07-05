import { Spinner } from './ui/spinner'



export default function PendingPage() {
    return (
        <div className='h-screen w-full bg-background flex items-center justify-center flex-col gap-3'>
            <Spinner />
        </div>
    )
}