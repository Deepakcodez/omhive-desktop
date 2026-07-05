import Button from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'

type Props = {}

export default function RefreshAppState({ }: Props) {
    const [openConfirmationModal, setOpenConfirmationModal] = useState(false)

    const handleRefresh = () => {
        localStorage.clear()
        window.location.reload()
    }

    return (
        <>
            {/* Trigger Button */}
            <Button
                className='absolute top-12 right-12 aspect-square'
                onClick={() => setOpenConfirmationModal(true)}
            >
                <RotateCcw />
            </Button>

            {/* Confirmation Modal */}
            {openConfirmationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-card  p-6 rounded-lg shadow-lg max-w-sm w-full mx-4 ">
                        <h3 className="text-lg font-semibold text-zinc-50">
                            Restart Application?
                        </h3>
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                            This will clear all local data and restart the application. This action cannot be undone.
                        </p>

                        <div className="mt-6 flex justify-end gap-3">
                          
                            <Button
                                className='bg-linear-to-b from-red-400 to-red-600
                                '
                                onClick={handleRefresh}
                            >
                                OK, Restart
                            </Button>
                              <Button
                                className='bg-linear-to-b from-green-400 to-green-600'
                                onClick={() => setOpenConfirmationModal(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}