function SearchBar({ value, onChange, placeholder }) {
    return (
        <input
            type="text"
            className="search-bar"
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
        />
    )
}

export default SearchBar