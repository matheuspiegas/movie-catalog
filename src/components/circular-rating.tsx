import { cn } from "@/lib/utils"

interface CircularRatingProps {
  rating: number
  size?: "sm" | "md" | "lg"
  className?: string
}

export function CircularRating({ rating, size = "md", className }: CircularRatingProps) {
  const percentage = (rating / 10) * 100
  const circumference = 2 * Math.PI * 40
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const sizes = {
    sm: "h-12 w-12",
    md: "h-16 w-16",
    lg: "h-20 w-20",
  }

  const textSizes = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 7) return "stroke-green-500"
    if (rating >= 5) return "stroke-yellow-500"
    return "stroke-red-500"
  }

  return (
    <div className={cn("relative", sizes[size], className)}>
      <svg className="transform -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="40"
          className="fill-none stroke-muted"
          strokeWidth="8"
        />
        <circle
          cx="50"
          cy="50"
          r="40"
          className={cn("fill-none transition-all duration-500", getRatingColor(rating))}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("font-bold", textSizes[size])}>
          {rating.toFixed(1)}
        </span>
        <span className="text-[8px] text-muted-foreground">/ 10</span>
      </div>
    </div>
  )
}
