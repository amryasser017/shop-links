function StoreCard({ name, url }) {
    return (
        <div className="store-card">
            <h3 className="store-card-title">{name}</h3>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="store-card-link"
            >
                Visit Store
            </a>
        </div>
    )
}

export default StoreCard