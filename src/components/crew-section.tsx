import { getImageUrl } from "@/services/tmdb"
import type { CrewMember } from "@/services/tmdb"
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card"

interface CrewCardProps {
  member: CrewMember
}

export function CrewCard({ member }: CrewCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 group pt-0">
      <div className="overflow-hidden">
        <img
          src={getImageUrl(member.profile_path, "w500")}
          alt={member.name}
          className="w-full h-[250px] object-cover transition-transform duration-300 group-hover:scale-110"
        />
      </div>
      <CardContent className="p-3">
        <CardTitle className="text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {member.name}
        </CardTitle>
        <CardDescription className="text-xs line-clamp-1">
          {member.job}
        </CardDescription>
      </CardContent>
    </Card>
  )
}

interface CrewSectionProps {
  crew: CrewMember[]
  className?: string
}

export function CrewSection({ crew, className }: CrewSectionProps) {
  // Filtra diretor, roteirista e outros cargos importantes
  const director = crew.find((c) => c.job === "Director")
  const writer = crew.find((c) => c.job === "Screenplay" || c.job === "Writer")
  const producer = crew.find((c) => c.job === "Producer")

  const importantCrew = [director, writer, producer].filter(
    Boolean,
  ) as CrewMember[]

  if (importantCrew.length === 0) return null

  return (
    <div className={className}>
      <h3 className="text-2xl font-bold mb-4">Equipe Principal</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {importantCrew.map((member) => (
          <CrewCard key={member.id} member={member} />
        ))}
      </div>
    </div>
  )
}
