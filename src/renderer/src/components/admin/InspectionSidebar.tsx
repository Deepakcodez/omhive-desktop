import React, { useState, useEffect } from 'react'
import { User, UserSelector } from './UserSelector'
import { DatePicker } from './DatePicker'

interface InspectionSidebarProps {
  isOpen: boolean
  onClose: () => void
  onApply: (userId: string, date: string) => void
  users: User[]
  loadingUsers: boolean
  initialUserId?: string
  initialDate?: string
}

export const InspectionSidebar: React.FC<InspectionSidebarProps> = ({
  isOpen,
  onClose,
  onApply,
  users,
  loadingUsers,
  initialUserId = '',
  initialDate = ''
}) => {
  const [selectedUserId, setSelectedUserId] = useState(initialUserId)
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date().toISOString().split('T')[0])

  // Sync state if initial props change
  useEffect(() => {
    if (initialUserId) {
      setSelectedUserId(initialUserId)
    } else if (users.length > 0 && !selectedUserId) {
      setSelectedUserId(users[0].id)
    }
  }, [initialUserId, users])

  useEffect(() => {
    if (initialDate) {
      setSelectedDate(initialDate)
    }
  }, [initialDate])

  if (!isOpen) return null

  const handleApply = () => {
    if (selectedUserId && selectedDate) {
      onApply(selectedUserId, selectedDate)
    }
  }

  const selectedUser = users.find((u) => u.id === selectedUserId)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Sidebar Panel Drawer */}
      <div className="relative w-full max-w-md h-full bg-slate-950/95 border-l border-slate-900 shadow-2xl flex flex-col z-10 transition-transform duration-300 transform translate-x-0 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-900/80">
          <div className="space-y-0.5">
            <h3 className="text-base font-bold text-slate-100">Configure Inspection</h3>
            <p className="text-slate-500 text-[10px]">Select a user and date range to inspect.</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-900 hover:border-slate-800 rounded-lg transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* User selector section */}
          <div className="space-y-3">
            <UserSelector
              users={users}
              selectedUserId={selectedUserId}
              onSelectUser={setSelectedUserId}
              loading={loadingUsers}
            />

            {selectedUser && (
              <div className="bg-slate-900/50 border border-slate-900/80 p-3.5 rounded-xl space-y-2 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Full Name:</span>
                  <span className="text-slate-200 font-semibold">{selectedUser.fullName || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Username:</span>
                  <span className="text-indigo-400">@{selectedUser.userName}</span>
                </div>
              </div>
            )}
          </div>

          {/* Date Picker section */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
              Select Date
            </label>
            <DatePicker selectedDate={selectedDate} onSelectDate={setSelectedDate} />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-900 bg-slate-950 flex flex-col space-y-2">
          <button
            onClick={handleApply}
            disabled={!selectedUserId || !selectedDate}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-semibold text-xs cursor-pointer shadow-lg hover:shadow-indigo-500/10 active:scale-[0.98] transition-all duration-150"
          >
            Apply & View Activities
          </button>
          <button
            onClick={onClose}
            className="w-full bg-slate-900 hover:bg-slate-900/80 border border-slate-900 hover:border-slate-800 text-slate-300 py-2.5 rounded-xl font-semibold text-xs cursor-pointer active:scale-[0.98] transition-all duration-150"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
