/**
 * Balance utility functions for managing user funds
 * Wraps Supabase database functions for balance operations
 */

import { createServerClient } from './supabase'

/**
 * Balance record structure
 */
export interface Balance {
  fid: number
  available: number
  reserved: number
  totalDeposited: number
  totalSpent: number
  updatedAt: string
}

/**
 * Ledger entry structure
 */
export interface LedgerEntry {
  id: string
  fid: number
  type: 'deposit' | 'reserve' | 'spend' | 'release' | 'refund'
  amount: number
  referenceId: string | null
  description: string | null
  createdAt: string
}

/**
 * Database row types (snake_case from Supabase)
 */
interface BalanceRow {
  fid: number
  available: number
  reserved: number
  total_deposited: number
  total_spent: number
  updated_at: string
}

interface LedgerEntryRow {
  id: string
  fid: number
  type: string
  amount: number
  reference_id: string | null
  description: string | null
  created_at: string
}

/**
 * Convert database row to Balance object
 */
function toBalance(row: BalanceRow): Balance {
  return {
    fid: row.fid,
    available: row.available,
    reserved: row.reserved,
    totalDeposited: row.total_deposited,
    totalSpent: row.total_spent,
    updatedAt: row.updated_at,
  }
}

/**
 * Convert database row to LedgerEntry object
 */
function toLedgerEntry(row: LedgerEntryRow): LedgerEntry {
  return {
    id: row.id,
    fid: row.fid,
    type: row.type as LedgerEntry['type'],
    amount: row.amount,
    referenceId: row.reference_id,
    description: row.description,
    createdAt: row.created_at,
  }
}

/**
 * Get user's balance
 * Creates a balance record if one doesn't exist
 */
export async function getBalance(fid: number): Promise<Balance> {
  const supabase = createServerClient()

  // First try to get existing balance
  const { data, error } = await supabase
    .from('balances')
    .select('*')
    .eq('fid', fid)
    .single()

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = row not found, which is fine
    throw new Error(`Failed to get balance: ${error.message}`)
  }

  if (data) {
    return toBalance(data as BalanceRow)
  }

  // Create new balance record
  const { data: newBalance, error: insertError } = await supabase
    .from('balances')
    .insert({ fid, available: 0, reserved: 0, total_deposited: 0, total_spent: 0 })
    .select()
    .single()

  if (insertError) {
    throw new Error(`Failed to create balance: ${insertError.message}`)
  }

  return toBalance(newBalance as BalanceRow)
}

/**
 * Get recent ledger entries for a user
 */
export async function getLedgerEntries(
  fid: number,
  limit: number = 20
): Promise<LedgerEntry[]> {
  const supabase = createServerClient()

  const { data, error } = await supabase
    .from('ledger_entries')
    .select('*')
    .eq('fid', fid)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    throw new Error(`Failed to get ledger entries: ${error.message}`)
  }

  return (data as LedgerEntryRow[]).map(toLedgerEntry)
}

/**
 * Credit a deposit to user's balance
 * Uses idempotent reference_id to prevent duplicate credits
 */
export async function creditDeposit(
  fid: number,
  amount: number,
  txHash: string,
  description?: string
): Promise<Balance> {
  const supabase = createServerClient()

  // Check for duplicate deposit (idempotency)
  const { data: existing } = await supabase
    .from('ledger_entries')
    .select('id')
    .eq('reference_id', txHash)
    .eq('type', 'deposit')
    .single()

  if (existing) {
    // Already credited, return current balance
    return getBalance(fid)
  }

  // Use database function for atomic operation
  const { data, error } = await supabase.rpc('credit_deposit', {
    p_fid: fid,
    p_amount: amount,
    p_tx_hash: txHash,
    p_description: description || 'USDC deposit',
  })

  if (error) {
    throw new Error(`Failed to credit deposit: ${error.message}`)
  }

  return toBalance(data as BalanceRow)
}

/**
 * Reserve funds for a bounty
 * Moves funds from available to reserved
 */
export async function reserveFunds(
  fid: number,
  amount: number,
  bountyId: string,
  description?: string
): Promise<Balance> {
  const supabase = createServerClient()

  const { data, error } = await supabase.rpc('reserve_funds', {
    p_fid: fid,
    p_amount: amount,
    p_bounty_id: bountyId,
    p_description: description || 'Reserved for bounty',
  })

  if (error) {
    throw new Error(`Failed to reserve funds: ${error.message}`)
  }

  return toBalance(data as BalanceRow)
}

/**
 * Release reserved funds back to available
 * Used when bounty is cancelled or completed with leftover
 */
export async function releaseFunds(
  fid: number,
  amount: number,
  bountyId: string,
  description?: string
): Promise<Balance> {
  const supabase = createServerClient()

  const { data, error } = await supabase.rpc('release_funds', {
    p_fid: fid,
    p_amount: amount,
    p_bounty_id: bountyId,
    p_description: description || 'Released from bounty',
  })

  if (error) {
    throw new Error(`Failed to release funds: ${error.message}`)
  }

  return toBalance(data as BalanceRow)
}

/**
 * Spend reserved funds (pay a replier)
 * Deducts from reserved and adds to total_spent
 */
export async function spendFunds(
  fid: number,
  amount: number,
  bountyId: string,
  description?: string
): Promise<Balance> {
  const supabase = createServerClient()

  const { data, error } = await supabase.rpc('spend_funds', {
    p_fid: fid,
    p_amount: amount,
    p_bounty_id: bountyId,
    p_description: description || 'Bounty reward paid',
  })

  if (error) {
    throw new Error(`Failed to spend funds: ${error.message}`)
  }

  return toBalance(data as BalanceRow)
}

/**
 * Check if user has sufficient available funds
 */
export async function hasSufficientFunds(
  fid: number,
  amount: number
): Promise<boolean> {
  const balance = await getBalance(fid)
  return balance.available >= amount
}
