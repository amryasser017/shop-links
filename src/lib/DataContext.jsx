import { createContext, useContext, useEffect, useState } from 'react'
import { categories as seed } from '../data/categories.js'
import { fetchCategories } from './api.js'

const DataContext = createContext(null)
// eslint-disable-next-line react/only-export-components
export const useData = () => useContext(DataContext)

export function DataProvider({ children }) {
  const [categories, setCategories] = useState(seed)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    fetchCategories()
      .then((c) => { if (alive && Array.isArray(c)) setCategories(c) })
      .catch(() => {}) // keep the bundled seed data
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [])

  return <DataContext.Provider value={{ categories, setCategories, loading }}>{children}</DataContext.Provider>
}
