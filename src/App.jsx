import './App.css'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { DataProvider } from './lib/DataContext.jsx'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import AdminPage from './admin/AdminPage'

function Layout({ children }) {
  return (
    <div className="shell">
      <nav className="topbar"><Link to="/" className="brand">🛍️ <b>Shop</b>Links</Link></nav>
      <main className="container">{children}</main>
      <footer className="footer">© Shop Links</footer>
    </div>
  )
}

function NotFound() {
  return (
    <div className="empty">
      <h1>Page not found</h1>
      <Link to="/" className="btn btn-ghost">← Back to home</Link>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path="/admin/*" element={<AdminPage />} />
          <Route path="/" element={<Layout><Home /></Layout>} />
          <Route path="/category/:slug" element={<Layout><CategoryPage /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </DataProvider>
    </BrowserRouter>
  )
}
export default App
