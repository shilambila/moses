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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      contributions: {
        Row: {
          amount: number
          contribution_date: string
          contribution_type: string
          created_at: string
          id: string
          member_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          contribution_date?: string
          contribution_type?: string
          created_at?: string
          id?: string
          member_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contribution_date?: string
          contribution_type?: string
          created_at?: string
          id?: string
          member_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "membership_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      disbursement_documents: {
        Row: {
          created_at: string
          disbursement_id: string
          file_data: string
          file_size: number
          file_type: string
          filename: string
          id: string
          updated_at: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          disbursement_id: string
          file_data: string
          file_size: number
          file_type: string
          filename: string
          id?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          disbursement_id?: string
          file_data?: string
          file_size?: number
          file_type?: string
          filename?: string
          id?: string
          updated_at?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disbursement_documents_disbursement_id_fkey"
            columns: ["disbursement_id"]
            isOneToOne: false
            referencedRelation: "disbursements"
            referencedColumns: ["id"]
          },
        ]
      }
      disbursements: {
        Row: {
          amount: number
          approved_by: string | null
          bereavement_form_url: string | null
          created_at: string
          disbursement_date: string
          disbursement_type: string | null
          id: string
          member_id: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          bereavement_form_url?: string | null
          created_at?: string
          disbursement_date?: string
          disbursement_type?: string | null
          id?: string
          member_id: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          bereavement_form_url?: string | null
          created_at?: string
          disbursement_date?: string
          disbursement_type?: string | null
          id?: string
          member_id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disbursements_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "membership_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string
          created_at: string
          created_by: string
          document_type: string
          id: string
          meeting_date: string | null
          recipient: string | null
          status: string
          tags: string[] | null
          template_category: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          document_type: string
          id?: string
          meeting_date?: string | null
          recipient?: string | null
          status?: string
          tags?: string[] | null
          template_category?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          document_type?: string
          id?: string
          meeting_date?: string | null
          recipient?: string | null
          status?: string
          tags?: string[] | null
          template_category?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_balances: {
        Row: {
          current_balance: number
          id: string
          last_updated: string
          member_id: string
          total_contributions: number
          total_disbursements: number
        }
        Insert: {
          current_balance?: number
          id?: string
          last_updated?: string
          member_id: string
          total_contributions?: number
          total_disbursements?: number
        }
        Update: {
          current_balance?: number
          id?: string
          last_updated?: string
          member_id?: string
          total_contributions?: number
          total_disbursements?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_balances_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "membership_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_registrations: {
        Row: {
          address: string
          alternative_phone: string | null
          children_data: Json | null
          city: string
          country: string | null
          created_at: string
          days_to_maturity: number | null
          email: string
          emergency_contact_name: string
          emergency_contact_phone: string
          first_name: string
          id: string
          id_number: string | null
          last_name: string
          marital_status: string | null
          maturity_status: string | null
          membership_type: string
          mpesa_payment_reference: string | null
          parent1_alt_phone: string | null
          parent1_area: string | null
          parent1_id_number: string | null
          parent1_name: string | null
          parent1_phone: string | null
          parent2_alt_phone: string | null
          parent2_area: string | null
          parent2_id_number: string | null
          parent2_name: string | null
          parent2_phone: string | null
          payment_status: string | null
          phone: string
          probation_end_date: string | null
          profile_picture_url: string | null
          registration_date: string | null
          registration_status: string | null
          sex: string | null
          spouse_alt_phone: string | null
          spouse_area_of_residence: string | null
          spouse_id_number: string | null
          spouse_name: string | null
          spouse_phone: string | null
          spouse_photo_url: string | null
          spouse_sex: string | null
          state: string
          tns_number: string | null
          updated_at: string
          user_id: string | null
          zip_code: string
        }
        Insert: {
          address: string
          alternative_phone?: string | null
          children_data?: Json | null
          city: string
          country?: string | null
          created_at?: string
          days_to_maturity?: number | null
          email: string
          emergency_contact_name: string
          emergency_contact_phone: string
          first_name: string
          id?: string
          id_number?: string | null
          last_name: string
          marital_status?: string | null
          maturity_status?: string | null
          membership_type: string
          mpesa_payment_reference?: string | null
          parent1_alt_phone?: string | null
          parent1_area?: string | null
          parent1_id_number?: string | null
          parent1_name?: string | null
          parent1_phone?: string | null
          parent2_alt_phone?: string | null
          parent2_area?: string | null
          parent2_id_number?: string | null
          parent2_name?: string | null
          parent2_phone?: string | null
          payment_status?: string | null
          phone: string
          probation_end_date?: string | null
          profile_picture_url?: string | null
          registration_date?: string | null
          registration_status?: string | null
          sex?: string | null
          spouse_alt_phone?: string | null
          spouse_area_of_residence?: string | null
          spouse_id_number?: string | null
          spouse_name?: string | null
          spouse_phone?: string | null
          spouse_photo_url?: string | null
          spouse_sex?: string | null
          state: string
          tns_number?: string | null
          updated_at?: string
          user_id?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          alternative_phone?: string | null
          children_data?: Json | null
          city?: string
          country?: string | null
          created_at?: string
          days_to_maturity?: number | null
          email?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          first_name?: string
          id?: string
          id_number?: string | null
          last_name?: string
          marital_status?: string | null
          maturity_status?: string | null
          membership_type?: string
          mpesa_payment_reference?: string | null
          parent1_alt_phone?: string | null
          parent1_area?: string | null
          parent1_id_number?: string | null
          parent1_name?: string | null
          parent1_phone?: string | null
          parent2_alt_phone?: string | null
          parent2_area?: string | null
          parent2_id_number?: string | null
          parent2_name?: string | null
          parent2_phone?: string | null
          payment_status?: string | null
          phone?: string
          probation_end_date?: string | null
          profile_picture_url?: string | null
          registration_date?: string | null
          registration_status?: string | null
          sex?: string | null
          spouse_alt_phone?: string | null
          spouse_area_of_residence?: string | null
          spouse_id_number?: string | null
          spouse_name?: string | null
          spouse_phone?: string | null
          spouse_photo_url?: string | null
          spouse_sex?: string | null
          state?: string
          tns_number?: string | null
          updated_at?: string
          user_id?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      monthly_expenses: {
        Row: {
          amount: number
          approved_by: string | null
          created_at: string
          description: string | null
          expense_category: string
          expense_date: string
          id: string
          month_year: string
          updated_at: string
        }
        Insert: {
          amount: number
          approved_by?: string | null
          created_at?: string
          description?: string | null
          expense_category: string
          expense_date?: string
          id?: string
          month_year: string
          updated_at?: string
        }
        Update: {
          amount?: number
          approved_by?: string | null
          created_at?: string
          description?: string | null
          expense_category?: string
          expense_date?: string
          id?: string
          month_year?: string
          updated_at?: string
        }
        Relationships: []
      }
      mpesa_payments: {
        Row: {
          amount: number
          checkout_request_id: string | null
          created_at: string
          id: string
          member_id: string
          merchant_request_id: string | null
          mpesa_receipt_number: string | null
          phone_number: string
          result_code: string | null
          result_desc: string | null
          status: string
          transaction_date: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          member_id: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number: string
          result_code?: string | null
          result_desc?: string | null
          status?: string
          transaction_date?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          checkout_request_id?: string | null
          created_at?: string
          id?: string
          member_id?: string
          merchant_request_id?: string | null
          mpesa_receipt_number?: string | null
          phone_number?: string
          result_code?: string | null
          result_desc?: string | null
          status?: string
          transaction_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          state: string | null
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      staff_registrations: {
        Row: {
          assigned_area: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          pending: string | null
          phone: string
          portal_password: string | null
          staff_role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_area?: string | null
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          pending?: string | null
          phone: string
          portal_password?: string | null
          staff_role: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_area?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          pending?: string | null
          phone?: string
          portal_password?: string | null
          staff_role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_area: string | null
          created_at: string
          data: Json | null
          description: string | null
          id: string
          priority: string | null
          status: string
          submitted_by: string
          submitted_to_role: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_area?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string
          submitted_by: string
          submitted_to_role: string
          task_type: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_area?: string | null
          created_at?: string
          data?: Json | null
          description?: string | null
          id?: string
          priority?: string | null
          status?: string
          submitted_by?: string
          submitted_to_role?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_staff_role: {
        Args: { required_roles: string[]; staff_email: string }
        Returns: boolean
      }
      generate_next_tns_number: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      link_staff_to_user: {
        Args: { auth_user_id: string; staff_email: string }
        Returns: undefined
      }
      update_maturity_status: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
