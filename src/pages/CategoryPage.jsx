import { useParams, Link } from "react-router-dom"
import { categories } from '../data/categories.js'
import StoreCard from '../components/StoreCard'
import { useState } from 'react'
import SearchBar from '../components/SearchBar'
function CategoryPage() {
    const [searchTerm, setSearchTerm] = useState('')
    const { slug } = useParams()
    const category = categories.find((c) => c.slug === slug)
    if (!category) {
        return (
            <div>
                <h1 className="category-page-title">Category not found</h1>
                <Link to="/">Back to home</Link>
            </div>
        )
    }
    const filteredStores = category.stores.filter((store) => 
            store.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
        )
    return (
        <div>
            <h1 className="category-page-title">{category.icon} {category.name}</h1>
            <SearchBar
                placeholder="Search Stores..."
                onChange={setSearchTerm}
                value={searchTerm}
            />
            { filteredStores.length === 0 ? (
                <p>No stores match</p>
            ):(
                <>
                {filteredStores.map((store) => (
                    <StoreCard
                        key={store.name}
                        name={store.name}
                        url={store.url}
                    />
                ))}
                </>
            )}
            <Link to="/">Back to home</Link>
        </div>
    )
}

export default CategoryPage