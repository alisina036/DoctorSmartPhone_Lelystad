import * as React from 'react'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // Polished style matching dropdowns
        'w-full min-w-0 rounded-xl ring-1 ring-gray-200 bg-white px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow outline-none',
        'placeholder:text-gray-400',
        'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
        // Focus state
        'focus:ring-2 focus:ring-[#3ca0de] focus:border-[#3ca0de]',
        // Error state
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Input }
