import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PUT } from '../route'
import { NextRequest } from 'next/server'

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
    })),
  },
}))

describe('GET /api/users/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when fid is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/me')
    const response = await GET(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing fid parameter')
  })

  it('returns 404 when user not found', async () => {
    mockSupabaseResponse.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST116', message: 'Not found' },
    })

    const request = new NextRequest('http://localhost:3000/api/users/me?fid=999')
    const response = await GET(request)

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBe('User not found')
  })

  it('returns user when found', async () => {
    const user = {
      fid: 123,
      username: 'testuser',
      display_name: 'Test User',
      bio: 'Test bio',
      categories: ['builder'],
    }

    mockSupabaseResponse.mockResolvedValueOnce({ data: user, error: null })

    const request = new NextRequest('http://localhost:3000/api/users/me?fid=123')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user).toEqual(user)
  })
})

describe('PUT /api/users/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when fid is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({ bio: 'New bio' }),
    })
    const response = await PUT(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing fid')
  })

  it('updates user bio', async () => {
    const updatedUser = {
      fid: 123,
      bio: 'Updated bio',
      categories: null,
      profile_setup_complete: false,
    }

    mockSupabaseResponse.mockResolvedValueOnce({ data: updatedUser, error: null })

    const request = new NextRequest('http://localhost:3000/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({ fid: 123, bio: 'Updated bio' }),
    })
    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.bio).toBe('Updated bio')
  })

  it('sets profile_setup_complete when bio and categories provided', async () => {
    const updatedUser = {
      fid: 123,
      bio: 'My bio',
      categories: ['builder', 'dev'],
      profile_setup_complete: true,
    }

    mockSupabaseResponse.mockResolvedValueOnce({ data: updatedUser, error: null })

    const request = new NextRequest('http://localhost:3000/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({
        fid: 123,
        bio: 'My bio',
        categories: ['builder', 'dev'],
      }),
    })
    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.profile_setup_complete).toBe(true)
  })

  it('updates discoverable flag', async () => {
    const updatedUser = {
      fid: 123,
      discoverable: true,
    }

    mockSupabaseResponse.mockResolvedValueOnce({ data: updatedUser, error: null })

    const request = new NextRequest('http://localhost:3000/api/users/me', {
      method: 'PUT',
      body: JSON.stringify({ fid: 123, discoverable: true }),
    })
    const response = await PUT(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.user.discoverable).toBe(true)
  })
})
