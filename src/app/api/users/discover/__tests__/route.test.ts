import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'

// Create chainable mock
const createChainMock = (finalData: unknown) => {
  const chainable: Record<string, unknown> = {}
  const methods = ['select', 'eq', 'not', 'order', 'range', 'contains']

  methods.forEach(method => {
    chainable[method] = vi.fn(() => ({
      ...chainable,
      then: (resolve: (value: unknown) => void) => resolve(finalData),
    }))
  })

  return chainable
}

// Mock Supabase
vi.mock('~/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => createChainMock({
      data: [
        {
          fid: 1,
          username: 'testuser',
          display_name: 'Test User',
          pfp_url: 'https://example.com/pfp.jpg',
          bio: 'Test bio',
          categories: ['builder', 'dev'],
          score: 0.85,
        },
      ],
      error: null,
      count: 1,
    })),
  },
}))

describe('GET /api/users/discover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns discoverable users', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/discover')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('users')
    expect(data).toHaveProperty('total')
    expect(data).toHaveProperty('limit')
    expect(data).toHaveProperty('offset')
  })

  it('applies search filter', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/discover?search=test')
    const response = await GET(request)

    expect(response.status).toBe(200)
  })

  it('applies category filter', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/discover?category=builder')
    const response = await GET(request)

    expect(response.status).toBe(200)
  })
})

describe('POST /api/users/discover', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns category counts', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/discover', {
      method: 'POST',
      body: JSON.stringify({ categories: ['builder', 'dev'] }),
    })
    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('counts')
  })

  it('returns error when categories not provided', async () => {
    const request = new NextRequest('http://localhost:3000/api/users/discover', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })
})
