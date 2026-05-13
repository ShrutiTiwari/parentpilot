import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ClaimRequest {
  shareCode: string;
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
    const { shareCode }: ClaimRequest = await req.json()
    if (!shareCode) {
      return new Response(
        JSON.stringify({ error: 'Share code is required' }),
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

    console.log('User claiming share code:', { userId: user.id, email: user.email, shareCode })

    // Check user role - only teachers and parents can claim codes
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role_type, full_name')
      .eq('id', user.id)
      .single()

    if (!profile || !['teacher', 'parent'].includes(profile.role_type)) {
      console.error('Role validation failed:', { profile, userRole: profile?.role_type })
      return new Response(
        JSON.stringify({ error: 'Only teachers and parents can use share codes', details: `Your role: ${profile?.role_type || 'none'}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 403 
        }
      )
    }

    console.log('Role validation passed:', { userRole: profile.role_type })

    // Find the share code in learner_access table
    const { data: shareData, error: fetchError } = await supabaseAdmin
      .from('learner_access')
      .select('id, learner_id, user_id, granted_by, shared_resource, status, share_code, access_type')
      .eq('share_code', shareCode)
      .not('share_code', 'is', null)
      .single()

    console.log('Share code query result:', { shareData, fetchError })

    if (fetchError || !shareData) {
      console.error('Share code lookup failed:', { fetchError, shareCode })
      return new Response(
        JSON.stringify({ error: 'Invalid or expired share code', details: fetchError?.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404 
        }
      )
    }

    // Check if code is still available (has a share_code and is an owner record)
    if (!shareData.share_code || shareData.access_type !== 'owner') {
      console.error('Share code validation failed:', { 
        hasShareCode: !!shareData.share_code, 
        accessType: shareData.access_type,
        shareData 
      })
      return new Response(
        JSON.stringify({ 
          error: 'This share code has already been used or is invalid',
          details: `Share code: ${shareData.share_code ? 'exists' : 'missing'}, Access type: ${shareData.access_type}`
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409 
        }
      )
    }

    console.log('Share code validation passed')

    // Check if the person trying to use the code is not the same as the one who created it
    if (shareData.granted_by === user.id) {
      console.error('Self-claim validation failed:', { grantedBy: shareData.granted_by, userId: user.id })
      return new Response(
        JSON.stringify({ error: 'You cannot use your own share code' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409 
        }
      )
    }

    console.log('Self-claim validation passed')

    // Check if user already has access to this learner
    const { data: existingAccess } = await supabaseAdmin
      .from('learner_access')
      .select('id')
      .eq('learner_id', shareData.learner_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single()

    if (existingAccess) {
      console.error('Existing access found:', { existingAccess, userId: user.id, learnerId: shareData.learner_id })
      return new Response(
        JSON.stringify({ error: 'You already have access to this student' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 409 
        }
      )
    }

    console.log('Existing access check passed')

    // Start transaction: Clear the share code and create new pending request
    console.log('Creating access request for:', { 
      learner_id: shareData.learner_id, 
      requester_id: user.id,
      grantor_id: shareData.granted_by 
    })

    // Step 1: Clear the share code from original record
    const { error: clearError } = await supabaseAdmin
      .from('learner_access')
      .update({ 
        share_code: null
      })
      .eq('id', shareData.id)

    if (clearError) {
      console.error('Error clearing share code:', clearError)
      return new Response(
        JSON.stringify({ error: 'Failed to process share code' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    // Step 2: Create new pending access record for the claimer
    const { error: insertError, data: insertData } = await supabaseAdmin
      .from('learner_access')
      .insert({
        learner_id: shareData.learner_id,
        user_id: user.id, // The person claiming the code
        access_type: 'viewer',
        granted_by: shareData.granted_by, // The original owner
        status: 'pending', // Pending approval from owner
        shared_resource: shareData.shared_resource,
        share_code: null // No share code for claimed records
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating access record:', insertError)
      // Try to restore the share code if insertion failed
      await supabaseAdmin
        .from('learner_access')
        .update({ share_code: shareCode })
        .eq('id', shareData.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create access request' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500 
        }
      )
    }

    console.log('Successfully created access request:', insertData)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Access request sent for learner's ${shareData.shared_resource} progress`,
        requestId: insertData.id 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in claim-share-code function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})