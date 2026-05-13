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

    console.log('Fetching connection requests for user:', user.id)

    // Get pending connection requests for this user with requester profiles
    const { data: requests, error: requestsError } = await supabaseAdmin
      .from('user_connections')
      .select(`
        id,
        requester_id,
        message,
        created_at,
        requester:profiles!user_connections_requester_id_fkey(
          id,
          full_name,
          role_type
        )
      `)
      .eq('recipient_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (requestsError) {
      console.error('Error fetching connection requests:', requestsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch connection requests', details: requestsError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Found connection requests:', requests?.length || 0)

    // Format the response to match the expected structure
    const formattedRequests = (requests || []).map(request => ({
      id: request.id,
      requester_id: request.requester_id,
      message: request.message,
      created_at: request.created_at,
      requester_name: request.requester?.full_name || 'Unknown User',
      requester_role: request.requester?.role_type || 'user'
    }))

    return new Response(
      JSON.stringify({ 
        success: true, 
        requests: formattedRequests,
        total: formattedRequests.length
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