'use client'
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { LayoutContainer } from "@/components/layout-container"
import { ArrowLeft, Menu, X } from "lucide-react"
import { useState } from "react"

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Verifica se pode voltar (não está na home e tem histórico)
  const canGoBack = pathname !== "/" && window.history.length > 1

  const handleGoBack = () => {
    router.back()
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
  }

  const mobileMenuClassName = `md:hidden absolute left-0 right-0 top-full bg-primary border-t border-primary-foreground/20 shadow-lg transition-[opacity,transform,max-height] duration-200 ease-in-out overflow-hidden ${
    isMenuOpen
      ? "opacity-100 translate-y-0 max-h-[calc(100vh-4rem)]"
      : "opacity-0 -translate-y-2 max-h-0 pointer-events-none"
  }`

  return (
    <nav className="bg-primary text-primary-foreground shadow-md fixed top-0 left-0 right-0 z-50">
      <LayoutContainer>
        <div className="flex items-center justify-between h-16">
          {/* Logo e Back Button */}
          <div className="flex items-center gap-2">
            {canGoBack && (
              <ArrowLeft
                className="h-5 w-5 cursor-pointer hover:opacity-80"
                onClick={handleGoBack}
              />
            )}
            <Link
              href="/"
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
                <Link href="/" className="hover:underline">
                  Início
                </Link>
              </li>
              <li>
                <Link href="/movies" className="hover:underline">
                  Filmes
                </Link>
              </li>
              <li>
                <Link href="/series" className="hover:underline">
                  Séries
                </Link>
              </li>
            {/* <li>
              <Link to="/search/movie" className="hover:underline">
                Buscar
              </Link>
            </li> */}
              <li>
                <Link href="/lists" className="hover:underline">
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
      </LayoutContainer>

      {/* Mobile Menu */}
      <div className={mobileMenuClassName}>
        <LayoutContainer className="py-4">
          <ul className="flex flex-col gap-4">
              <li>
                <Link
                  href="/"
                  className="block hover:underline"
                  onClick={closeMenu}
                >
                  Início
                </Link>
              </li>
              <li>
                <Link
                  href="/movies"
                  className="block hover:underline"
                  onClick={closeMenu}
                >
                  Filmes
                </Link>
              </li>
              <li>
                <Link
                  href="/series"
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
                  href="/lists"
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
        </LayoutContainer>
      </div>
    </nav>
  )
}
