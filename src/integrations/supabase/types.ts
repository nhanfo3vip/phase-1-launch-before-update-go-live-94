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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendance_records: {
        Row: {
          class_id: string
          created_at: string
          date: string
          id: string
          note: string | null
          recorded_by: string | null
          status: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date: string
          id?: string
          note?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          recorded_by?: string | null
          status?: Database["public"]["Enums"]["attendance_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          check_in_code: string
          class_id: string
          created_at: string
          created_by: string | null
          date: string
          ended_at: string | null
          id: string
          is_active: boolean
          started_at: string
        }
        Insert: {
          check_in_code: string
          class_id: string
          created_at?: string
          created_by?: string | null
          date?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
        }
        Update: {
          check_in_code?: string
          class_id?: string
          created_at?: string
          created_by?: string | null
          date?: string
          ended_at?: string | null
          id?: string
          is_active?: boolean
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      catechists: {
        Row: {
          address: string | null
          avatar_url: string | null
          baptism_name: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          baptism_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          baptism_name?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      class_catechists: {
        Row: {
          catechist_id: string
          class_id: string
          created_at: string
          id: string
          is_primary: boolean
        }
        Insert: {
          catechist_id: string
          class_id: string
          created_at?: string
          id?: string
          is_primary?: boolean
        }
        Update: {
          catechist_id?: string
          class_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "class_catechists_catechist_id_fkey"
            columns: ["catechist_id"]
            isOneToOne: false
            referencedRelation: "catechists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_catechists_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          academic_year_id: string
          created_at: string
          description: string | null
          id: string
          name: string
          schedule: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          schedule?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          schedule?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_materials: {
        Row: {
          class_id: string
          created_at: string
          description: string | null
          file_type: string
          file_url: string | null
          id: string
          title: string
          updated_at: string
          uploaded_by: string | null
          week: number | null
        }
        Insert: {
          class_id: string
          created_at?: string
          description?: string | null
          file_type?: string
          file_url?: string | null
          id?: string
          title: string
          updated_at?: string
          uploaded_by?: string | null
          week?: number | null
        }
        Update: {
          class_id?: string
          created_at?: string
          description?: string | null
          file_type?: string
          file_url?: string | null
          id?: string
          title?: string
          updated_at?: string
          uploaded_by?: string | null
          week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "learning_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      mass_attendance: {
        Row: {
          attended: boolean
          created_at: string
          date: string
          id: string
          note: string | null
          recorded_by: string | null
          student_id: string
        }
        Insert: {
          attended?: boolean
          created_at?: string
          date: string
          id?: string
          note?: string | null
          recorded_by?: string | null
          student_id: string
        }
        Update: {
          attended?: boolean
          created_at?: string
          date?: string
          id?: string
          note?: string | null
          recorded_by?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mass_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      scores: {
        Row: {
          class_id: string
          created_at: string
          date: string
          graded_by: string | null
          id: string
          max_score: number
          note: string | null
          score: number
          student_id: string
          type: Database["public"]["Enums"]["score_type"]
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          date?: string
          graded_by?: string | null
          id?: string
          max_score?: number
          note?: string | null
          score: number
          student_id: string
          type: Database["public"]["Enums"]["score_type"]
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          date?: string
          graded_by?: string | null
          id?: string
          max_score?: number
          note?: string | null
          score?: number
          student_id?: string
          type?: Database["public"]["Enums"]["score_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scores_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          address: string | null
          avatar_url: string | null
          baptism_name: string | null
          birth_date: string
          class_id: string | null
          created_at: string
          enrollment_date: string
          gender: Database["public"]["Enums"]["gender"]
          id: string
          is_active: boolean
          name: string
          parent_phone: string | null
          phone: string | null
          student_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          baptism_name?: string | null
          birth_date: string
          class_id?: string | null
          created_at?: string
          enrollment_date?: string
          gender: Database["public"]["Enums"]["gender"]
          id?: string
          is_active?: boolean
          name: string
          parent_phone?: string | null
          phone?: string | null
          student_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          baptism_name?: string | null
          birth_date?: string
          class_id?: string | null
          created_at?: string
          enrollment_date?: string
          gender?: Database["public"]["Enums"]["gender"]
          id?: string
          is_active?: boolean
          name?: string
          parent_phone?: string | null
          phone?: string | null
          student_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "truong_nganh" | "glv" | "student"
      attendance_status: "present" | "absent" | "late" | "excused"
      gender: "male" | "female"
      score_type: "presentation" | "semester1" | "semester2"
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
      app_role: ["admin", "truong_nganh", "glv", "student"],
      attendance_status: ["present", "absent", "late", "excused"],
      gender: ["male", "female"],
      score_type: ["presentation", "semester1", "semester2"],
    },
  },
} as const
