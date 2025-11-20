import { Link, Outlet } from "react-router-dom"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"

export function Layout() {
  return (
    <>
      <nav className="bg-primary text-primary-foreground p-4 shadow-md">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              to="/"
              className="text-xl font-bold hover:opacity-80 transition"
            >
              🎬 Catálogo de Filmes
            </Link>
            <ul className="flex gap-4">
              <li>
                <Link to="/" className="hover:underline">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/search/movie" className="hover:underline">
                  Buscar
                </Link>
              </li>
              <li>
                <Link to="/lists" className="hover:underline">
                  Minhas listas
                </Link>
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <Button variant="secondary">Entrar</Button>
              </SignInButton>
            </SignedOut>
            <SignedIn>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pb-8">
        <Outlet />
      </main>
    </>
  )
}
