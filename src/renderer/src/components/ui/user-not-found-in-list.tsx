
export default function UserNotFoundInList({ search }: { search: boolean }) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-12 text-center border-y rounded-2xl select-none">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <svg
                    className="h-5 w-5 text-gray-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
            </div>

            <p className="text-sm font-medium text-gray-200">
                {search ? "No users found" : "No users yet"}
            </p>

            <p className="mt-1 text-xs text-gray-500">
                {search
                    ? "Try searching with a different name."
                    : "Create a user to see them here."}
            </p>
        </div>
    )
}

