import { useParams, Link } from 'react-router-dom'
import { useState } from 'react'
import StoreCard from '../components/StoreCard'
import SearchBar from '../components/SearchBar'
import { useData } from '../lib/DataContext.jsx'

function CategoryPage() {
  const { categories, loading } = useData()
  const { slug } = useParams()
  const [searchTerm, setSearchTerm] = useState('')
  const category = categories.find((c) => c.slug === slug)

  if (!category) {
    return (
      <div className="empty">
        <h1>{loading ? 'Loading…' : 'Category not found'}</h1>
        <Link to="/" className="btn btn-ghost">← Back to home</Link>
      </div>
    )
  }
  const q = searchTerm.trim().toLowerCase()
  const stores = category.stores.filter((s) => s.name.toLowerCase().includes(q))

  return (
    <>
      <Link to="/" className="back">← All categories</Link>
      <header className="hero hero-sm">
        <span className="category-icon big" aria-hidden="true">{category.icon}</span>
        <h1>{category.name}</h1>
        <p>{category.stores.length} {category.stores.length === 1 ? 'store' : 'stores'}</p>
        <SearchBar placeholder="Search stores…" value={searchTerm} onChange={setSearchTerm} />
      </header>
      {stores.length === 0 ? (
        <p className="empty">{category.stores.length ? 'No stores match.' : 'No stores here yet.'}</p>
      ) : (
        <section className="grid grid-stores">
          {stores.map((s) => <StoreCard key={s.id || s.name} {...s} />)}
        </section>
      )}
    </>
  )
}
export default CategoryPage
