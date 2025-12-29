import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '~/lib/supabase'

// GET /api/users/discover
// Returns discoverable users with optional search and category filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')?.toLowerCase()
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Start building query for discoverable users
    let query = supabase
      .from('users')
      .select('fid, username, display_name, pfp_url, bio, categories, score', { count: 'exact' })
      .eq('discoverable', true)
      .not('bio', 'is', null)
      .order('score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by category if provided
    if (category) {
      query = query.contains('categories', [category])
    }

    const { data: users, error, count } = await query

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Apply search filter in-memory (Supabase doesn't support OR with ilike easily)
    let filteredUsers = users || []
    if (search) {
      filteredUsers = filteredUsers.filter(user =>
        user.username?.toLowerCase().includes(search) ||
        user.display_name?.toLowerCase().includes(search) ||
        user.bio?.toLowerCase().includes(search)
      )
    }

    return NextResponse.json({
      users: filteredUsers,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Discover error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET /api/users/discover/counts
// Returns count of discoverable users per category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { categories } = body

    if (!categories || !Array.isArray(categories)) {
      return NextResponse.json({ error: 'Missing categories array' }, { status: 400 })
    }

    const counts: Record<string, number> = {}

    // Count users per category
    for (const categoryId of categories) {
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('discoverable', true)
        .contains('categories', [categoryId])

      counts[categoryId] = count || 0
    }

    return NextResponse.json({ counts })
  } catch (error) {
    console.error('Category counts error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
