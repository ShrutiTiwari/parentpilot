import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client with service role (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Verify the user token
    const token = authHeader.replace('Bearer ', '')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Parse request body
    const { searchCriteria } = await req.json()

    if (!searchCriteria) {
      return new Response(
        JSON.stringify({ error: 'No search criteria provided' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Search criteria:', searchCriteria)

    // Build search query with service role client (bypasses RLS)
    let query = supabaseAdmin
      .from('profiles')
      .select('id, full_name, role_type')
      .neq('id', user.id) // Exclude the requesting user

    console.log('Building query with filters:', {
      role: searchCriteria.role,
      name: searchCriteria.name,
      hasRole: !!searchCriteria.role,
      hasName: !!searchCriteria.name
    })

    // Validate that name is provided (mandatory for privacy)
    if (!searchCriteria.name || !searchCriteria.name.trim()) {
      return new Response(
        JSON.stringify({ 
          error: 'Name is required for user search',
          message: 'Please enter at least part of the person\'s name to search'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const searchName = searchCriteria.name.trim()
    
    // Apply filters - name is mandatory, role is optional for refinement
    if (searchCriteria.role && searchName) {
      // Both role and name provided - most specific search
      console.log(`Applying AND logic: role="${searchCriteria.role}" AND name="${searchName}"`)
      query = query
        .ilike('role_type', `%${searchCriteria.role}%`)
        .ilike('full_name', `%${searchName}%`)
    } else {
      // Only name provided (role is empty/unselected)
      console.log(`Applying name filter only: name="${searchName}"`)
      query = query.ilike('full_name', `%${searchName}%`)
    }

    console.log('Search will be case-insensitive and match partial names (first name, last name, or full name)')

    // Execute search with limit
    const { data: profiles, error: searchError } = await query.limit(10)

    if (searchError) {
      console.error('Search error:', searchError)
      return new Response(
        JSON.stringify({ error: 'Search failed', details: searchError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Found profiles:', profiles?.length || 0)

    if (!profiles || profiles.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          users: [],
          message: 'No users found matching search criteria'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get learner counts for each profile
    const userIds = profiles.map(p => p.id)
    const { data: learnerCounts, error: learnerError } = await supabaseAdmin
      .from('music_learners')
      .select('created_by_user_id')
      .in('created_by_user_id', userIds)

    if (learnerError) {
      console.warn('Error fetching learner counts:', learnerError)
    }

    // Count learners per user
    const learnerCountMap = learnerCounts?.reduce((acc: Record<string, number>, learner: any) => {
      acc[learner.created_by_user_id] = (acc[learner.created_by_user_id] || 0) + 1
      return acc
    }, {}) || {}

    // Enhance profiles with learner counts and display fields
    const enrichedUsers = profiles.map(profile => ({
      ...profile,
      learner_count: learnerCountMap[profile.id] || 0,
      display_name: profile.full_name || `User ${profile.id.slice(-6)}`,
      role_display: profile.role_type || 'user'
    }))

    console.log('Returning enriched users:', enrichedUsers.length)

    return new Response(
      JSON.stringify({ 
        success: true, 
        users: enrichedUsers,
        total: enrichedUsers.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})