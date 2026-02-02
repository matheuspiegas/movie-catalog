import { Link, useNavigate, useLocation } from "react-router-dom"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Menu, X } from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Verifica se pode voltar (não está na home e tem histórico)
  const canGoBack = location.pathname !== "/" && window.history.length > 1

  const handleGoBack = () => {
    navigate(-1)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  return (
    <nav className="bg-primary text-primary-foreground shadow-md fixed top-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo e Back Button */}
          <div className="flex items-center gap-2">
            {canGoBack && (
              <ArrowLeft
                className="h-5 w-5 cursor-pointer hover:opacity-80"
                onClick={handleGoBack}
              />
            )}
            <Link
              to="/"
              className="text-xl font-bold hover:opacity-80 transition whitespace-nowrap flex items-center justify-center"
              onClick={closeMenu}
            >
              <img src="/movie3.svg" alt="Logo" className="h-6 w-6 mr-2" />
              Movie catalog
            </Link>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden md:flex gap-6 items-center">
            <li>
              <Link to="/" className="hover:underline">
                Início
              </Link>
            </li>
            <li>
              <Link to="/movies" className="hover:underline">
                Filmes
              </Link>
            </li>
            <li>
              <Link to="/series" className="hover:underline">
                Séries
              </Link>
            </li>
            {/* <li>
              <Link to="/search/movie" className="hover:underline">
                Buscar
              </Link>
            </li> */}
            <li>
              <Link to="/lists" className="hover:underline">
                Minhas listas
              </Link>
            </li>
          </ul>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
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

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 hover:bg-primary-foreground/10 rounded"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-primary-foreground/20 pt-4">
            <ul className="flex flex-col gap-4">
              <li>
                <Link
                  to="/"
                  className="block hover:underline"
                  onClick={closeMenu}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  to="/movies"
                  className="block hover:underline"
                  onClick={closeMenu}
                >
                  Filmes
                </Link>
              </li>
              <li>
                <Link
                  to="/series"
                  className="block hover:underline"
                  onClick={closeMenu}
                >
                  Séries
                </Link>
              </li>
              {/* <li>
                <Link
                  to="/search/movie"
                  className="block hover:underline"
                  onClick={closeMenu}
                >
                  Buscar
                </Link>
              </li> */}
              <li>
                <Link
                  to="/lists"
                  className="block hover:underline"
                  onClick={closeMenu}
                >
                  Minhas listas
                </Link>
              </li>
            </ul>

            {/* Mobile Auth */}
            <div className="mt-4 pt-4 border-t border-primary-foreground/20">
              <SignedOut>
                <SignInButton mode="modal">
                  <Button variant="secondary" className="w-full">
                    Entrar
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <div className="flex items-center gap-3">
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-10 h-10",
                      },
                    }}
                  />
                  <span className="text-sm">Minha conta</span>
                </div>
              </SignedIn>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
