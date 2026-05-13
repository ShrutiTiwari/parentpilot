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

    // Parse request body to see what type of connections to fetch
    const { requestType = 'pending' } = await req.json().catch(() => ({ requestType: 'pending' }))
    
    console.log('Fetching', requestType, 'requests for user:', user.id)

    // Get connection requests based on type
    let statusFilter = 'pending'
    if (requestType === 'accepted') {
      statusFilter = 'accepted'
    }

    console.log('Using status filter:', statusFilter)

    // Get connection requests first
    const { data: connectionRequests, error: connectionError } = await supabaseAdmin
      .from('user_connections')
      .select('id, requester_id, recipient_id, message, created_at, status')
      .or(`recipient_id.eq.${user.id},requester_id.eq.${user.id}`)
      .eq('status', statusFilter)
      .order('created_at', { ascending: false })

    console.log('Raw connection requests from DB:', connectionRequests)

    if (connectionError) {
      console.error('Error fetching connection requests:', connectionError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch connection requests', details: connectionError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get profiles for both requesters and recipients
    let formattedConnectionRequests = []
    if (connectionRequests && connectionRequests.length > 0) {
      // Get all unique user IDs (both requesters and recipients)
      const userIds = [...new Set([
        ...connectionRequests.map(req => req.requester_id),
        ...connectionRequests.map(req => req.recipient_id)
      ])]
      
      console.log('User IDs to fetch profiles for:', userIds)
      
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role_type')
        .in('id', userIds)

      console.log('Profiles fetched:', profiles)

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError)
      }

      // Create profile map
      const profileMap = profiles?.reduce((acc, profile) => {
        acc[profile.id] = profile
        return acc
      }, {} as Record<string, any>) || {}
      
      console.log('Profile map created:', profileMap)

      // Format connection requests with profile data
      formattedConnectionRequests = connectionRequests.map(request => {
        // For pending requests, show requester info
        // For accepted connections, show the "other" person's info
        const otherPersonId = request.requester_id === user.id ? request.recipient_id : request.requester_id
        const isOutgoing = request.requester_id === user.id
        
        return {
          id: request.id,
          requester_id: request.requester_id,
          recipient_id: request.recipient_id,
          message: request.message,
          created_at: request.created_at,
          status: request.status,
          isOutgoing: isOutgoing,
          // For display purposes, show the other person's info
          other_user_name: profileMap[otherPersonId]?.full_name || 'Unknown User',
          other_user_role: profileMap[otherPersonId]?.role_type || 'user',
          // Keep original requester info for backwards compatibility
          requester_name: profileMap[request.requester_id]?.full_name || 'Unknown User',
          requester_role: profileMap[request.requester_id]?.role_type || 'user'
        }
      })
    }

    console.log('Found connection requests:', formattedConnectionRequests.length)

    return new Response(
      JSON.stringify({ 
        success: true, 
        connectionRequests: formattedConnectionRequests,
        total: formattedConnectionRequests.length
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