import { Loader } from 'lucide-react'



export default function QuittingLoader() {
    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80">

            <div className="flex flex-col items-center justify-center gap-3">
                <Loader className='animate-spin' />

                <span className=''>
                    Closing OMhive...
                </span>
            </div>
        </div>
    )
}