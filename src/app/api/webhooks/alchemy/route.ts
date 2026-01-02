import { NextRequest, NextResponse } from 'next/server'
import { creditDeposit } from '~/lib/balance'
import {
  ALCHEMY_WEBHOOK_SIGNING_KEY,
  TRIBE_VAULT_ADDRESS,
  MIN_DEPOSIT_USDC,
} from '~/lib/constants'
import { createServerClient } from '~/lib/supabase'

/**
 * Alchemy webhook event types
 */
interface AlchemyWebhookEvent {
  webhookId: string
  id: string
  createdAt: string
  type: string
  event: {
    network: string
    activity: AlchemyActivity[]
  }
}

interface AlchemyActivity {
  fromAddress: string
  toAddress: string
  blockNum: string
  hash: string
  value: number
  asset: string
  category: string
  rawContract: {
    rawValue: string
    address: string
    decimals: number
  }
  log?: {
    address: string
    topics: string[]
    data: string
    blockNumber: string
    transactionHash: string
    logIndex: string
  }
}

/**
 * Verify Alchemy webhook signature using Web Crypto API
 */
async function verifySignature(body: string, signature: string): Promise<boolean> {
  if (!ALCHEMY_WEBHOOK_SIGNING_KEY) {
    console.warn('ALCHEMY_WEBHOOK_SIGNING_KEY not set, skipping verification')
    return true // Allow in development
  }

  try {
    const encoder = new TextEncoder()
    const keyData = encoder.encode(ALCHEMY_WEBHOOK_SIGNING_KEY)
    const messageData = encoder.encode(body)

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, messageData)
    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')

    return signature === expectedSignature
  } catch {
    console.error('Failed to verify webhook signature')
    return false
  }
}

/**
 * Look up user FID by wallet address
 */
async function getFidByAddress(address: string): Promise<number | null> {
  const supabase = createServerClient()
  const normalizedAddress = address.toLowerCase()

  const { data, error } = await supabase
    .from('users')
    .select('fid')
    .ilike('address', normalizedAddress)
    .single()

  if (error || !data) {
    return null
  }

  return data.fid
}

/**
 * POST /api/webhooks/alchemy
 * Handle Alchemy webhook for deposit events
 *
 * Alchemy sends ADDRESS_ACTIVITY webhooks when deposits are made to TribeVault.
 * We filter for USDC transfers and credit the user's balance.
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const body = await request.text()
    const signature = request.headers.get('x-alchemy-signature') || ''

    // Verify webhook signature
    const isValid = await verifySignature(body, signature)
    if (!isValid) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse the webhook event
    const event: AlchemyWebhookEvent = JSON.parse(body)

    // Only process address activity events
    if (event.type !== 'ADDRESS_ACTIVITY') {
      return NextResponse.json({ message: 'Event type not handled' })
    }

    const activities = event.event.activity || []
    let processedCount = 0

    for (const activity of activities) {
      // Filter for transfers to our vault
      const toAddress = activity.toAddress?.toLowerCase()
      const vaultAddress = TRIBE_VAULT_ADDRESS.toLowerCase()

      if (toAddress !== vaultAddress) {
        continue
      }

      // Check if it's a USDC transfer (or ERC20 token transfer category)
      if (activity.category !== 'token' && activity.category !== 'erc20') {
        continue
      }

      // Get the deposit amount (in USDC micro-units)
      const rawValue = activity.rawContract?.rawValue
      if (!rawValue) {
        console.warn('Missing raw value in activity:', activity.hash)
        continue
      }

      const amount = parseInt(rawValue, 16)

      // Enforce minimum deposit
      if (amount < MIN_DEPOSIT_USDC) {
        console.log(`Deposit below minimum: ${amount} < ${MIN_DEPOSIT_USDC}`)
        continue
      }

      // Look up the user by their wallet address
      const fid = await getFidByAddress(activity.fromAddress)
      if (!fid) {
        console.warn(`No user found for address: ${activity.fromAddress}`)
        // Still return success - we just can't credit an unknown user
        continue
      }

      // Credit the deposit
      try {
        await creditDeposit(
          fid,
          amount,
          activity.hash,
          `USDC deposit from ${activity.fromAddress.slice(0, 10)}...`
        )
        processedCount++
        console.log(`Credited ${amount} to FID ${fid} from tx ${activity.hash}`)
      } catch (err) {
        // Likely a duplicate deposit (idempotency check)
        console.log(`Skipped deposit ${activity.hash}:`, err)
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
    })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/alchemy
 * Health check for webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    vault: TRIBE_VAULT_ADDRESS,
    minDeposit: MIN_DEPOSIT_USDC,
  })
}
