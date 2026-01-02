import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'

// Mock constants
vi.mock('~/lib/constants', () => ({
  ALCHEMY_WEBHOOK_SIGNING_KEY: '', // Empty = skip verification in tests
  TRIBE_VAULT_ADDRESS: '0x1234567890123456789012345678901234567890',
  MIN_DEPOSIT_USDC: 1000000, // 1 USDC
}))

// Mock balance utilities
vi.mock('~/lib/balance', () => ({
  creditDeposit: vi.fn(),
}))

// Mock supabase
vi.mock('~/lib/supabase', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        ilike: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({ data: { fid: 123 }, error: null })),
        })),
      })),
    })),
  })),
}))

import { creditDeposit } from '~/lib/balance'

describe('GET /api/webhooks/alchemy', () => {
  it('returns status and config', async () => {
    const request = new NextRequest('http://localhost:3000/api/webhooks/alchemy')
    const response = await GET()

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.status).toBe('ok')
    expect(data.vault).toBeDefined()
    expect(data.minDeposit).toBe(1000000)
  })
})

describe('POST /api/webhooks/alchemy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('handles non-ADDRESS_ACTIVITY events', async () => {
    const event = {
      webhookId: 'wh-1',
      id: 'evt-1',
      createdAt: '2024-01-01T00:00:00Z',
      type: 'MINED_TRANSACTION',
      event: {},
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/alchemy', {
      method: 'POST',
      body: JSON.stringify(event),
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.message).toBe('Event type not handled')
  })

  it('processes deposit to vault', async () => {
    vi.mocked(creditDeposit).mockResolvedValueOnce({
      fid: 123,
      available: 5000000,
      reserved: 0,
      totalDeposited: 5000000,
      totalSpent: 0,
      updatedAt: '2024-01-01T00:00:00Z',
    })

    const event = {
      webhookId: 'wh-1',
      id: 'evt-1',
      createdAt: '2024-01-01T00:00:00Z',
      type: 'ADDRESS_ACTIVITY',
      event: {
        network: 'BASE_MAINNET',
        activity: [
          {
            fromAddress: '0xuser123',
            toAddress: '0x1234567890123456789012345678901234567890',
            blockNum: '0x100',
            hash: '0xtxhash123',
            value: 5,
            asset: 'USDC',
            category: 'token',
            rawContract: {
              rawValue: '0x4c4b40', // 5000000 in hex
              address: '0xusdc',
              decimals: 6,
            },
          },
        ],
      },
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/alchemy', {
      method: 'POST',
      body: JSON.stringify(event),
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(data.processed).toBe(1)
    expect(creditDeposit).toHaveBeenCalledWith(
      123,
      5000000,
      '0xtxhash123',
      expect.any(String)
    )
  })

  it('ignores transfers not to vault', async () => {
    const event = {
      webhookId: 'wh-1',
      id: 'evt-1',
      createdAt: '2024-01-01T00:00:00Z',
      type: 'ADDRESS_ACTIVITY',
      event: {
        network: 'BASE_MAINNET',
        activity: [
          {
            fromAddress: '0xuser123',
            toAddress: '0xsomeotheraddress',
            blockNum: '0x100',
            hash: '0xtxhash123',
            value: 5,
            asset: 'USDC',
            category: 'token',
            rawContract: {
              rawValue: '0x4c4b40',
              address: '0xusdc',
              decimals: 6,
            },
          },
        ],
      },
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/alchemy', {
      method: 'POST',
      body: JSON.stringify(event),
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.processed).toBe(0)
    expect(creditDeposit).not.toHaveBeenCalled()
  })

  it('ignores deposits below minimum', async () => {
    const event = {
      webhookId: 'wh-1',
      id: 'evt-1',
      createdAt: '2024-01-01T00:00:00Z',
      type: 'ADDRESS_ACTIVITY',
      event: {
        network: 'BASE_MAINNET',
        activity: [
          {
            fromAddress: '0xuser123',
            toAddress: '0x1234567890123456789012345678901234567890',
            blockNum: '0x100',
            hash: '0xtxhash123',
            value: 0.5,
            asset: 'USDC',
            category: 'token',
            rawContract: {
              rawValue: '0x7a120', // 500000 in hex = 0.5 USDC
              address: '0xusdc',
              decimals: 6,
            },
          },
        ],
      },
    }

    const request = new NextRequest('http://localhost:3000/api/webhooks/alchemy', {
      method: 'POST',
      body: JSON.stringify(event),
    })
    const response = await POST(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.processed).toBe(0)
    expect(creditDeposit).not.toHaveBeenCalled()
  })
})
