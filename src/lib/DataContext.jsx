import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { fetchCategories } from './api.js'

const DataContext = createContext(null)
// eslint-disable-next-line react/only-export-components
export const useData = () => useContext(DataContext)

// CHANGED: this now holds ONLY the category list (with store_count).
// - removed the bundled default data (src/data/categories.js): data comes from MySQL only
// - stores are no longer in here; each category page loads its own stores
// - added `reload` so the admin can refresh the list after add / edit / delete
// - added `error` so pages can show "could not load" when your API is down
export function DataProvider({ children }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const reload = useCallback(async () => {
    try {
      setCategories(await fetchCategories())
      setError(false)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react/set-state-in-effect
  useEffect(() => { reload() }, [reload])

  return (
    <DataContext.Provider value={{ categories, loading, error, reload }}>{children}</DataContext.Provider>
  )
}
