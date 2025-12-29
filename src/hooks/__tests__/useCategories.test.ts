import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCategories } from '../useCategories'

describe('useCategories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches categories on mount', async () => {
    const mockCategories = [
      { id: 'builder', display_name: 'Builder', emoji: '🛠️', sort_order: 1 },
      { id: 'artist', display_name: 'Artist', emoji: '🎨', sort_order: 2 },
    ]

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ categories: mockCategories }),
    })

    const { result } = renderHook(() => useCategories())

    // Initially loading
    expect(result.current.isLoading).toBe(true)
    expect(result.current.categories).toEqual([])

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.categories).toEqual(mockCategories)
    expect(result.current.error).toBeNull()
    expect(global.fetch).toHaveBeenCalledWith('/api/categories')
  })

  it('handles fetch error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useCategories())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch categories')
    expect(result.current.categories).toEqual([])
  })

  it('handles network error', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

    const { result } = renderHook(() => useCategories())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
  })
})
