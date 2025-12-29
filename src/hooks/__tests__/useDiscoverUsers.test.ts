import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useDiscoverUsers, useCategoryCounts } from '../useDiscoverUsers'

describe('useDiscoverUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches users on mount', async () => {
    const mockUsers = [
      { fid: 1, username: 'user1', display_name: 'User 1', pfp_url: null, bio: 'Bio 1', categories: ['builder'], score: 0.9 },
    ]

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users: mockUsers, total: 1 }),
    })

    const { result } = renderHook(() => useDiscoverUsers(null, ''))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    }, { timeout: 1000 })

    expect(result.current.users).toEqual(mockUsers)
    expect(result.current.total).toBe(1)
  })

  it('applies category filter', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users: [], total: 0 }),
    })

    const { result } = renderHook(() => useDiscoverUsers('builder', ''))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    }, { timeout: 1000 })

    expect(global.fetch).toHaveBeenCalledWith('/api/users/discover?category=builder')
  })

  it('applies search filter', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ users: [], total: 0 }),
    })

    const { result } = renderHook(() => useDiscoverUsers(null, 'test'))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    }, { timeout: 1000 })

    expect(global.fetch).toHaveBeenCalledWith('/api/users/discover?search=test')
  })

  it('handles fetch error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useDiscoverUsers(null, ''))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    }, { timeout: 1000 })

    expect(result.current.error).toBe('Failed to fetch users')
    expect(result.current.users).toEqual([])
  })
})

describe('useCategoryCounts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches counts for categories', async () => {
    const mockCounts = { builder: 10, artist: 5 }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ counts: mockCounts }),
    })

    const { result } = renderHook(() => useCategoryCounts(['builder', 'artist']))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.counts).toEqual(mockCounts)
    expect(global.fetch).toHaveBeenCalledWith('/api/users/discover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categories: ['builder', 'artist'] }),
    })
  })

  it('skips fetch for empty categories', async () => {
    global.fetch = vi.fn()

    const { result } = renderHook(() => useCategoryCounts([]))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(global.fetch).not.toHaveBeenCalled()
    expect(result.current.counts).toEqual({})
  })

  it('handles fetch error gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useCategoryCounts(['builder']))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.counts).toEqual({})
  })
})
