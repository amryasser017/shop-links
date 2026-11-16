import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import StoreCard from '../components/StoreCard'
import SearchBar from '../components/SearchBar'
import { fetchCategoryStores } from '../lib/api.js'

// CHANGED: this page used to find its stores inside the shared category list.
// Now it asks the API for them: GET /api/categories/<slug>/stores
function CategoryView({ slug }) {
  const [state, setState] = useState({ status: 'loading', category: null, stores: [] })
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let alive = true
    fetchCategoryStores(slug)
      .then((d) => alive && setState({ status: 'ok', category: d.category, stores: d.stores }))
      .catch((e) => alive && setState({ status: e.message === 'not_found' ? 'missing' : 'error', category: null, stores: [] }))
    return () => { alive = false }
  }, [slug])

  const { status, category, stores } = state

  if (status !== 'ok') {
    return (
      <div className="empty">
        <h1>{status === 'loading' ? 'Loading…' : status === 'missing' ? 'Category not found' : 'Could not load this category'}</h1>
        <Link to="/" className="btn btn-ghost">← Back to home</Link>
      </div>
    )
  }
  const q = searchTerm.trim().toLowerCase()
  const shown = stores.filter((s) => s.name.toLowerCase().includes(q))

  return (
    <>
      <Link to="/" className="back">← All categories</Link>
      <header className="hero hero-sm">
        <span className="category-icon big" aria-hidden="true">{category.icon}</span>
        <h1>{category.name}</h1>
        <p>{stores.length} {stores.length === 1 ? 'store' : 'stores'}</p>
        <SearchBar placeholder="Search stores…" value={searchTerm} onChange={setSearchTerm} />
      </header>
      {shown.length === 0 ? (
        <p className="empty">{stores.length ? 'No stores match.' : 'No stores here yet.'}</p>
      ) : (
        <section className="grid grid-stores">
          {shown.map((s) => <StoreCard key={s.id} {...s} />)}
        </section>
      )}
    </>
  )
}

function CategoryPage() {
  const { slug } = useParams()
  // CHANGED: key={slug} makes React start fresh (loading state) when you open another category
  return <CategoryView key={slug} slug={slug} />
}

export default CategoryPage
