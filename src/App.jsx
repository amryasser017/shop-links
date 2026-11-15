import './App.css'
import {BrowserRouter} from "react-router-dom"
import {Routes} from "react-router-dom"
import {Route} from "react-router-dom"
import Home from "./pages/Home"
import CategoryPage from "./pages/CategoryPage"
function App() {
  return(
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/category/:slug" element={<CategoryPage />} />
        <Route path="*" element={<p>Page not found.</p>} />
      </Routes>
    </BrowserRouter>
  )
  
}

export default App
