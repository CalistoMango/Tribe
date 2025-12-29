import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '~/lib/supabase'

// GET /api/referrals
// Returns referral stats for a user and leaderboard
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fid = searchParams.get('fid')

    // Get leaderboard: users with most referrals
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('users')
      .select('fid, username, display_name, pfp_url')
      .not('fid', 'is', null)
      .order('fid', { ascending: true }) // Temporary ordering until we have referral counts

    if (leaderboardError) {
      console.error('Error fetching leaderboard:', leaderboardError)
      return NextResponse.json({ error: 'Failed to fetch leaderboard' }, { status: 500 })
    }

    // Count referrals for each user in leaderboard
    const leaderboardWithCounts = await Promise.all(
      (leaderboard || []).map(async (user) => {
        const { count } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('referred_by_fid', user.fid)

        return {
          ...user,
          referral_count: count || 0,
        }
      })
    )

    // Sort by referral count and take top 10
    const sortedLeaderboard = leaderboardWithCounts
      .filter(u => u.referral_count > 0)
      .sort((a, b) => b.referral_count - a.referral_count)
      .slice(0, 10)
      .map((user, index) => ({
        rank: index + 1,
        fid: user.fid,
        username: user.username,
        display_name: user.display_name,
        pfp_url: user.pfp_url,
        referral_count: user.referral_count,
      }))

    // If fid provided, get user's stats
    let userStats = null
    if (fid) {
      const fidNum = parseInt(fid, 10)

      // Get user's referral count
      const { count: userReferralCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('referred_by_fid', fidNum)

      // Get user's referral code
      const { data: userData } = await supabase
        .from('users')
        .select('referral_code')
        .eq('fid', fidNum)
        .single()

      // Calculate user's rank
      let userRank: number | null = null
      const userInLeaderboard = sortedLeaderboard.find(u => u.fid === fidNum)
      if (userInLeaderboard) {
        userRank = userInLeaderboard.rank
      } else if (userReferralCount && userReferralCount > 0) {
        // Count how many users have more referrals
        const { data: usersWithMoreReferrals } = await supabase
          .from('users')
          .select('fid')

        if (usersWithMoreReferrals) {
          const countsAbove = await Promise.all(
            usersWithMoreReferrals.map(async (u) => {
              const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('referred_by_fid', u.fid)
              return { fid: u.fid, count: count || 0 }
            })
          )
          userRank = countsAbove.filter(c => c.count > (userReferralCount || 0)).length + 1
        }
      }

      userStats = {
        referral_count: userReferralCount || 0,
        referral_code: userData?.referral_code || null,
        rank: userRank,
      }
    }

    return NextResponse.json({
      leaderboard: sortedLeaderboard,
      userStats,
    })
  } catch (error) {
    console.error('Referrals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
