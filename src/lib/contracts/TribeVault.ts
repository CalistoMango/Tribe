/**
 * TribeVault contract ABI and helpers
 * Based on .claude/documentation/smart-contract/TribeVault.sol
 */

import { TRIBE_VAULT_ADDRESS, USDC_CONTRACT_ADDRESS, BASE_CHAIN_ID } from '../constants'

/**
 * TribeVault ABI - only the functions we need
 */
export const TRIBE_VAULT_ABI = [
  // Events
  {
    type: 'event',
    name: 'Deposited',
    inputs: [
      { name: 'fid', type: 'uint256', indexed: true },
      { name: 'depositor', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'Claimed',
    inputs: [
      { name: 'fid', type: 'uint256', indexed: true },
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'cumAmt', type: 'uint256', indexed: false },
      { name: 'delta', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'FundsWithdrawn',
    inputs: [
      { name: 'recipient', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
  {
    type: 'event',
    name: 'PayoutSignerUpdated',
    inputs: [
      { name: 'oldSigner', type: 'address', indexed: true },
      { name: 'newSigner', type: 'address', indexed: true },
    ],
  },
  {
    type: 'event',
    name: 'PausedStateChanged',
    inputs: [{ name: 'isPaused', type: 'bool', indexed: false }],
  },

  // User functions
  {
    type: 'function',
    name: 'deposit',
    inputs: [
      { name: 'fid', type: 'uint256' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'claim',
    inputs: [
      { name: 'fid', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'cumAmt', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },

  // View functions
  {
    type: 'function',
    name: 'claimable',
    inputs: [
      { name: 'fid', type: 'uint256' },
      { name: 'cumAmt', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'lastClaimed',
    inputs: [{ name: 'fid', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'totalBalance',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'payoutSigner',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'usdc',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'domainSeparator',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'paused',
    inputs: [],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
  },
] as const

/**
 * Standard ERC20 ABI for USDC approval
 */
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'approve',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    name: 'allowance',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'decimals',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
  },
] as const

/**
 * EIP-712 domain for TribeVault claims
 */
export const TRIBE_VAULT_DOMAIN = {
  name: 'TribeVault',
  version: '1',
  chainId: BASE_CHAIN_ID,
  verifyingContract: TRIBE_VAULT_ADDRESS,
} as const

/**
 * EIP-712 types for claim signature
 * Matches: keccak256("Claim(uint256 fid,address recipient,uint256 cumAmt,uint256 deadline)")
 */
export const CLAIM_TYPES = {
  Claim: [
    { name: 'fid', type: 'uint256' },
    { name: 'recipient', type: 'address' },
    { name: 'cumAmt', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const

/**
 * Contract addresses for convenience
 */
export const CONTRACTS = {
  tribeVault: TRIBE_VAULT_ADDRESS,
  usdc: USDC_CONTRACT_ADDRESS,
} as const

/**
 * Format USDC amount from micro-units to human readable
 * @param amount Amount in micro-units (6 decimals)
 * @returns Formatted string like "1.50"
 */
export function formatUSDC(amount: bigint | number): string {
  const value = typeof amount === 'bigint' ? amount : BigInt(amount)
  const whole = value / BigInt(1_000_000)
  const fraction = value % BigInt(1_000_000)
  const fractionStr = fraction.toString().padStart(6, '0').slice(0, 2)
  return `${whole}.${fractionStr}`
}

/**
 * Parse USDC amount from human readable to micro-units
 * @param amount Human readable amount like "1.50" or 1.5
 * @returns Amount in micro-units
 */
export function parseUSDC(amount: string | number): bigint {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount
  return BigInt(Math.round(value * 1_000_000))
}

/**
 * Create claim message for EIP-712 signing
 */
export function createClaimMessage(
  fid: number,
  recipient: `0x${string}`,
  cumAmt: bigint,
  deadline: number
) {
  return {
    fid: BigInt(fid),
    recipient,
    cumAmt,
    deadline: BigInt(deadline),
  }
}
