import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ApproveRequest {
  requestId: string;
  action: 'approve' | 'reject';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    // Parse request body
    const { requestId, action }: ApproveRequest = await req.json()
    if (!requestId || !action) {
      return new Response(
        JSON.stringify({ error: 'Request ID and action are required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return new Response(
        JSON.stringify({ error: 'Action must be "approve" or "reject"' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400 
        }
      )
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Create regular client to get user info
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    )

    // Get the current user
    const { data: { user }, error: userError } = await supabaseUser.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401 
        }
      )
    }

    console.log('User processing share request:', { userId: user.id, requestId, action })

    // Get the pending request and verify ownership
    const { data: requestData, error: fetchError } = await supabaseAdmin
      .from('learner_access')
      .select('id, learner_id, user_id, granted_by, access_type, shared_resource, status')
      .eq('id', requestId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !requestData) {
      return new Response(
        JSON.stringify({ error: 'Request not found or already processed' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Verify that the current user is the one who granted the access (the owner)
    if (requestData.granted_by !== user.id) {
      return new Response(
        JSON.stringify({ error: 'You can only approve requests for your own students' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      )
    }

    const newStatus = action === 'approve' ? 'active' : 'inactive'
    
    // Update the request status
    const { error: updateError } = await supabaseAdmin
      .from('learner_access')
      .update({ status: newStatus })
      .eq('id', requestId)

    if (updateError) {
      console.error('Error updating request status:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to process request' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('Successfully processed share request:', { requestId, action, newStatus })

    const message = action === 'approve' 
      ? 'Access request approved successfully'
      : 'Access request rejected'

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        action,
        status: newStatus
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in approve-share-request function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})