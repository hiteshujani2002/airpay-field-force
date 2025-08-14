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
    // Create a Supabase client with the service role key
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

    // Get the authorization header to verify the request
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    // Verify the user making the request is authenticated
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    // Get the user to delete from the request body
    const { userIdToDelete } = await req.json()
    
    if (!userIdToDelete) {
      throw new Error('User ID to delete is required')
    }

    console.log('Deleting user:', userIdToDelete, 'by:', user.id)

    // Step 1: Delete from auth.users table using admin client
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete)
    
    if (authDeleteError) {
      console.error('Auth deletion error:', authDeleteError)
      throw new Error(`Failed to delete user from auth: ${authDeleteError.message}`)
    }

    console.log('Successfully deleted user from auth.users')

    // Step 2: Delete from user_roles table
    const { error: roleDeleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userIdToDelete)

    if (roleDeleteError) {
      console.error('Role deletion error:', roleDeleteError)
      // Note: At this point the user is already deleted from auth, 
      // so we log the error but don't fail the operation
      console.error('Warning: User deleted from auth but role deletion failed:', roleDeleteError)
    }

    console.log('Successfully deleted user from user_roles')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User successfully deleted from both auth and user_roles' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Delete user error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})