import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock balance utilities
vi.mock('~/lib/balance', () => ({
  reserveFunds: vi.fn(),
  getBalance: vi.fn(),
}))

import { reserveFunds, getBalance } from '~/lib/balance'

describe('POST /api/balance/reserve', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when fid is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/balance/reserve', {
      method: 'POST',
      body: JSON.stringify({ amount: 1000000, bountyId: 'bounty-123' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid fid')
  })

  it('returns 400 when amount is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/balance/reserve', {
      method: 'POST',
      body: JSON.stringify({ fid: 123, bountyId: 'bounty-123' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid amount')
  })

  it('returns 400 when bountyId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/balance/reserve', {
      method: 'POST',
      body: JSON.stringify({ fid: 123, amount: 1000000 }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid bountyId')
  })

  it('returns 400 when insufficient funds', async () => {
    vi.mocked(getBalance).mockResolvedValueOnce({
      fid: 123,
      available: 500000, // 0.5 USDC
      reserved: 0,
      totalDeposited: 500000,
      totalSpent: 0,
      updatedAt: '2024-01-01T00:00:00Z',
    })

    const request = new NextRequest('http://localhost:3000/api/balance/reserve', {
      method: 'POST',
      body: JSON.stringify({ fid: 123, amount: 1000000, bountyId: 'bounty-123' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Insufficient funds')
    expect(data.available).toBe(500000)
    expect(data.required).toBe(1000000)
  })

  it('reserves funds successfully', async () => {
    vi.mocked(getBalance).mockResolvedValueOnce({
      fid: 123,
      available: 5000000,
      reserved: 0,
      totalDeposited: 5000000,
      totalSpent: 0,
      updatedAt: '2024-01-01T00:00:00Z',
    })

    vi.mocked(reserveFunds).mockResolvedValueOnce({
      fid: 123,
      available: 4000000,
      reserved: 1000000,
      totalDeposited: 5000000,
      totalSpent: 0,
      updatedAt: '2024-01-01T00:00:00Z',
    })

    const request = new NextRequest('http://localhost:3000/api/balance/reserve', {
      method: 'POST',
      body: JSON.stringify({ fid: 123, amount: 1000000, bountyId: 'bounty-123' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.newAvailable).toBe(4000000)
    expect(data.newReserved).toBe(1000000)
  })

  it('returns 500 on error', async () => {
    vi.mocked(getBalance).mockResolvedValueOnce({
      fid: 123,
      available: 5000000,
      reserved: 0,
      totalDeposited: 5000000,
      totalSpent: 0,
      updatedAt: '2024-01-01T00:00:00Z',
    })
    vi.mocked(reserveFunds).mockRejectedValueOnce(new Error('Database error'))

    const request = new NextRequest('http://localhost:3000/api/balance/reserve', {
      method: 'POST',
      body: JSON.stringify({ fid: 123, amount: 1000000, bountyId: 'bounty-123' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Database error')
  })
})
