import { cn } from "@/lib/utils"

interface MediaInfoCardProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function MediaInfoCard({ title, children, className }: MediaInfoCardProps) {
  return (
    <div
      className={cn(
        "backdrop-blur-md bg-card/30 border border-border/50 rounded-lg p-6 shadow-lg",
        className
      )}
    >
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
      {children}
    </div>
  )
}
