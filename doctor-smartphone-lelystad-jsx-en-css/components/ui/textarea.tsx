import * as React from 'react'

import { cn } from '@/lib/utils'

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'min-h-16 w-full rounded-xl ring-1 ring-gray-200 bg-white px-3 py-2 text-sm shadow-sm hover:shadow-md transition-shadow outline-none',
        'placeholder:text-gray-400',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus:ring-2 focus:ring-[#3ca0de] focus:border-[#3ca0de]',
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        className,
      )}
      {...props}
    />
  )
}

export { Textarea }
