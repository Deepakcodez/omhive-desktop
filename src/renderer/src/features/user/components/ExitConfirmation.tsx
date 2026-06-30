import { Coffee, LogOut, X } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'
import toast from 'react-hot-toast'

type Props = {
    setShowExitModal: Dispatch<SetStateAction<boolean>>
}

export const ExitConfirmation = ({ setShowExitModal }: Props) => {
    const handleCloseModal = () => {
        window.api.closeCancelled()
        setShowExitModal(false)
    }

    const takeBreak = async () => {
        const attendanceId = localStorage.getItem('attendanceId') || ''
        const resp = await window.api.breakUser({ attendanceId: attendanceId })
        if (!resp.success || resp.data === null) {
            toast.error('Something went wrong')
            return
        }
        localStorage.setItem('breakId', resp.data?.breakId)
        localStorage.setItem('status', resp.data?.status)
        window.api.closeApp()
    }
    const handleLogout = async () => {
        const attendanceId = localStorage.getItem('attendanceId') || ''
        const resp = await window.api.logoutUser({ attendanceId: attendanceId })
        if (resp === null) {
            toast.error('Something went wrong')
            return
        }
        localStorage.removeItem("attendanceId")
        localStorage.removeItem("status")
        localStorage.removeItem("breakId")
    }
    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-3xl flex items-center justify-center">
            <div className="relative bg-card/30 border border-border rounded-xl p-6 w-4/12 ">

                <button
                    onClick={handleCloseModal}
                    className='absolute top-2 right-2 border border-border rounded-full bg-black/20 p-2  active:scale-95 duration-200'
                >
                    <X className='text-white' />
                </button>
                <h2 className="text-2xl font-semibold text-foreground">
                    Before leaving 
                </h2>

                <p className="text-sm text-gray-500 mt-2">
                    Would you like to take a break or logout?
                </p>

                <div className="grid grid-cols-2 gap-2 mt-6">
                    <button
                        onClick={takeBreak}
                        className='flex justify-center items-center gap-2 border border-amber-400 rounded-full bg-linear-to-b from-amber-500 to-amber-600  p-2 text-white font-bold active:scale-95 duration-200'>
                        <Coffee />   Take Break & Exit
                    </button>

                    <button
                        onClick={handleLogout}
                        className=' flex justify-center items-center gap-2 border border-red-400 rounded-full bg-linear-to-b from-red-500 to-red-600  p-2 text-white font-bold active:scale-95 duration-200'>
                        <LogOut />   Logout & Exit
                    </button>
                </div>
            </div>
        </div>
    )
}