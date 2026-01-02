import { NextRequest, NextResponse } from 'next/server'
import { getBalance, getLedgerEntries } from '~/lib/balance'
import { formatUSDC } from '~/lib/contracts/TribeVault'

/**
 * GET /api/balance
 * Get user's balance and recent transactions
 *
 * Query params:
 * - fid: Farcaster ID (required)
 * - limit: Number of transactions to return (default: 20)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const fidParam = searchParams.get('fid')
    const limitParam = searchParams.get('limit')

    if (!fidParam) {
      return NextResponse.json({ error: 'Missing fid parameter' }, { status: 400 })
    }

    const fid = parseInt(fidParam, 10)
    if (isNaN(fid)) {
      return NextResponse.json({ error: 'Invalid fid parameter' }, { status: 400 })
    }

    const limit = limitParam ? parseInt(limitParam, 10) : 20

    // Get balance and recent transactions in parallel
    const [balance, transactions] = await Promise.all([
      getBalance(fid),
      getLedgerEntries(fid, limit),
    ])

    return NextResponse.json({
      balance: {
        available: balance.available,
        reserved: balance.reserved,
        totalDeposited: balance.totalDeposited,
        totalSpent: balance.totalSpent,
        // Formatted versions for display
        availableFormatted: formatUSDC(balance.available),
        reservedFormatted: formatUSDC(balance.reserved),
        totalDepositedFormatted: formatUSDC(balance.totalDeposited),
        totalSpentFormatted: formatUSDC(balance.totalSpent),
      },
      recentTransactions: transactions.map((tx) => ({
        id: tx.id,
        type: tx.type,
        amount: tx.amount,
        amountFormatted: formatUSDC(Math.abs(tx.amount)),
        referenceId: tx.referenceId,
        description: tx.description,
        createdAt: tx.createdAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching balance:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch balance' },
      { status: 500 }
    )
  }
}
