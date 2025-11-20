import { Route, Routes } from "react-router-dom"
import { HomePage } from "./pages/home"
import { Layout } from "./layouts/layout"
import { MoviePage } from "./pages/movie"
import { SearchMoviePage } from "./pages/search-movie"
import { SearchPersonPage } from "./pages/search-person"
import { PersonPage } from "./pages/person"
import { ListsPage } from "./pages/lists"

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/search/movie" element={<SearchMoviePage />} />
        <Route path="/search/person" element={<SearchPersonPage />} />
        <Route path="/movie/:id" element={<MoviePage />} />
        <Route path="/person/:id" element={<PersonPage />} />
        <Route path="/lists" element={<ListsPage />} />
      </Route>
    </Routes>
  )
}
