import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useReferrals } from '../useReferrals'

describe('useReferrals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches referrals without fid', async () => {
    const mockData = {
      leaderboard: [
        { rank: 1, fid: 100, username: 'top', display_name: 'Top User', pfp_url: null, referral_count: 10 },
      ],
      userStats: null,
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { result } = renderHook(() => useReferrals(null))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.leaderboard).toEqual(mockData.leaderboard)
    expect(result.current.userStats).toBeNull()
    expect(global.fetch).toHaveBeenCalledWith('/api/referrals')
  })

  it('fetches referrals with fid for user stats', async () => {
    const mockData = {
      leaderboard: [],
      userStats: {
        referral_count: 5,
        referral_code: 'abc123',
        rank: 3,
      },
    }

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    const { result } = renderHook(() => useReferrals(123))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.userStats).toEqual(mockData.userStats)
    expect(global.fetch).toHaveBeenCalledWith('/api/referrals?fid=123')
  })

  it('handles fetch error', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    })

    const { result } = renderHook(() => useReferrals(123))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe('Failed to fetch referrals')
    expect(result.current.leaderboard).toEqual([])
  })

  it('refetches when fid changes', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ leaderboard: [], userStats: null }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ leaderboard: [], userStats: { referral_count: 2, referral_code: 'xyz', rank: 5 } }),
      })

    const { result, rerender } = renderHook(
      ({ fid }) => useReferrals(fid),
      { initialProps: { fid: null as number | null } }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    rerender({ fid: 456 })

    await waitFor(() => {
      expect(result.current.userStats?.referral_count).toBe(2)
    })

    expect(global.fetch).toHaveBeenCalledTimes(2)
  })
})
