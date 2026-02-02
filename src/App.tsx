import { Route, Routes } from "react-router-dom"
import { HomePage } from "./pages/home"
import { Layout } from "./layouts/layout"
import { MoviePage } from "./pages/movie"
// import { SearchMoviePage } from "./pages/search-movie"
// import { SearchPersonPage } from "./pages/search-person"
import { PersonPage } from "./pages/person"
import { ListsPage } from "./pages/lists"
import { ListPage } from "./pages/list"
import { TVSeriesPage } from "./pages/tv-series"
import { MoviesPage } from "./pages/movies"
import { TVShowPage } from "./pages/tv-show"
import { AddToListProvider } from "./contexts/add-to-list-context"
import { Toaster } from "sonner"
import { SearchPage } from "./pages/search"
import { ScrollToTop } from "./components/scroll-to-top"

export default function App() {
  return (
    <AddToListProvider>
      <ScrollToTop />
      <Toaster position="top-center" />
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/movies" element={<MoviesPage />} />
          <Route path="/series" element={<TVSeriesPage />} />
          {/* <Route path="/search/movie" element={<SearchMoviePage />} /> */}
          {/* <Route path="/search/person" element={<SearchPersonPage />} /> */}
          <Route path="/search" element={<SearchPage />} />
          <Route path="/movie/:id" element={<MoviePage />} />
          <Route path="/tv/:id" element={<TVShowPage />} />
          <Route path="/person/:id" element={<PersonPage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/list/:id" element={<ListPage />} />
        </Route>
      </Routes>
    </AddToListProvider>
  )
}
