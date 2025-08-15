import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.54.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateUserRequest {
  username: string;
  email: string;
  role: string;
  company: string;
  contactNumber: string;
  mappedToUserId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header provided');
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Create regular client to validate the requesting user
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verify the current user
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
    if (userError || !currentUser) {
      console.error('Authentication error:', userError);
      throw new Error('Unauthorized: Invalid or expired token');
    }

    console.log('Current user verified:', currentUser.id);

    const { username, email, role, company, contactNumber, mappedToUserId }: CreateUserRequest = await req.json();

    console.log(`Creating user ${email} with role ${role}`);

    // Generate a temporary password
    const tempPassword = `temp_${Math.random().toString(36).slice(2, 10)}!A1`;

    // Step 1: Create user in auth.users using admin client
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: tempPassword,
      email_confirm: false, // We'll send our own invitation
      user_metadata: {
        username: username,
        role: role,
        company: company,
        contact_number: contactNumber
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      
      // Handle specific error cases with user-friendly messages
      if (authError.message.includes('already been registered') || authError.message.includes('email_exists')) {
        return new Response(JSON.stringify({ 
          error: 'A user with this email address already exists. Please use a different email address.',
          code: 'EMAIL_EXISTS'
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
      
      if (authError.message.includes('invalid_email')) {
        return new Response(JSON.stringify({ 
          error: 'Please provide a valid email address.',
          code: 'INVALID_EMAIL'
        }), {
          status: 400,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      }
      
      // Generic auth error
      return new Response(JSON.stringify({ 
        error: `Authentication error: ${authError.message}`,
        code: 'AUTH_ERROR'
      }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned');
    }

    console.log('Auth user created successfully:', newUser.user.id);

    // Step 2: Create corresponding entry in user_roles table
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: newUser.user.id,
        username: username,
        email: email,
        contact_number: contactNumber,
        role: role,
        company: company,
        mapped_to_user_id: mappedToUserId || null,
        created_by_user_id: currentUser.id
      });

    if (roleError) {
      console.error('Error creating user role:', roleError);
      
      // Rollback: Delete the auth user if role creation failed
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      
      throw new Error(`Failed to create user role: ${roleError.message}`);
    }

    console.log('User role created successfully');

    // Step 3: Generate a password reset link for the user to set their password
    const { data: resetData, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: email,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')?.replace('/supabase', '')}/auth/reset-password`
      }
    });

    if (resetError) {
      console.error('Error generating reset link:', resetError);
      // Don't fail the whole process for this
    }

    return new Response(JSON.stringify({ 
      success: true, 
      userId: newUser.user.id,
      invitationLink: resetData?.properties?.action_link || null,
      message: 'User created successfully in both authentication and roles systems'
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in create-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);