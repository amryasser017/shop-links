import { Link } from 'react-router-dom'

function CategoryCard({ name, icon, slug, storeCount }) {   
    return (
        <div className="category-card">
            <h3 className="category-card-title">{icon} {name}</h3>   
            <p className="category-card-description">{storeCount} stores</p>  
            <Link to={`/category/${slug}`} className="category-card-link">   
                See More
            </Link>
        </div>
    )
}

export default CategoryCard