import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  setUsername?: (name: string) => void
  onSelectUser: (userId: string) => void
  loading?: boolean
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  users,
  selectedUserId,
  onSelectUser,
  setUsername,
  loading = false
}) => {
  return (
    <div className="flex flex-col  w-full">

      <div className="relative w-full">
        <Select
          value={selectedUserId}
          onValueChange={(val) => {
            onSelectUser(val)
            if (setUsername) {
              const matched = users.find((u) => u.id === val)
              if (matched) {
                setUsername(matched.userName)
              }
            }
          }}
          disabled={loading}
        >
          <SelectTrigger
            className="w-full bg-card border-y border-y-border text-slate-200 px-4 py-2.5  rounded-full font-medium focus:outline-none text-sm cursor-pointer shadow-lg transition disabled:opacity-50"
          >
            <SelectValue placeholder={loading ? 'Loading users...' : 'Choose a user'} />
          </SelectTrigger>
          <SelectContent className='bg-card/40 backdrop-blur-md border border-border/50'>
            <SelectGroup>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.fullName || user.userName} (@{user.userName})
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

      </div>
    </div>
  )
}
