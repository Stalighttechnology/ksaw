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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      registrations: {
        Row: {
          admin_notes: string | null
          age_proof: string | null
          aadhaar_number: string | null
          aadhaar_proof: string | null
          apprenticeship: string | null
          caste: string | null
          caste_sub_category: string | null
          caste_cert_type: string | null
          caste_proof: string | null
          category: string | null
          created_at: string
          cur_city: string | null
          cur_district: string | null
          cur_location: string | null
          cur_state: string | null
          cur_street1: string | null
          cur_street2: string | null
          cur_taluk: string | null
          cur_village: string | null
          cur_zip: string | null
          current_designation: string | null
          current_employer: string | null
          currently_employed: string | null
          declaration_accepted: boolean
          dob: string | null
          education: string | null
          education_proof: string | null
          email: string
          employed_from: string | null
          employment_proof: string | null
          first_name: string
          gender: string | null
          guardian_first_name: string | null
          guardian_last_name: string | null
          guardian_salutation: string | null
          guardianship: string | null
          id: string
          language_of_instruction: string | null
          languages_known: string[]
          last_designation: string | null
          last_employer: string | null
          last_employer_address: string | null
          last_name: string
          last_salary: string | null
          marital_status: string | null
          nigama: string | null
          other_language: string | null
          past_skill_experience: string | null
          per_city: string | null
          per_district: string | null
          per_location: string | null
          per_state: string | null
          per_street1: string | null
          per_street2: string | null
          per_taluk: string | null
          per_village: string | null
          per_zip: string | null
          phone: string
          previously_employed: string | null
          profile_image: string | null
          rd_number: string | null
          religion: string | null
          sa_proof: string | null
          sa_sub_types: string[]
          sa_types: string[]
          same_address: string | null
          skill_experience_proof: string | null
          skill_sought: string | null
          specially_abled: string | null
          status: string
          stream: string | null
          subject: string | null
          training_duration: string | null
          updated_at: string
          work_experience: string | null
          year_of_passing: string | null
        }
        Insert: {
          admin_notes?: string | null
          age_proof?: string | null
          aadhaar_number?: string | null
          aadhaar_proof?: string | null
          apprenticeship?: string | null
          caste?: string | null
          caste_sub_category?: string | null
          caste_cert_type?: string | null
          caste_proof?: string | null
          category?: string | null
          created_at?: string
          cur_city?: string | null
          cur_district?: string | null
          cur_location?: string | null
          cur_state?: string | null
          cur_street1?: string | null
          cur_street2?: string | null
          cur_taluk?: string | null
          cur_village?: string | null
          cur_zip?: string | null
          current_designation?: string | null
          current_employer?: string | null
          currently_employed?: string | null
          declaration_accepted?: boolean
          dob?: string | null
          education?: string | null
          education_proof?: string | null
          email: string
          employed_from?: string | null
          employment_proof?: string | null
          first_name: string
          gender?: string | null
          guardian_first_name?: string | null
          guardian_last_name?: string | null
          guardian_salutation?: string | null
          guardianship?: string | null
          id?: string
          language_of_instruction?: string | null
          languages_known?: string[]
          last_designation?: string | null
          last_employer?: string | null
          last_employer_address?: string | null
          last_name: string
          last_salary?: string | null
          marital_status?: string | null
          nigama?: string | null
          other_language?: string | null
          past_skill_experience?: string | null
          per_city?: string | null
          per_district?: string | null
          per_location?: string | null
          per_state?: string | null
          per_street1?: string | null
          per_street2?: string | null
          per_taluk?: string | null
          per_village?: string | null
          per_zip?: string | null
          phone: string
          previously_employed?: string | null
          profile_image?: string | null
          rd_number?: string | null
          religion?: string | null
          sa_proof?: string | null
          sa_sub_types?: string[]
          sa_types?: string[]
          same_address?: string | null
          skill_experience_proof?: string | null
          skill_sought?: string | null
          specially_abled?: string | null
          status?: string
          stream?: string | null
          subject?: string | null
          training_duration?: string | null
          updated_at?: string
          work_experience?: string | null
          year_of_passing?: string | null
        }
        Update: {
          admin_notes?: string | null
          age_proof?: string | null
          aadhaar_number?: string | null
          aadhaar_proof?: string | null
          apprenticeship?: string | null
          caste?: string | null
          caste_sub_category?: string | null
          caste_cert_type?: string | null
          caste_proof?: string | null
          category?: string | null
          created_at?: string
          cur_city?: string | null
          cur_district?: string | null
          cur_location?: string | null
          cur_state?: string | null
          cur_street1?: string | null
          cur_street2?: string | null
          cur_taluk?: string | null
          cur_village?: string | null
          cur_zip?: string | null
          current_designation?: string | null
          current_employer?: string | null
          currently_employed?: string | null
          declaration_accepted?: boolean
          dob?: string | null
          education?: string | null
          education_proof?: string | null
          email?: string
          employed_from?: string | null
          employment_proof?: string | null
          first_name?: string
          gender?: string | null
          guardian_first_name?: string | null
          guardian_last_name?: string | null
          guardian_salutation?: string | null
          guardianship?: string | null
          id?: string
          language_of_instruction?: string | null
          languages_known?: string[]
          last_designation?: string | null
          last_employer?: string | null
          last_employer_address?: string | null
          last_name?: string
          last_salary?: string | null
          marital_status?: string | null
          nigama?: string | null
          other_language?: string | null
          past_skill_experience?: string | null
          per_city?: string | null
          per_district?: string | null
          per_location?: string | null
          per_state?: string | null
          per_street1?: string | null
          per_street2?: string | null
          per_taluk?: string | null
          per_village?: string | null
          per_zip?: string | null
          phone?: string
          previously_employed?: string | null
          profile_image?: string | null
          rd_number?: string | null
          religion?: string | null
          sa_proof?: string | null
          sa_sub_types?: string[]
          sa_types?: string[]
          same_address?: string | null
          skill_experience_proof?: string | null
          skill_sought?: string | null
          specially_abled?: string | null
          status?: string
          stream?: string | null
          subject?: string | null
          training_duration?: string | null
          updated_at?: string
          work_experience?: string | null
          year_of_passing?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "user"
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
      app_role: ["admin", "staff", "user"],
    },
  },
} as const
