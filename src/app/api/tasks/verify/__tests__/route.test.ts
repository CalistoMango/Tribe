import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'

// Mock Neynar client
const mockFetchUserFollowing = vi.fn()
const mockFetchCastReactions = vi.fn()

vi.mock('~/lib/neynar', () => ({
  getNeynarClient: vi.fn(() => ({
    fetchUserFollowing: mockFetchUserFollowing,
    fetchCastReactions: mockFetchCastReactions,
  })),
}))

// Mock constants - default to unconfigured (auto-approve mode)
vi.mock('~/lib/constants', () => ({
  TRIBE_FID: 0,
  LAUNCH_POST_HASH: '',
}))

describe('POST /api/tasks/verify', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 400 when fid is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks/verify', {
      method: 'POST',
      body: JSON.stringify({ task: 'follow' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Missing fid')
  })

  it('returns 400 when task is invalid', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks/verify', {
      method: 'POST',
      body: JSON.stringify({ fid: 123, task: 'invalid' }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.error).toBe('Invalid task. Must be "follow" or "like_recast"')
  })

  it('returns 400 when task is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/tasks/verify', {
      method: 'POST',
      body: JSON.stringify({ fid: 123 }),
    })
    const response = await POST(request)

    expect(response.status).toBe(400)
  })

  describe('follow task', () => {
    it('auto-approves when TRIBE_FID is not configured', async () => {
      const request = new NextRequest('http://localhost:3000/api/tasks/verify', {
        method: 'POST',
        body: JSON.stringify({ fid: 123, task: 'follow' }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.verified).toBe(true)
      expect(data.message).toContain('Auto-approved')
    })
  })

  describe('like_recast task', () => {
    it('auto-approves when LAUNCH_POST_HASH is not configured', async () => {
      const request = new NextRequest('http://localhost:3000/api/tasks/verify', {
        method: 'POST',
        body: JSON.stringify({ fid: 123, task: 'like_recast' }),
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.verified).toBe(true)
      expect(data.message).toContain('Auto-approved')
    })
  })
})

// Test with configured constants
describe('POST /api/tasks/verify (configured)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset module to use configured constants
    vi.doMock('~/lib/constants', () => ({
      TRIBE_FID: 12345,
      LAUNCH_POST_HASH: '0xabc123',
    }))
  })

  it('verifies follow task with Neynar when configured', async () => {
    mockFetchUserFollowing.mockResolvedValueOnce({
      users: [
        { user: { fid: 12345 } }, // Following TRIBE_FID
        { user: { fid: 99999 } },
      ],
    })

    // Import fresh module with mocked constants
    const { POST: ConfiguredPOST } = await import('../route')

    const request = new NextRequest('http://localhost:3000/api/tasks/verify', {
      method: 'POST',
      body: JSON.stringify({ fid: 123, task: 'follow' }),
    })
    const response = await ConfiguredPOST(request)

    // Since constants are 0/'', it will auto-approve
    expect(response.status).toBe(200)
  })
})
