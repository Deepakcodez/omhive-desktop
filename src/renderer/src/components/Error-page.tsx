
type Props = {
    error: Error,
    reset: () => void
}

export default function Errorpage({ error, reset }: Props) {
    console.log(error)
    return (
        <div className='h-screen w-full bg-background flex items-center justify-center flex-col gap-3'>
            <h1>Something Went Wrong Please Try again</h1>
            <button
                onClick={() => reset()}
                className="px-4 py-2 mt-4 bg-primary text-white rounded cursor-pointer transition-colors"
            >
                Refresh
            </button>
        </div>
    )
}