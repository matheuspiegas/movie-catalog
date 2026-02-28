import type { HTMLAttributes } from "react"
import { cn } from "@/lib/utils"

type MediaGridProps = HTMLAttributes<HTMLDivElement>

export function MediaGrid({ className, ...props }: MediaGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-8 md:[grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]",
        className,
      )}
      {...props}
    />
  )
}
