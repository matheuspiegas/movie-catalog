interface VideoEmbedProps {
  videoKey: string
  title?: string
  className?: string
}

export function VideoEmbed({ videoKey, title = "Video", className }: VideoEmbedProps) {
  return (
    <div className={className}>
      <div className="relative w-full pb-[56.25%] rounded-xl overflow-hidden shadow-2xl ring-1 ring-border/50">
        <iframe
          className="absolute top-0 left-0 w-full h-full"
          src={`https://www.youtube.com/embed/${videoKey}`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    </div>
  )
}
