import { Link } from 'react-router-dom'

function CategoryCard({ name, icon, slug, storeCount }) {
  return (
    <Link to={`/category/${slug}`} className="category-card">
      <span className="category-icon" aria-hidden="true">{icon}</span>
      <span className="category-info">
        <span className="category-name">{name}</span>
        <span className="category-count">{storeCount} {storeCount === 1 ? 'store' : 'stores'}</span>
      </span>
      <span className="chevron" aria-hidden="true">→</span>
    </Link>
  )
}
export default CategoryCard
