import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock balance utilities
vi.mock('~/lib/balance', () => ({
  releaseFunds: vi.fn(),
}))

import { releaseFunds } from '~/lib/balance'

describe('POST /api/balance/release', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when fid is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/balance/release', {
      method: 'POST',
      body: JSON.stringify({ amount: 1000000, bountyId: 'bounty-123' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid fid')
  })

  it('returns 400 when amount is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/balance/release', {
      method: 'POST',
      body: JSON.stringify({ fid: 123, bountyId: 'bounty-123' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid amount')
  })

  it('returns 400 when bountyId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/balance/release', {
      method: 'POST',
      body: JSON.stringify({ fid: 123, amount: 1000000 }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing or invalid bountyId')
  })

  it('releases funds successfully', async () => {
    vi.mocked(releaseFunds).mockResolvedValueOnce({
      fid: 123,
      available: 2000000,
      reserved: 0,
      totalDeposited: 5000000,
      totalSpent: 3000000,
      updatedAt: '2024-01-01T00:00:00Z',
    })

    const request = new NextRequest('http://localhost:3000/api/balance/release', {
      method: 'POST',
      body: JSON.stringify({ fid: 123, amount: 1000000, bountyId: 'bounty-123' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.newAvailable).toBe(2000000)
    expect(data.newReserved).toBe(0)
  })

  it('returns 500 on error', async () => {
    vi.mocked(releaseFunds).mockRejectedValueOnce(
      new Error('Insufficient reserved funds')
    )

    const request = new NextRequest('http://localhost:3000/api/balance/release', {
      method: 'POST',
      body: JSON.stringify({ fid: 123, amount: 1000000, bountyId: 'bounty-123' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(500)
    const data = await response.json()
    expect(data.error).toBe('Insufficient reserved funds')
  })
})
