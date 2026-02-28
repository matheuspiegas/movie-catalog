import { getImageUrl } from "@/services/tmdb"

interface MediaBackdropProps {
  backdropPath: string | null
  title: string
  tagline?: string | null
}

export function MediaBackdrop({
  backdropPath,
  title,
  tagline,
}: MediaBackdropProps) {
  if (!backdropPath) return null

  return (
    <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 mb-8 h-[300px] sm:h-[400px] lg:h-[500px] overflow-hidden rounded-b-xl shadow-xl">
      <img
        src={getImageUrl(backdropPath, "original")}
        alt={title}
        className="h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2 drop-shadow-2xl animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          {title}
        </h1>
        {tagline && (
          <p className="text-base sm:text-lg lg:text-xl text-white/90 italic drop-shadow-lg animate-in fade-in-50 slide-in-from-bottom-4 duration-700 delay-150">
            "{tagline}"
          </p>
        )}
      </div>
    </div>
  )
}
