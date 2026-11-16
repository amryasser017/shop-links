import { useState } from 'react'
import SearchBar from '../components/SearchBar'
import CategoryCard from '../components/CategoryCard'
import { useData } from '../lib/DataContext.jsx'

function Home() {
  const { categories, loading, error } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const q = searchTerm.trim().toLowerCase()
  const filtered = categories.filter((c) => c.name.toLowerCase().includes(q))
  // CHANGED: the API sends `store_count` for each category (there is no stores list here anymore)
  const total = categories.reduce((n, c) => n + c.store_count, 0)

  return (
    <>
      <header className="hero">
        <span className="eyebrow">Your shopping shortcuts</span>
        <h1>Shop <span className="grad">Links</span></h1>
        <p>{total} trusted stores across {categories.length} categories, one tap away.</p>
        <SearchBar placeholder="Search categories…" value={searchTerm} onChange={setSearchTerm} />
      </header>
      {/* CHANGED: loading and error states, because data now comes from a server */}
      {loading ? (
        <p className="empty">Loading…</p>
      ) : error ? (
        <p className="empty">Could not load categories. Please try again later.</p>
      ) : filtered.length === 0 ? (
        <p className="empty">{categories.length ? `No categories match “${searchTerm}”.` : 'No categories yet.'}</p>
      ) : (
        <section className="grid grid-cats" aria-label="Categories">
          {filtered.map((c) => (
            // CHANGED: storeCount comes from c.store_count
            <CategoryCard key={c.slug} name={c.name} icon={c.icon} slug={c.slug} storeCount={c.store_count} />
          ))}
        </section>
      )}
    </>
  )
}
export default Home
