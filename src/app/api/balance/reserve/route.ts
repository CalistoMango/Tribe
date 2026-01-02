import { NextRequest, NextResponse } from 'next/server'
import { reserveFunds, getBalance } from '~/lib/balance'

/**
 * POST /api/balance/reserve
 * Reserve funds for bounty creation
 *
 * Body:
 * - fid: Farcaster ID
 * - amount: Amount to reserve (in USDC micro-units)
 * - bountyId: UUID of the bounty
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fid, amount, bountyId } = body

    // Validate required fields
    if (!fid || typeof fid !== 'number') {
      return NextResponse.json({ error: 'Missing or invalid fid' }, { status: 400 })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'Missing or invalid amount' }, { status: 400 })
    }

    if (!bountyId || typeof bountyId !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid bountyId' }, { status: 400 })
    }

    // Check current balance first
    const currentBalance = await getBalance(fid)
    if (currentBalance.available < amount) {
      return NextResponse.json(
        {
          error: 'Insufficient funds',
          available: currentBalance.available,
          required: amount,
        },
        { status: 400 }
      )
    }

    // Reserve the funds
    const newBalance = await reserveFunds(fid, amount, bountyId)

    return NextResponse.json({
      success: true,
      newAvailable: newBalance.available,
      newReserved: newBalance.reserved,
    })
  } catch (error) {
    console.error('Error reserving funds:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to reserve funds' },
      { status: 500 }
    )
  }
}
