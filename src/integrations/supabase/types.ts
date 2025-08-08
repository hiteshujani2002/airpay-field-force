export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      cpv_forms: {
        Row: {
          created_at: string | null
          id: string
          initiative: string
          name: string
          sections: Json
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          initiative: string
          name: string
          sections?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          initiative?: string
          name?: string
          sections?: Json
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
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
