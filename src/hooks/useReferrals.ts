import { useState, useEffect, useCallback } from 'react'

interface LeaderboardEntry {
  rank: number
  fid: number
  username: string | null
  display_name: string | null
  pfp_url: string | null
  referral_count: number
}

interface UserStats {
  referral_count: number
  referral_code: string | null
  rank: number | null
}

interface ReferralsData {
  leaderboard: LeaderboardEntry[]
  userStats: UserStats | null
}

export function useReferrals(fid: number | null) {
  const [data, setData] = useState<ReferralsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReferrals = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const url = fid
        ? `/api/referrals?fid=${fid}`
        : '/api/referrals'

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error('Failed to fetch referrals')
      }

      const result = await response.json()
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [fid])

  useEffect(() => {
    fetchReferrals()
  }, [fetchReferrals])

  return {
    leaderboard: data?.leaderboard || [],
    userStats: data?.userStats || null,
    isLoading,
    error,
    refetch: fetchReferrals,
  }
}
