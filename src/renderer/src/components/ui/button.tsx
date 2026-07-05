import { cn } from '@/lib/utils'
import React from 'react'

function Button({
    children, onClick,
    disabled,
    className,
    title
}: {
    children: React.ReactNode,
    onClick?: () => void,
    disabled?: boolean,
    className?: string
    title?: string
}) {
    return (
        <button className={cn('bg-linear-to-b from-white/20 to-card rounded-full px-4 py-2 border-t border-t-white/30 border-b border-b-border text-sm cursor-default active:scale-95 duration-300',
            onClick && 'cursor-pointer', disabled && 'opacity-50 cursor-not-allowed', className)}
            onClick={onClick}
            title={title}
            disabled={disabled}>
            {children}
        </button>
    )
}

export default Button