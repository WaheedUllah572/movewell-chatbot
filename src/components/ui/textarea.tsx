import * as React from "react"

import { cn } from "cn"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-white px-2.5 py-2 text-base text-gray-900 ...",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }