import { useState, useEffect, useCallback } from 'react'

export interface DiscoverUser {
  fid: number
  username: string | null
  display_name: string | null
  pfp_url: string | null
  bio: string | null
  categories: string[] | null
  score: number | null
}

interface DiscoverData {
  users: DiscoverUser[]
  total: number
}

export function useDiscoverUsers(category: string | null, search: string) {
  const [data, setData] = useState<DiscoverData>({ users: [], total: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (search) params.set('search', search)

      const url = `/api/users/discover?${params.toString()}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const result = await response.json()
      setData({
        users: result.users || [],
        total: result.total || 0,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [category, search])

  useEffect(() => {
    // Debounce search
    const timeoutId = setTimeout(fetchUsers, search ? 300 : 0)
    return () => clearTimeout(timeoutId)
  }, [fetchUsers, search])

  return {
    users: data.users,
    total: data.total,
    isLoading,
    error,
    refetch: fetchUsers,
  }
}

export function useCategoryCounts(categoryIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (categoryIds.length === 0) {
      setIsLoading(false)
      return
    }

    const fetchCounts = async () => {
      try {
        const response = await fetch('/api/users/discover', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ categories: categoryIds }),
        })

        if (response.ok) {
          const result = await response.json()
          setCounts(result.counts || {})
        }
      } catch (err) {
        console.error('Failed to fetch category counts:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCounts()
  }, [categoryIds])

  return { counts, isLoading }
}
