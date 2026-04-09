"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { NuqsAdapter } from "nuqs/adapters/next"
import { useState } from "react"
import { Toaster } from "sonner"
import { LayoutContainer } from "@/components/layout-container"
import { Navbar } from "@/components/navbar"
import { ScrollToTop } from "@/components/scroll-to-top"
import { AddToListProvider } from "@/contexts/add-to-list-context"

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={queryClient}>
      <NuqsAdapter>
        <AddToListProvider>
          <ScrollToTop />
          <Toaster position="top-center" />
          <Navbar />
          <main className="pb-8 pt-16">
            <LayoutContainer>{children}</LayoutContainer>
          </main>
        </AddToListProvider>
      </NuqsAdapter>
    </QueryClientProvider>
  )
}
