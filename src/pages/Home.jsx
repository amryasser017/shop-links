import { useState } from 'react'
import SearchBar from '../components/SearchBar'
import CategoryCard from '../components/CategoryCard'
import { useData } from '../lib/DataContext.jsx'

function Home() {
  const { categories } = useData()
  const [searchTerm, setSearchTerm] = useState('')
  const q = searchTerm.trim().toLowerCase()
  const filtered = categories.filter((c) => c.name.toLowerCase().includes(q))
  const total = categories.reduce((n, c) => n + c.stores.length, 0)

  return (
    <>
      <header className="hero">
        <span className="eyebrow">Your shopping shortcuts</span>
        <h1>Shop <span className="grad">Links</span></h1>
        <p>{total} trusted stores across {categories.length} categories, one tap away.</p>
        <SearchBar placeholder="Search categories…" value={searchTerm} onChange={setSearchTerm} />
      </header>
      {filtered.length === 0 ? (
        <p className="empty">No categories match “{searchTerm}”.</p>
      ) : (
        <section className="grid grid-cats" aria-label="Categories">
          {filtered.map((c) => (
            <CategoryCard key={c.slug} name={c.name} icon={c.icon} slug={c.slug} storeCount={c.stores.length} />
          ))}
        </section>
      )}
    </>
  )
}
export default Home
