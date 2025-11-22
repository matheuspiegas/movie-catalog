import { Outlet } from "react-router-dom"
import { Navbar } from "@/components/navbar"

export function Layout() {
  return (
    <>
      <Navbar />

      <main className="container mx-auto px-4 pb-8 pt-20">
        <Outlet />
      </main>
    </>
  )
}
