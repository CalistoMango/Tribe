// Shared types to avoid circular dependencies

export enum Tab {
  Discover = "discover",
  Bounties = "bounties",
  Earnings = "earnings",
  Referral = "referral",
}

// Database user type (matches Supabase users table)
export interface DbUser {
  fid: number;
  username: string | null;
  display_name: string | null;
  pfp_url: string | null;
  bio: string | null;
  categories: string[] | null;
  referral_code: string | null;
  referred_by_fid: number | null;
  profile_setup_complete: boolean;
  discoverable: boolean;
  score: number | null;
  created_at: string;
  updated_at: string;
}
