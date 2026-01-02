import { NextRequest, NextResponse } from 'next/server'
import { releaseFunds } from '~/lib/balance'

/**
 * POST /api/balance/release
 * Release reserved funds back to available
 * Used when bounty is cancelled or completed with leftover
 *
 * Body:
 * - fid: Farcaster ID
 * - amount: Amount to release (in USDC micro-units)
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

    // Release the funds
    const newBalance = await releaseFunds(fid, amount, bountyId)

    return NextResponse.json({
      success: true,
      newAvailable: newBalance.available,
      newReserved: newBalance.reserved,
    })
  } catch (error) {
    console.error('Error releasing funds:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to release funds' },
      { status: 500 }
    )
  }
}
