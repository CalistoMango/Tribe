import { NextRequest, NextResponse } from 'next/server'
import { getNeynarClient } from '~/lib/neynar'
import { TRIBE_FID, LAUNCH_POST_HASH } from '~/lib/constants'

// POST /api/tasks/verify
// Verifies if a user has completed follow and like+recast tasks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { fid, task } = body

    if (!fid) {
      return NextResponse.json({ error: 'Missing fid' }, { status: 400 })
    }

    if (!task || !['follow', 'like_recast'].includes(task)) {
      return NextResponse.json({ error: 'Invalid task. Must be "follow" or "like_recast"' }, { status: 400 })
    }

    const client = getNeynarClient()

    if (task === 'follow') {
      // Check if TRIBE_FID is configured
      if (!TRIBE_FID) {
        // In dev/before launch, auto-approve
        return NextResponse.json({ verified: true, message: 'Auto-approved (TRIBE_FID not configured)' })
      }

      // Check if user follows @tribe by fetching who they follow
      const response = await client.fetchUserFollowing({
        fid,
        limit: 100,
      })

      const isFollowing = response.users.some(follower => follower.user.fid === TRIBE_FID)

      return NextResponse.json({
        verified: isFollowing,
        message: isFollowing ? 'User follows @tribe' : 'User does not follow @tribe',
      })
    }

    if (task === 'like_recast') {
      // Check if LAUNCH_POST_HASH is configured
      if (!LAUNCH_POST_HASH) {
        // In dev/before launch, auto-approve
        return NextResponse.json({ verified: true, message: 'Auto-approved (LAUNCH_POST_HASH not configured)' })
      }

      // Fetch reactions for the launch post (both likes and recasts)
      const [likesResponse, recastsResponse] = await Promise.all([
        client.fetchCastReactions({
          hash: LAUNCH_POST_HASH,
          types: ['likes'],
          limit: 100,
        }),
        client.fetchCastReactions({
          hash: LAUNCH_POST_HASH,
          types: ['recasts'],
          limit: 100,
        }),
      ])

      const hasLiked = likesResponse.reactions.some(
        reaction => reaction.user?.fid === fid
      )
      const hasRecasted = recastsResponse.reactions.some(
        reaction => reaction.user?.fid === fid
      )

      const verified = hasLiked && hasRecasted

      return NextResponse.json({
        verified,
        hasLiked,
        hasRecasted,
        message: verified
          ? 'User liked and recasted launch post'
          : `Missing: ${!hasLiked ? 'like' : ''}${!hasLiked && !hasRecasted ? ' and ' : ''}${!hasRecasted ? 'recast' : ''}`,
      })
    }

    return NextResponse.json({ error: 'Unknown task' }, { status: 400 })
  } catch (error) {
    console.error('Task verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
