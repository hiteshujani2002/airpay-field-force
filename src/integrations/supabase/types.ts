export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      cpv_forms: {
        Row: {
          assigned_lead_assigner_id: string | null
          created_at: string | null
          current_status: string | null
          form_preview_data: Json | null
          id: string
          initiative: string
          merchants_data: Json | null
          name: string
          sections: Json
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_lead_assigner_id?: string | null
          created_at?: string | null
          current_status?: string | null
          form_preview_data?: Json | null
          id?: string
          initiative: string
          merchants_data?: Json | null
          name: string
          sections?: Json
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_lead_assigner_id?: string | null
          created_at?: string | null
          current_status?: string | null
          form_preview_data?: Json | null
          id?: string
          initiative?: string
          merchants_data?: Json | null
          name?: string
          sections?: Json
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cpv_merchant_status: {
        Row: {
          assigned_cpv_agent_id: string | null
          assigned_lead_assigner_id: string | null
          assigned_on: string | null
          city: string
          cpv_agent: string | null
          cpv_agent_assigned_on: string | null
          cpv_form_id: string
          created_at: string
          id: string
          merchant_address: string
          merchant_name: string
          merchant_phone: string
          pincode: string
          state: string
          updated_at: string
          uploaded_by_user_id: string
          uploaded_on: string
          verification_file_url: string | null
          verification_pdf_url: string | null
          verification_status: string | null
        }
        Insert: {
          assigned_cpv_agent_id?: string | null
          assigned_lead_assigner_id?: string | null
          assigned_on?: string | null
          city: string
          cpv_agent?: string | null
          cpv_agent_assigned_on?: string | null
          cpv_form_id: string
          created_at?: string
          id?: string
          merchant_address: string
          merchant_name: string
          merchant_phone: string
          pincode: string
          state: string
          updated_at?: string
          uploaded_by_user_id: string
          uploaded_on?: string
          verification_file_url?: string | null
          verification_pdf_url?: string | null
          verification_status?: string | null
        }
        Update: {
          assigned_cpv_agent_id?: string | null
          assigned_lead_assigner_id?: string | null
          assigned_on?: string | null
          city?: string
          cpv_agent?: string | null
          cpv_agent_assigned_on?: string | null
          cpv_form_id?: string
          created_at?: string
          id?: string
          merchant_address?: string
          merchant_name?: string
          merchant_phone?: string
          pincode?: string
          state?: string
          updated_at?: string
          uploaded_by_user_id?: string
          uploaded_on?: string
          verification_file_url?: string | null
          verification_pdf_url?: string | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cpv_merchant_status_cpv_form_id_fkey"
            columns: ["cpv_form_id"]
            isOneToOne: false
            referencedRelation: "cpv_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      entities: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          agency_name: string | null
          cin: string | null
          city: string | null
          company_name: string | null
          company_type: Database["public"]["Enums"]["company_type"] | null
          country: string | null
          created_at: string | null
          documents: Json | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          gst_number: string | null
          id: string
          office_ownership:
            | Database["public"]["Enums"]["office_ownership"]
            | null
          pan: string | null
          parent_company: string | null
          pincode: string | null
          spoc_contact: string | null
          spoc_email: string | null
          spoc_username: string | null
          state: string | null
          udyam_number: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          agency_name?: string | null
          cin?: string | null
          city?: string | null
          company_name?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          country?: string | null
          created_at?: string | null
          documents?: Json | null
          entity_type: Database["public"]["Enums"]["entity_type"]
          gst_number?: string | null
          id?: string
          office_ownership?:
            | Database["public"]["Enums"]["office_ownership"]
            | null
          pan?: string | null
          parent_company?: string | null
          pincode?: string | null
          spoc_contact?: string | null
          spoc_email?: string | null
          spoc_username?: string | null
          state?: string | null
          udyam_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          agency_name?: string | null
          cin?: string | null
          city?: string | null
          company_name?: string | null
          company_type?: Database["public"]["Enums"]["company_type"] | null
          country?: string | null
          created_at?: string | null
          documents?: Json | null
          entity_type?: Database["public"]["Enums"]["entity_type"]
          gst_number?: string | null
          id?: string
          office_ownership?:
            | Database["public"]["Enums"]["office_ownership"]
            | null
          pan?: string | null
          parent_company?: string | null
          pincode?: string | null
          spoc_contact?: string | null
          spoc_email?: string | null
          spoc_username?: string | null
          state?: string | null
          udyam_number?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          company: string
          contact_number: string
          created_at: string | null
          created_by_user_id: string | null
          email: string
          id: string
          mapped_to_user_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          company: string
          contact_number: string
          created_at?: string | null
          created_by_user_id?: string | null
          email: string
          id?: string
          mapped_to_user_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          company?: string
          contact_number?: string
          created_at?: string | null
          created_by_user_id?: string | null
          email?: string
          id?: string
          mapped_to_user_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_invitation: {
        Args: {
          p_company?: string
          p_contact_number: string
          p_email: string
          p_mapped_to_user_id?: string
          p_role: Database["public"]["Enums"]["app_role"]
          p_username: string
        }
        Returns: string
      }
      get_current_user_company: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_users_by_role_access: {
        Args: Record<PropertyKey, never>
        Returns: {
          company: string
          contact_number: string
          created_at: string
          created_by_user_id: string
          email: string
          id: string
          mapped_to_user_id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_is_assigned_cpv_agent: {
        Args: { form_id: string; user_id: string }
        Returns: boolean
      }
      user_owns_cpv_form: {
        Args: { form_id: string; user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "client_admin" | "lead_assigner" | "cpv_agent"
      company_type:
        | "private_limited"
        | "public_limited"
        | "partnership"
        | "sole_proprietorship"
        | "llp"
      entity_type: "company" | "agency"
      field_data_type:
        | "text"
        | "number"
        | "email"
        | "phone"
        | "date"
        | "dropdown"
        | "checkbox"
        | "radio"
      field_type: "text" | "image"
      office_ownership: "owned" | "rented" | "shared"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "client_admin", "lead_assigner", "cpv_agent"],
      company_type: [
        "private_limited",
        "public_limited",
        "partnership",
        "sole_proprietorship",
        "llp",
      ],
      entity_type: ["company", "agency"],
      field_data_type: [
        "text",
        "number",
        "email",
        "phone",
        "date",
        "dropdown",
        "checkbox",
        "radio",
      ],
      field_type: ["text", "image"],
      office_ownership: ["owned", "rented", "shared"],
    },
  },
} as const
