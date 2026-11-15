import { useState } from 'react'
import SearchBar from '../components/SearchBar'
import CategoryCard from '../components/CategoryCard'
import { categories } from '../data/categories.js'
function Home() {
    const [searchTerm, setSearchTerm] = useState('')
    const filteredCategories = categories.filter((category) => 
        category.name.toLowerCase().includes(searchTerm.trim().toLowerCase())
    )
    return (
        <div>
            <h1 className="home-title">Shop Links</h1>
            <SearchBar
                placeholder="Search Categories..."
                onChange={setSearchTerm}
                value={searchTerm}
            />
            {
                filteredCategories.length === 0 ? (
                    <p>No categories match</p>
                ):(
                <>
                    {filteredCategories.map((category) => (
                    <CategoryCard
                        key={category.slug}
                        name={category.name}
                        icon={category.icon}
                        slug={category.slug}
                        storeCount={category.stores.length}
                        
                    />
                    ))}
                </>
            )}
            
            
        </div>
    )
}
export default Home