import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type LayoutContainerProps = HTMLAttributes<HTMLDivElement>

export function LayoutContainer({ className, ...props }: LayoutContainerProps) {
  return (
    <div
      className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}
      {...props}
    />
  )
}
