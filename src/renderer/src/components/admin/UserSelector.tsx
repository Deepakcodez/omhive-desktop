import React from 'react'

export interface User {
  id: string
  userName: string
  fullName: string
  phone?: string
  createdAt?: string | Date
}

interface UserSelectorProps {
  users: User[]
  selectedUserId: string
  onSelectUser: (userId: string) => void
  loading?: boolean
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  users,
  selectedUserId,
  onSelectUser,
  loading = false
}) => {
  return (
    <div className="flex flex-col space-y-1.5 w-full">
      <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
        Select User
      </label>
      <div className="relative w-full">
        <select
          value={selectedUserId}
          onChange={(e) => onSelectUser(e.target.value)}
          disabled={loading}
          className="appearance-none w-full bg-slate-900 border border-slate-800 text-slate-200 px-4 py-2.5 pr-10 rounded-xl font-medium focus:outline-none focus:border-indigo-500/50 text-sm cursor-pointer shadow-lg hover:border-slate-700 transition disabled:opacity-50"
        >
          <option value="" disabled>
            {loading ? 'Loading users...' : 'Choose a user'}
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.fullName || user.userName} (@{user.userName})
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400 border-l border-slate-800/80">
          <svg
            className="fill-current h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
          >
            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
          </svg>
        </div>
      </div>
    </div>
  )
}
