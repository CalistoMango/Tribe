import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '~/lib/supabase'

// GET /api/users/me?fid=123
// Returns the current user's profile
export async function GET(request: NextRequest) {
  try {
    const fid = request.nextUrl.searchParams.get('fid')

    if (!fid) {
      return NextResponse.json({ error: 'Missing fid parameter' }, { status: 400 })
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('fid', parseInt(fid))
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      console.error('Error fetching user:', error)
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/users/me
// Updates the current user's profile (bio, categories)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { fid, bio, categories, discoverable } = body

    if (!fid) {
      return NextResponse.json({ error: 'Missing fid' }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (bio !== undefined) {
      updateData.bio = bio
    }

    if (categories !== undefined) {
      updateData.categories = categories
    }

    // Set profile_setup_complete if both bio and categories are provided
    if (bio && categories && categories.length > 0) {
      updateData.profile_setup_complete = true
    }

    // Set discoverable flag if provided
    if (discoverable !== undefined) {
      updateData.discoverable = discoverable
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('fid', fid)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
