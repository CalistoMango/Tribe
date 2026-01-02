'use client'

import { useState, useEffect, useCallback } from 'react'

/**
 * Balance data from the API
 */
export interface BalanceData {
  available: number
  reserved: number
  totalDeposited: number
  totalSpent: number
  availableFormatted: string
  reservedFormatted: string
  totalDepositedFormatted: string
  totalSpentFormatted: string
}

/**
 * Transaction entry from the API
 */
export interface TransactionEntry {
  id: string
  type: 'deposit' | 'reserve' | 'spend' | 'release' | 'refund'
  amount: number
  amountFormatted: string
  referenceId: string | null
  description: string | null
  createdAt: string
}

/**
 * Hook return type
 */
export interface UseBalanceReturn {
  balance: BalanceData | null
  transactions: TransactionEntry[]
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Hook to fetch and manage user balance
 * @param fid Farcaster ID of the user
 * @param limit Number of transactions to fetch (default: 20)
 */
export function useBalance(fid: number | null, limit: number = 20): UseBalanceReturn {
  const [balance, setBalance] = useState<BalanceData | null>(null)
  const [transactions, setTransactions] = useState<TransactionEntry[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBalance = useCallback(async () => {
    if (!fid) {
      setBalance(null)
      setTransactions([])
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/balance?fid=${fid}&limit=${limit}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch balance')
      }

      setBalance(data.balance)
      setTransactions(data.recentTransactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setBalance(null)
      setTransactions([])
    } finally {
      setIsLoading(false)
    }
  }, [fid, limit])

  useEffect(() => {
    fetchBalance()
  }, [fetchBalance])

  return {
    balance,
    transactions,
    isLoading,
    error,
    refetch: fetchBalance,
  }
}

/**
 * Hook return type for reserve operation
 */
export interface UseReserveFundsReturn {
  reserve: (amount: number, bountyId: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

/**
 * Hook to reserve funds for a bounty
 * @param fid Farcaster ID of the user
 * @param onSuccess Callback when reserve succeeds
 */
export function useReserveFunds(
  fid: number | null,
  onSuccess?: () => void
): UseReserveFundsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reserve = useCallback(
    async (amount: number, bountyId: string): Promise<boolean> => {
      if (!fid) {
        setError('Not authenticated')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/balance/reserve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fid, amount, bountyId }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to reserve funds')
        }

        onSuccess?.()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [fid, onSuccess]
  )

  return { reserve, isLoading, error }
}

/**
 * Hook return type for release operation
 */
export interface UseReleaseFundsReturn {
  release: (amount: number, bountyId: string) => Promise<boolean>
  isLoading: boolean
  error: string | null
}

/**
 * Hook to release reserved funds
 * @param fid Farcaster ID of the user
 * @param onSuccess Callback when release succeeds
 */
export function useReleaseFunds(
  fid: number | null,
  onSuccess?: () => void
): UseReleaseFundsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const release = useCallback(
    async (amount: number, bountyId: string): Promise<boolean> => {
      if (!fid) {
        setError('Not authenticated')
        return false
      }

      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/balance/release', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fid, amount, bountyId }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to release funds')
        }

        onSuccess?.()
        return true
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        return false
      } finally {
        setIsLoading(false)
      }
    },
    [fid, onSuccess]
  )

  return { release, isLoading, error }
}
