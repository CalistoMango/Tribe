import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

// Mock Supabase
vi.mock('~/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        not: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              { fid: 1, username: 'user1', display_name: 'User 1', pfp_url: 'https://example.com/1.jpg' },
              { fid: 2, username: 'user2', display_name: 'User 2', pfp_url: 'https://example.com/2.jpg' },
            ],
            error: null,
          })),
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { referral_code: 'abc123' },
            error: null,
          })),
        })),
      })),
    })),
  },
}))

describe('GET /api/referrals', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns leaderboard without user stats when no fid provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/referrals')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('leaderboard')
    expect(data.userStats).toBeNull()
  })

  it('returns user stats when fid is provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/referrals?fid=123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('leaderboard')
    expect(data).toHaveProperty('userStats')
  })
})
