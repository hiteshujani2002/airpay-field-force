import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UserInvitationRequest {
  username: string;
  email: string;
  role: string;
  invitationToken: string;
  createdBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, email, role, invitationToken, createdBy }: UserInvitationRequest = await req.json();

    console.log(`Sending invitation email to ${email} for role ${role}`);

    const signUpUrl = `${Deno.env.get('SUPABASE_URL')}/auth/v1/verify?token=${invitationToken}&type=signup&redirect_to=${encodeURIComponent(window.location.origin + '/auth/complete-signup')}`;

    const emailResponse = await resend.emails.send({
      from: "CPV Portal <onboarding@resend.dev>",
      to: [email],
      subject: "Welcome to CPV Portal - Complete Your Account Setup",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">Welcome to CPV Portal</h1>
          
          <p>Hello <strong>${username}</strong>,</p>
          
          <p>You have been invited to join the CPV Portal as a <strong>${role}</strong> by ${createdBy}.</p>
          
          <p>To complete your account setup, please click the button below to set your password and access the portal:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${signUpUrl}" 
               style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Complete Account Setup
            </a>
          </div>
          
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">
            ${signUpUrl}
          </p>
          
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          
          <h3 style="color: #333;">Your Role: ${role}</h3>
          <p>Based on your assigned role, you will have access to specific features within the CPV Portal:</p>
          <ul>
            <li><strong>Super Admin:</strong> Full system access and user management</li>
            <li><strong>Client Admin:</strong> Manage forms and assign leads</li>
            <li><strong>Lead Assigner:</strong> Manage assigned leads and create CPV agents</li>
            <li><strong>CPV Agent:</strong> Process and verify merchant leads</li>
          </ul>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you didn't expect this invitation, please contact your administrator or ignore this email.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            Best regards,<br>
            The CPV Portal Team
          </p>
        </div>
      `,
    });

    console.log("Invitation email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-user-invitation function:", error);
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