import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

// Mock balance utilities
vi.mock('~/lib/balance', () => ({
  getBalance: vi.fn(),
  getLedgerEntries: vi.fn(),
}))

import { getBalance, getLedgerEntries } from '~/lib/balance'

describe('GET /api/balance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when fid is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/balance')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing fid parameter')
  })

  it('returns 400 when fid is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/balance?fid=abc')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid fid parameter')
  })

  it('returns balance and transactions when fid is valid', async () => {
    const mockBalance = {
      fid: 123,
      available: 5000000,
      reserved: 1000000,
      totalDeposited: 10000000,
      totalSpent: 4000000,
      updatedAt: '2024-01-01T00:00:00Z',
    }

    const mockTransactions = [
      {
        id: 'tx-1',
        fid: 123,
        type: 'deposit',
        amount: 5000000,
        referenceId: '0xabc123',
        description: 'USDC deposit',
        createdAt: '2024-01-01T00:00:00Z',
      },
    ]

    vi.mocked(getBalance).mockResolvedValueOnce(mockBalance)
    vi.mocked(getLedgerEntries).mockResolvedValueOnce(mockTransactions)

    const request = new NextRequest('http://localhost:3000/api/balance?fid=123')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()

    expect(data.balance).toBeDefined()
    expect(data.balance.available).toBe(5000000)
    expect(data.balance.availableFormatted).toBe('5.00')
    expect(data.recentTransactions).toHaveLength(1)
    expect(data.recentTransactions[0].type).toBe('deposit')
  })

  it('respects limit parameter', async () => {
    vi.mocked(getBalance).mockResolvedValueOnce({
      fid: 123,
      available: 0,
      reserved: 0,
      totalDeposited: 0,
      totalSpent: 0,
      updatedAt: '2024-01-01T00:00:00Z',
    })
    vi.mocked(getLedgerEntries).mockResolvedValueOnce([])

    const request = new NextRequest('http://localhost:3000/api/balance?fid=123&limit=5')
    await GET(request)

    expect(getLedgerEntries).toHaveBeenCalledWith(123, 5)
  })

  it('returns 500 on error', async () => {
    vi.mocked(getBalance).mockRejectedValueOnce(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/balance?fid=123')
    const response = await GET(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Database error')
  })
})
