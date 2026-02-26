export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attendance: {
        Row: {
          id: string
          trip_id: string
          student_id: string
          present: boolean
          notes: string | null
          recorded_at: string
          recorded_by: string
        }
        Insert: {
          id?: string
          trip_id: string
          student_id: string
          present: boolean
          notes?: string | null
          recorded_at?: string
          recorded_by: string
        }
        Update: {
          id?: string
          trip_id?: string
          student_id?: string
          present?: boolean
          notes?: string | null
          recorded_at?: string
          recorded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          }
        ]
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          user_type: string | null
          action: string
          table_name: string
          record_id: string
          before_state: Json | null
          after_state: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          user_type?: string | null
          action: string
          table_name: string
          record_id: string
          before_state?: Json | null
          after_state?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          user_type?: string | null
          action?: string
          table_name?: string
          record_id?: string
          before_state?: Json | null
          after_state?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Relationships: []
      }
      availability: {
        Row: {
          id: string
          experience_id: string
          available_date: string
          start_time: string | null
          end_time: string | null
          capacity: number
          booked_count: number
          created_at: string
        }
        Insert: {
          id?: string
          experience_id: string
          available_date: string
          start_time?: string | null
          end_time?: string | null
          capacity: number
          booked_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          experience_id?: string
          available_date?: string
          start_time?: string | null
          end_time?: string | null
          capacity?: number
          booked_count?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          }
        ]
      }
      chaperones: {
        Row: {
          id: string
          trip_id: string
          parent_id: string
          status: string
          background_check_verified: boolean
          invited_at: string
          accepted_at: string | null
        }
        Insert: {
          id?: string
          trip_id: string
          parent_id: string
          status?: string
          background_check_verified?: boolean
          invited_at?: string
          accepted_at?: string | null
        }
        Update: {
          id?: string
          trip_id?: string
          parent_id?: string
          status?: string
          background_check_verified?: boolean
          invited_at?: string
          accepted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chaperones_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chaperones_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          }
        ]
      }
      districts: {
        Row: {
          id: string
          name: string
          code: string | null
          address: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code?: string | null
          address?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string | null
          address?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          id: string
          permission_slip_id: string
          document_type: string
          storage_path: string
          encrypted: boolean
          created_at: string
        }
        Insert: {
          id?: string
          permission_slip_id: string
          document_type: string
          storage_path: string
          encrypted?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          permission_slip_id?: string
          document_type?: string
          storage_path?: string
          encrypted?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_permission_slip_id_fkey"
            columns: ["permission_slip_id"]
            isOneToOne: false
            referencedRelation: "permission_slips"
            referencedColumns: ["id"]
          }
        ]
      }
      experiences: {
        Row: {
          id: string
          venue_id: string
          title: string
          description: string | null
          duration_minutes: number
          capacity: number
          min_students: number | null
          max_students: number | null
          educational_standards: Json
          grade_levels: string[]
          subjects: string[]
          published: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          title: string
          description?: string | null
          duration_minutes: number
          capacity: number
          min_students?: number | null
          max_students?: number | null
          educational_standards?: Json
          grade_levels?: string[]
          subjects?: string[]
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          title?: string
          description?: string | null
          duration_minutes?: number
          capacity?: number
          min_students?: number | null
          max_students?: number | null
          educational_standards?: Json
          grade_levels?: string[]
          subjects?: string[]
          published?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          user_type: string
          channel: string
          subject: string
          body: string
          status: string
          is_critical: boolean
          metadata: Json
          sent_at: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_type: string
          channel: string
          subject: string
          body: string
          status?: string
          is_critical?: boolean
          metadata?: Json
          sent_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_type?: string
          channel?: string
          subject?: string
          body?: string
          status?: string
          is_critical?: boolean
          metadata?: Json
          sent_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      parents: {
        Row: {
          id: string
          user_id: string | null
          first_name: string
          last_name: string
          email: string
          phone: string
          language: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          first_name: string
          last_name: string
          email: string
          phone: string
          language?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          phone?: string
          language?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          id: string
          permission_slip_id: string
          parent_id: string | null
          amount_cents: number
          stripe_payment_intent_id: string | null
          stripe_charge_id: string | null
          stripe_fee_cents: number | null
          status: string
          payment_method: string | null
          error_message: string | null
          is_split_payment: boolean
          split_payment_group_id: string | null
          paid_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          permission_slip_id: string
          parent_id?: string | null
          amount_cents: number
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          stripe_fee_cents?: number | null
          status?: string
          payment_method?: string | null
          error_message?: string | null
          is_split_payment?: boolean
          split_payment_group_id?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          permission_slip_id?: string
          parent_id?: string | null
          amount_cents?: number
          stripe_payment_intent_id?: string | null
          stripe_charge_id?: string | null
          stripe_fee_cents?: number | null
          status?: string
          payment_method?: string | null
          error_message?: string | null
          is_split_payment?: boolean
          split_payment_group_id?: string | null
          paid_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_permission_slip_id_fkey"
            columns: ["permission_slip_id"]
            isOneToOne: false
            referencedRelation: "permission_slips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          }
        ]
      }
      permission_slips: {
        Row: {
          id: string
          trip_id: string
          student_id: string
          magic_link_token: string | null
          token_expires_at: string | null
          status: string
          form_data: Json
          signature_data: string | null
          signed_at: string | null
          signed_by_parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          student_id: string
          magic_link_token?: string | null
          token_expires_at?: string | null
          status?: string
          form_data?: Json
          signature_data?: string | null
          signed_at?: string | null
          signed_by_parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          student_id?: string
          magic_link_token?: string | null
          token_expires_at?: string | null
          status?: string
          form_data?: Json
          signature_data?: string | null
          signed_at?: string | null
          signed_by_parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_slips_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_slips_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "permission_slips_signed_by_parent_id_fkey"
            columns: ["signed_by_parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          }
        ]
      }
      pricing_tiers: {
        Row: {
          id: string
          experience_id: string
          min_students: number
          max_students: number
          price_cents: number
          free_chaperones: number
          created_at: string
        }
        Insert: {
          id?: string
          experience_id: string
          min_students: number
          max_students: number
          price_cents: number
          free_chaperones?: number
          created_at?: string
        }
        Update: {
          id?: string
          experience_id?: string
          min_students?: number
          max_students?: number
          price_cents?: number
          free_chaperones?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_tiers_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          }
        ]
      }
      refunds: {
        Row: {
          id: string
          payment_id: string
          amount_cents: number
          stripe_refund_id: string | null
          reason: string | null
          status: string
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          payment_id: string
          amount_cents: number
          stripe_refund_id?: string | null
          reason?: string | null
          status?: string
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          payment_id?: string
          amount_cents?: number
          stripe_refund_id?: string | null
          reason?: string | null
          status?: string
          processed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          }
        ]
      }
      rosters: {
        Row: {
          id: string
          teacher_id: string
          name: string
          grade_level: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          teacher_id: string
          name: string
          grade_level?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          teacher_id?: string
          name?: string
          grade_level?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rosters_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          }
        ]
      }
      schools: {
        Row: {
          id: string
          district_id: string | null
          name: string
          code: string | null
          address: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          district_id?: string | null
          name: string
          code?: string | null
          address?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          district_id?: string | null
          name?: string
          code?: string | null
          address?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          }
        ]
      }
      students: {
        Row: {
          id: string
          roster_id: string
          first_name: string
          last_name: string
          grade: string | null
          date_of_birth: string | null
          medical_info: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          roster_id: string
          first_name: string
          last_name: string
          grade?: string | null
          date_of_birth?: string | null
          medical_info?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          roster_id?: string
          first_name?: string
          last_name?: string
          grade?: string | null
          date_of_birth?: string | null
          medical_info?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          }
        ]
      }
      student_parents: {
        Row: {
          student_id: string
          parent_id: string
          relationship: string
          primary_contact: boolean
          created_at: string
        }
        Insert: {
          student_id: string
          parent_id: string
          relationship: string
          primary_contact?: boolean
          created_at?: string
        }
        Update: {
          student_id?: string
          parent_id?: string
          relationship?: string
          primary_contact?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          }
        ]
      }
      teachers: {
        Row: {
          id: string
          user_id: string | null
          school_id: string | null
          first_name: string
          last_name: string
          email: string
          phone: string | null
          independent: boolean
          can_create_trips: boolean
          can_manage_students: boolean
          department: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          school_id?: string | null
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          independent?: boolean
          can_create_trips?: boolean
          can_manage_students?: boolean
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          school_id?: string | null
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          independent?: boolean
          can_create_trips?: boolean
          can_manage_students?: boolean
          department?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          }
        ]
      }
      trips: {
        Row: {
          id: string
          experience_id: string
          teacher_id: string
          trip_date: string
          trip_time: string | null
          student_count: number
          status: string
          direct_link_token: string | null
          transportation: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          experience_id: string
          teacher_id: string
          trip_date: string
          trip_time?: string | null
          student_count?: number
          status?: string
          direct_link_token?: string | null
          transportation?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          experience_id?: string
          teacher_id?: string
          trip_date?: string
          trip_time?: string | null
          student_count?: number
          status?: string
          direct_link_token?: string | null
          transportation?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          }
        ]
      }
      trip_approvals: {
        Row: {
          id: string
          trip_id: string
          administrator_id: string
          administrator_name: string
          decision: string
          comments: string | null
          reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          administrator_id: string
          administrator_name: string
          decision: string
          comments?: string | null
          reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          administrator_id?: string
          administrator_name?: string
          decision?: string
          comments?: string | null
          reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_approvals_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          }
        ]
      }
      venues: {
        Row: {
          id: string
          name: string
          description: string | null
          address: Json | null
          contact_email: string
          contact_phone: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          address?: Json | null
          contact_email: string
          contact_phone?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          address?: Json | null
          contact_email?: string
          contact_phone?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      venue_users: {
        Row: {
          id: string
          venue_id: string
          user_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          venue_id: string
          user_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          venue_id?: string
          user_id?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_users_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never
