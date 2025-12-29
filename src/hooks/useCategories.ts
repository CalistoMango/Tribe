import { useState, useEffect } from 'react'

export interface Category {
  id: string
  display_name: string
  emoji: string | null
  sort_order: number | null
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCategories() {
      try {
        const response = await fetch('/api/categories')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        const data = await response.json()
        setCategories(data.categories)
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [])

  return { categories, isLoading, error }
}
