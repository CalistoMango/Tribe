import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'

// Mock Supabase
vi.mock('~/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => Promise.resolve({
          data: [
            { id: 'builder', display_name: 'Builder', emoji: '🛠️', sort_order: 1 },
            { id: 'artist', display_name: 'Artist', emoji: '🎨', sort_order: 2 },
            { id: 'degen', display_name: 'Degen', emoji: '🎰', sort_order: 3 },
          ],
          error: null,
        })),
      })),
    })),
  },
}))

describe('GET /api/categories', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns categories sorted by sort_order', async () => {
    const response = await GET()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toHaveProperty('categories')
    expect(data.categories).toHaveLength(3)
    expect(data.categories[0].id).toBe('builder')
    expect(data.categories[1].id).toBe('artist')
  })
})
