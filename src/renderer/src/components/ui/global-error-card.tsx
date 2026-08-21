

export default function GlobalErrorCard() {
    return (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-black/80">
            <div className="w-100px rounded-xl bg-card border-y p-6 shadow-xl">
                <h2 className="text-xl ">
                    Something went wrong
                </h2>

                <p className="mt-2 text-neutral-400">
                    OmHive encountered an unexpected
                    error. Please restart the application.
                </p>

                <button
                    className="mt-4 rounded-full bg-black/20 shadow-md px-4 py-2 text-white border-y active:scale-105 duration-300"
                    onClick={() => {
                        window.location.reload();
                    }}
                >
                    Restart
                </button>
            </div>
        </div>
    )
}