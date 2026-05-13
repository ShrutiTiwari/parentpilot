import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ShareWithConnectionRequest {
  learnerId: string;
  connectionId: string;
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
    const { learnerId, connectionId }: ShareWithConnectionRequest = await req.json()
    
    if (!learnerId || !connectionId) {
      return new Response(
        JSON.stringify({ error: 'learnerId and connectionId are required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Sharing learner', learnerId, 'via connection', connectionId, 'for user', user.id)

    // First, verify the connection exists and is accepted
    const { data: connection, error: connectionError } = await supabaseAdmin
      .from('user_connections')
      .select('id, requester_id, recipient_id, status')
      .eq('id', connectionId)
      .eq('status', 'accepted')
      .or(`requester_id.eq.${user.id},requester_id.eq.${user.id}`)
      .single()

    if (connectionError || !connection) {
      console.error('Connection verification failed:', connectionError)
      return new Response(
        JSON.stringify({ error: 'Connection not found or not accepted' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Determine who we're sharing with (the other person in the connection)
    const sharedWithUserId = connection.requester_id === user.id ? connection.recipient_id : connection.requester_id

    console.log('Sharing with user:', sharedWithUserId)

    // Check if sharing already exists
    const { data: existingAccess } = await supabaseAdmin
      .from('learner_access')
      .select('id')
      .eq('learner_id', learnerId)
      .eq('user_id', sharedWithUserId)
      .eq('status', 'active')
      .single()

    if (existingAccess) {
      return new Response(
        JSON.stringify({ error: 'Progress is already shared with this user' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create the learner access record using service role (bypasses RLS)
    const { error: accessError } = await supabaseAdmin
      .from('learner_access')
      .insert({
        learner_id: learnerId,
        user_id: sharedWithUserId,
        access_type: 'viewer',
        granted_by: user.id,
        status: 'active',
        shared_resource: 'music', // Default to music progress
        share_code: null // Connection-based sharing doesn't use codes
        // Note: connection_id field will be added later via migration
      })

    if (accessError) {
      console.error('Error creating learner access:', accessError)
      return new Response(
        JSON.stringify({ error: 'Failed to share progress', details: accessError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('Successfully shared learner access')

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Progress shared successfully'
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