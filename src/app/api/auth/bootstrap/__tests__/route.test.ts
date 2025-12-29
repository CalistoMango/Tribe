import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock nanoid
vi.mock('nanoid', () => ({
  nanoid: vi.fn(() => 'abc12345'),
}))

// Create chainable mock for Supabase
const mockSupabaseResponse = vi.fn()

vi.mock('~/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSupabaseResponse,
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: mockSupabaseResponse,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: mockSupabaseResponse,
        })),
      })),
    })),
  },
}))

describe('POST /api/auth/bootstrap', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when fid is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/auth/bootstrap', {
      method: 'POST',
      body: JSON.stringify({ username: 'test' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing fid')
  })

  it('updates existing user', async () => {
    const existingUser = {
      fid: 123,
      username: 'olduser',
      display_name: 'Old User',
      pfp_url: 'https://example.com/old.jpg',
    }

    mockSupabaseResponse
      .mockResolvedValueOnce({ data: existingUser, error: null }) // select existing
      .mockResolvedValueOnce({ data: { ...existingUser, username: 'newuser' }, error: null }) // update

    const request = new NextRequest('http://localhost:3000/api/auth/bootstrap', {
      method: 'POST',
      body: JSON.stringify({
        fid: 123,
        username: 'newuser',
        displayName: 'New User',
        pfpUrl: 'https://example.com/new.jpg',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isNew).toBe(false)
    expect(data.user).toBeDefined()
  })

  it('creates new user without referral', async () => {
    const newUser = {
      fid: 456,
      username: 'newuser',
      display_name: 'New User',
      pfp_url: 'https://example.com/new.jpg',
      referral_code: 'abc12345',
      referred_by_fid: null,
    }

    mockSupabaseResponse
      .mockResolvedValueOnce({ data: null, error: null }) // no existing user
      .mockResolvedValueOnce({ data: newUser, error: null }) // insert

    const request = new NextRequest('http://localhost:3000/api/auth/bootstrap', {
      method: 'POST',
      body: JSON.stringify({
        fid: 456,
        username: 'newuser',
        displayName: 'New User',
        pfpUrl: 'https://example.com/new.jpg',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isNew).toBe(true)
    expect(data.user).toBeDefined()
  })

  it('creates new user with valid referral code', async () => {
    const referrer = { fid: 100 }
    const newUser = {
      fid: 456,
      username: 'newuser',
      referral_code: 'abc12345',
      referred_by_fid: 100,
    }

    mockSupabaseResponse
      .mockResolvedValueOnce({ data: null, error: null }) // no existing user
      .mockResolvedValueOnce({ data: referrer, error: null }) // referrer lookup
      .mockResolvedValueOnce({ data: newUser, error: null }) // insert

    const request = new NextRequest('http://localhost:3000/api/auth/bootstrap', {
      method: 'POST',
      body: JSON.stringify({
        fid: 456,
        username: 'newuser',
        referralCode: 'validcode',
      }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.isNew).toBe(true)
  })
})
