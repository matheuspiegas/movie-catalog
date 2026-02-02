import { getImageUrl } from "@/services/tmdb"
import type { WatchProvider } from "@/services/tmdb"
import { cn } from "@/lib/utils"

interface WatchProvidersProps {
  providers: WatchProvider[]
  type: "flatrate" | "rent" | "buy"
  className?: string
}

const providerTypeLabels = {
  flatrate: "Streaming",
  rent: "Alugar",
  buy: "Comprar",
}

export function WatchProviders({ providers, type, className }: WatchProvidersProps) {
  if (!providers || providers.length === 0) return null

  return (
    <div className={cn("space-y-3", className)}>
      <h4 className="text-sm font-semibold text-muted-foreground">
        {providerTypeLabels[type]}
      </h4>
      <div className="flex flex-wrap gap-3">
        {providers.map((provider, index) => (
          <div
            key={provider.provider_id}
            className="group relative animate-in fade-in-50 zoom-in-95 duration-500"
            style={{ animationDelay: `${index * 50}ms` }}
            title={provider.provider_name}
          >
            <div className="relative h-14 w-14 overflow-hidden rounded-xl shadow-md transition-all hover:shadow-xl hover:scale-110 duration-300">
              <img
                src={getImageUrl(provider.logo_path, "w500")}
                alt={provider.provider_name}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap text-xs bg-black/90 text-white px-3 py-1.5 rounded-md pointer-events-none z-10 shadow-lg">
              {provider.provider_name}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
