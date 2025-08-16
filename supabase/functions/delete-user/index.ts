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

    // Step 1: Check if user exists in user_roles table first
    const { data: userRoleData, error: userRoleCheckError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userIdToDelete)
      .single()

    if (userRoleCheckError && userRoleCheckError.code !== 'PGRST116') {
      console.error('Error checking user_roles:', userRoleCheckError)
      throw new Error(`Failed to check user roles: ${userRoleCheckError.message}`)
    }

    if (!userRoleData) {
      throw new Error('User not found in user_roles table')
    }

    // Step 2: Delete from user_roles table first
    const { error: roleDeleteError } = await supabaseAdmin
      .from('user_roles')
      .delete()
      .eq('user_id', userIdToDelete)

    if (roleDeleteError) {
      console.error('Role deletion error:', roleDeleteError)
      throw new Error(`Failed to delete user from user_roles: ${roleDeleteError.message}`)
    }

    console.log('Successfully deleted user from user_roles')

    // Step 3: Try to delete from auth.users table using admin client
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete)
    
    if (authDeleteError) {
      console.error('Auth deletion error:', authDeleteError)
      // If auth deletion fails but role deletion succeeded, log warning but don't fail
      if (authDeleteError.message.includes('User not found')) {
        console.log('User was not found in auth.users - may have been a pending invitation')
      } else {
        console.error('Warning: User deleted from user_roles but auth deletion failed:', authDeleteError)
      }
    } else {
      console.log('Successfully deleted user from auth.users')
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User successfully deleted from user_roles and auth (if existed)' 
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