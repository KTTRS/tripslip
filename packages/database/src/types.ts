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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      active_role_context: {
        Row: {
          active_role_assignment_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_role_assignment_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_role_assignment_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "active_role_context_active_role_assignment_id_fkey"
            columns: ["active_role_assignment_id"]
            isOneToOne: false
            referencedRelation: "user_role_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_chain_steps: {
        Row: {
          approver_name: string | null
          approver_user_id: string | null
          can_delegate: boolean
          chain_id: string
          created_at: string
          delegated_at: string | null
          delegated_to: string | null
          delegation_reason: string | null
          id: string
          role_required: string
          step_order: number
        }
        Insert: {
          approver_name?: string | null
          approver_user_id?: string | null
          can_delegate?: boolean
          chain_id: string
          created_at?: string
          delegated_at?: string | null
          delegated_to?: string | null
          delegation_reason?: string | null
          id?: string
          role_required: string
          step_order: number
        }
        Update: {
          approver_name?: string | null
          approver_user_id?: string | null
          can_delegate?: boolean
          chain_id?: string
          created_at?: string
          delegated_at?: string | null
          delegated_to?: string | null
          delegation_reason?: string | null
          id?: string
          role_required?: string
          step_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_chain_steps_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "approval_chains"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_chains: {
        Row: {
          active: boolean
          approval_type: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          max_cost_cents: number | null
          min_cost_cents: number | null
          min_duration_days: number | null
          name: string
          priority: number
          requires_international: boolean | null
          requires_out_of_state: boolean | null
          requires_overnight: boolean | null
          school_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          approval_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_cost_cents?: number | null
          min_cost_cents?: number | null
          min_duration_days?: number | null
          name: string
          priority?: number
          requires_international?: boolean | null
          requires_out_of_state?: boolean | null
          requires_overnight?: boolean | null
          school_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          approval_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          max_cost_cents?: number | null
          min_cost_cents?: number | null
          min_duration_days?: number | null
          name?: string
          priority?: number
          requires_international?: boolean | null
          requires_out_of_state?: boolean | null
          requires_overnight?: boolean | null
          school_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_chains_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_conversations: {
        Row: {
          approval_id: string | null
          created_at: string
          id: string
          message: string
          message_type: string
          parent_message_id: string | null
          sender_id: string
          sender_name: string
          sender_role: string
          trip_id: string
        }
        Insert: {
          approval_id?: string | null
          created_at?: string
          id?: string
          message: string
          message_type?: string
          parent_message_id?: string | null
          sender_id: string
          sender_name: string
          sender_role: string
          trip_id: string
        }
        Update: {
          approval_id?: string | null
          created_at?: string
          id?: string
          message?: string
          message_type?: string
          parent_message_id?: string | null
          sender_id?: string
          sender_name?: string
          sender_role?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_conversations_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "trip_approvals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_conversations_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "approval_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_conversations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_delegations: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          delegated_from: string
          delegated_to: string
          end_date: string | null
          id: string
          reason: string | null
          start_date: string
          step_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          delegated_from: string
          delegated_to: string
          end_date?: string | null
          id?: string
          reason?: string | null
          start_date?: string
          step_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          delegated_from?: string
          delegated_to?: string
          end_date?: string | null
          id?: string
          reason?: string | null
          start_date?: string
          step_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_delegations_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "approval_chain_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          id: string
          notes: string | null
          present: boolean
          recorded_at: string
          recorded_by: string
          student_id: string
          trip_id: string
        }
        Insert: {
          id?: string
          notes?: string | null
          present: boolean
          recorded_at?: string
          recorded_by: string
          student_id: string
          trip_id: string
        }
        Update: {
          id?: string
          notes?: string | null
          present?: boolean
          recorded_at?: string
          recorded_by?: string
          student_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "teachers"
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
            foreignKeyName: "attendance_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          after_state: Json | null
          before_state: Json | null
          created_at: string
          id: string
          ip_address: unknown
          record_id: string
          table_name: string
          user_agent: string | null
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          action: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          record_id: string
          table_name: string
          user_agent?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          action?: string
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string
          id?: string
          ip_address?: unknown
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      availability: {
        Row: {
          available_date: string
          booked_count: number
          capacity: number
          created_at: string
          end_time: string | null
          experience_id: string
          id: string
          start_time: string | null
        }
        Insert: {
          available_date: string
          booked_count?: number
          capacity: number
          created_at?: string
          end_time?: string | null
          experience_id: string
          id?: string
          start_time?: string | null
        }
        Update: {
          available_date?: string
          booked_count?: number
          capacity?: number
          created_at?: string
          end_time?: string | null
          experience_id?: string
          id?: string
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_messages: {
        Row: {
          attachment_name: string | null
          attachment_size_bytes: number | null
          attachment_url: string | null
          booking_id: string
          created_at: string
          id: string
          message: string
          parent_message_id: string | null
          read_at: string | null
          read_by: string | null
          sender_id: string
          sender_name: string
          sender_role: string
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size_bytes?: number | null
          attachment_url?: string | null
          booking_id: string
          created_at?: string
          id?: string
          message: string
          parent_message_id?: string | null
          read_at?: string | null
          read_by?: string | null
          sender_id: string
          sender_name: string
          sender_role: string
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size_bytes?: number | null
          attachment_url?: string | null
          booking_id?: string
          created_at?: string
          id?: string
          message?: string
          parent_message_id?: string | null
          read_at?: string | null
          read_by?: string | null
          sender_id?: string
          sender_name?: string
          sender_role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "venue_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "booking_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      chaperones: {
        Row: {
          accepted_at: string | null
          background_check_verified: boolean
          id: string
          invited_at: string
          parent_id: string
          status: string
          trip_id: string
        }
        Insert: {
          accepted_at?: string | null
          background_check_verified?: boolean
          id?: string
          invited_at?: string
          parent_id: string
          status?: string
          trip_id: string
        }
        Update: {
          accepted_at?: string | null
          background_check_verified?: boolean
          id?: string
          invited_at?: string
          parent_id?: string
          status?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chaperones_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chaperones_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sharing_consents: {
        Row: {
          booking_id: string
          consented_at: string
          created_at: string
          id: string
          parent_id: string
          revoked_at: string | null
          share_basic_info: boolean
          share_contact_info: boolean
          share_emergency_info: boolean
          share_medical_info: boolean
          student_id: string
          updated_at: string
        }
        Insert: {
          booking_id: string
          consented_at?: string
          created_at?: string
          id?: string
          parent_id: string
          revoked_at?: string | null
          share_basic_info?: boolean
          share_contact_info?: boolean
          share_emergency_info?: boolean
          share_medical_info?: boolean
          student_id: string
          updated_at?: string
        }
        Update: {
          booking_id?: string
          consented_at?: string
          created_at?: string
          id?: string
          parent_id?: string
          revoked_at?: string | null
          share_basic_info?: boolean
          share_contact_info?: boolean
          share_emergency_info?: boolean
          share_medical_info?: boolean
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sharing_consents_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "venue_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_sharing_consents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_sharing_consents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          address: Json | null
          code: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: Json | null
          code?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: Json | null
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          document_type: string
          encrypted: boolean
          id: string
          permission_slip_id: string
          storage_path: string
        }
        Insert: {
          created_at?: string
          document_type: string
          encrypted?: boolean
          id?: string
          permission_slip_id: string
          storage_path: string
        }
        Update: {
          created_at?: string
          document_type?: string
          encrypted?: boolean
          id?: string
          permission_slip_id?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_permission_slip_id_fkey"
            columns: ["permission_slip_id"]
            isOneToOne: false
            referencedRelation: "permission_slips"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          sent_at: string
          status: string
          template_id: string
          to_email: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status: string
          template_id: string
          to_email: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          sent_at?: string
          status?: string
          template_id?: string
          to_email?: string
        }
        Relationships: []
      }
      experience_forms: {
        Row: {
          experience_id: string
          form_id: string
          required: boolean
        }
        Insert: {
          experience_id: string
          form_id: string
          required?: boolean
        }
        Update: {
          experience_id?: string
          form_id?: string
          required?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "experience_forms_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_forms_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "venue_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          active: boolean
          cancellation_policy: Json | null
          capacity: number
          created_at: string
          description: string | null
          duration_minutes: number
          educational_objectives: string[] | null
          educational_standards: Json | null
          grade_levels: string[] | null
          id: string
          max_students: number | null
          min_students: number | null
          published: boolean
          recommended_age_max: number | null
          recommended_age_min: number | null
          special_requirements: string | null
          subjects: string[] | null
          title: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          active?: boolean
          cancellation_policy?: Json | null
          capacity: number
          created_at?: string
          description?: string | null
          duration_minutes: number
          educational_objectives?: string[] | null
          educational_standards?: Json | null
          grade_levels?: string[] | null
          id?: string
          max_students?: number | null
          min_students?: number | null
          published?: boolean
          recommended_age_max?: number | null
          recommended_age_min?: number | null
          special_requirements?: string | null
          subjects?: string[] | null
          title: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          active?: boolean
          cancellation_policy?: Json | null
          capacity?: number
          created_at?: string
          description?: string | null
          duration_minutes?: number
          educational_objectives?: string[] | null
          educational_standards?: Json | null
          grade_levels?: string[] | null
          id?: string
          max_students?: number | null
          min_students?: number | null
          published?: boolean
          recommended_age_max?: number | null
          recommended_age_min?: number | null
          special_requirements?: string | null
          subjects?: string[] | null
          title?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiences_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue_analytics_summary"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "experiences_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      message_notifications: {
        Row: {
          created_at: string
          delivery_status: string | null
          error_message: string | null
          id: string
          message_id: string
          recipient_email: string
          recipient_id: string
          sent_at: string | null
        }
        Insert: {
          created_at?: string
          delivery_status?: string | null
          error_message?: string | null
          id?: string
          message_id: string
          recipient_email: string
          recipient_id: string
          sent_at?: string | null
        }
        Update: {
          created_at?: string
          delivery_status?: string | null
          error_message?: string | null
          id?: string
          message_id?: string
          recipient_email?: string
          recipient_id?: string
          sent_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_notifications_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "booking_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          preferences: Json | null
          sms_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          preferences?: Json | null
          sms_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          preferences?: Json | null
          sms_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          channel: string
          created_at: string
          id: string
          is_critical: boolean
          metadata: Json | null
          read_at: string | null
          sent_at: string | null
          status: string
          subject: string
          user_id: string
          user_type: string
        }
        Insert: {
          body: string
          channel: string
          created_at?: string
          id?: string
          is_critical?: boolean
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          user_id: string
          user_type: string
        }
        Update: {
          body?: string
          channel?: string
          created_at?: string
          id?: string
          is_critical?: boolean
          metadata?: Json | null
          read_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          user_id?: string
          user_type?: string
        }
        Relationships: []
      }
      parents: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          language: string | null
          last_name: string
          phone: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          language?: string | null
          last_name: string
          phone: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          language?: string | null
          last_name?: string
          phone?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          error_message: string | null
          id: string
          is_split_payment: boolean
          paid_at: string | null
          parent_id: string | null
          payment_method: string | null
          permission_slip_id: string
          split_payment_group_id: string | null
          status: string
          stripe_charge_id: string | null
          stripe_fee_cents: number | null
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          error_message?: string | null
          id?: string
          is_split_payment?: boolean
          paid_at?: string | null
          parent_id?: string | null
          payment_method?: string | null
          permission_slip_id: string
          split_payment_group_id?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_fee_cents?: number | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          error_message?: string | null
          id?: string
          is_split_payment?: boolean
          paid_at?: string | null
          parent_id?: string | null
          payment_method?: string | null
          permission_slip_id?: string
          split_payment_group_id?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_fee_cents?: number | null
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_permission_slip_id_fkey"
            columns: ["permission_slip_id"]
            isOneToOne: false
            referencedRelation: "permission_slips"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_slips: {
        Row: {
          created_at: string
          form_data: Json | null
          id: string
          magic_link_token: string | null
          signature_data: string | null
          signed_at: string | null
          signed_by_parent_id: string | null
          status: string
          student_id: string
          token_expires_at: string | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          form_data?: Json | null
          id?: string
          magic_link_token?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by_parent_id?: string | null
          status?: string
          student_id: string
          token_expires_at?: string | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          form_data?: Json | null
          id?: string
          magic_link_token?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signed_by_parent_id?: string | null
          status?: string
          student_id?: string
          token_expires_at?: string | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "permission_slips_signed_by_parent_id_fkey"
            columns: ["signed_by_parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
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
            foreignKeyName: "permission_slips_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_tiers: {
        Row: {
          additional_fees: Json | null
          created_at: string
          experience_id: string
          free_chaperones: number | null
          id: string
          max_students: number
          min_students: number
          price_cents: number
        }
        Insert: {
          additional_fees?: Json | null
          created_at?: string
          experience_id: string
          free_chaperones?: number | null
          id?: string
          max_students: number
          min_students: number
          price_cents: number
        }
        Update: {
          additional_fees?: Json | null
          created_at?: string
          experience_id?: string
          free_chaperones?: number | null
          id?: string
          max_students?: number
          min_students?: number
          price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "pricing_tiers_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          created_at: string
          id: string
          identifier: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          payment_id: string
          processed_at: string | null
          reason: string | null
          status: string
          stripe_refund_id: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          payment_id: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          stripe_refund_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          payment_id?: string
          processed_at?: string | null
          reason?: string | null
          status?: string
          stripe_refund_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      rosters: {
        Row: {
          created_at: string
          grade_level: string | null
          id: string
          name: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          grade_level?: string | null
          id?: string
          name: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          grade_level?: string | null
          id?: string
          name?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rosters_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      school_districts: {
        Row: {
          created_at: string
          district_id: string
          id: string
          is_primary: boolean
          school_id: string
        }
        Insert: {
          created_at?: string
          district_id: string
          id?: string
          is_primary?: boolean
          school_id: string
        }
        Update: {
          created_at?: string
          district_id?: string
          id?: string
          is_primary?: boolean
          school_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "school_districts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "school_districts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          address: Json | null
          code: string | null
          created_at: string
          district_id: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          address?: Json | null
          code?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          address?: Json | null
          code?: string | null
          created_at?: string
          district_id?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_preview: string | null
          sent_at: string
          status: string
          to_phone: string
          twilio_message_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_preview?: string | null
          sent_at?: string
          status: string
          to_phone: string
          twilio_message_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_preview?: string | null
          sent_at?: string
          status?: string
          to_phone?: string
          twilio_message_id?: string | null
        }
        Relationships: []
      }
      spatial_ref_sys: {
        Row: {
          auth_name: string | null
          auth_srid: number | null
          proj4text: string | null
          srid: number
          srtext: string | null
        }
        Insert: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid: number
          srtext?: string | null
        }
        Update: {
          auth_name?: string | null
          auth_srid?: number | null
          proj4text?: string | null
          srid?: number
          srtext?: string | null
        }
        Relationships: []
      }
      student_parents: {
        Row: {
          created_at: string
          parent_id: string
          primary_contact: boolean
          relationship: string
          student_id: string
        }
        Insert: {
          created_at?: string
          parent_id: string
          primary_contact?: boolean
          relationship: string
          student_id: string
        }
        Update: {
          created_at?: string
          parent_id?: string
          primary_contact?: boolean
          relationship?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_parents_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "parents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_parents_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          created_at: string
          date_of_birth: string | null
          first_name: string
          grade: string | null
          id: string
          last_name: string
          medical_info: Json | null
          roster_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_of_birth?: string | null
          first_name: string
          grade?: string | null
          id?: string
          last_name: string
          medical_info?: Json | null
          roster_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string | null
          first_name?: string
          grade?: string | null
          id?: string
          last_name?: string
          medical_info?: Json | null
          roster_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "students_roster_id_fkey"
            columns: ["roster_id"]
            isOneToOne: false
            referencedRelation: "rosters"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          can_create_trips: boolean
          can_manage_students: boolean
          created_at: string
          department: string | null
          email: string
          first_name: string
          id: string
          independent: boolean
          last_name: string
          phone: string | null
          school_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          can_create_trips?: boolean
          can_manage_students?: boolean
          created_at?: string
          department?: string | null
          email: string
          first_name: string
          id?: string
          independent?: boolean
          last_name: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          can_create_trips?: boolean
          can_manage_students?: boolean
          created_at?: string
          department?: string | null
          email?: string
          first_name?: string
          id?: string
          independent?: boolean
          last_name?: string
          phone?: string | null
          school_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_approval_routing: {
        Row: {
          chain_id: string
          completed_at: string | null
          created_at: string
          current_step_order: number | null
          duration_days: number | null
          id: string
          is_international: boolean | null
          is_out_of_state: boolean | null
          is_overnight: boolean | null
          routed_at: string
          routing_status: string
          trip_cost_cents: number | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          chain_id: string
          completed_at?: string | null
          created_at?: string
          current_step_order?: number | null
          duration_days?: number | null
          id?: string
          is_international?: boolean | null
          is_out_of_state?: boolean | null
          is_overnight?: boolean | null
          routed_at?: string
          routing_status?: string
          trip_cost_cents?: number | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          chain_id?: string
          completed_at?: string | null
          created_at?: string
          current_step_order?: number | null
          duration_days?: number | null
          id?: string
          is_international?: boolean | null
          is_out_of_state?: boolean | null
          is_overnight?: boolean | null
          routed_at?: string
          routing_status?: string
          trip_cost_cents?: number | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_approval_routing_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "approval_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_approval_routing_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: true
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_approvals: {
        Row: {
          administrator_id: string | null
          administrator_name: string
          chain_id: string | null
          changes_requested: string | null
          comments: string | null
          created_at: string
          deadline: string | null
          decision: string | null
          delegated_from: string | null
          id: string
          notification_sent: boolean
          reason: string | null
          reminder_sent_at: string | null
          response_at: string | null
          reviewed_at: string | null
          status: string
          step_id: string | null
          step_order: number | null
          teacher_response: string | null
          trip_id: string
        }
        Insert: {
          administrator_id?: string | null
          administrator_name: string
          chain_id?: string | null
          changes_requested?: string | null
          comments?: string | null
          created_at?: string
          deadline?: string | null
          decision?: string | null
          delegated_from?: string | null
          id?: string
          notification_sent?: boolean
          reason?: string | null
          reminder_sent_at?: string | null
          response_at?: string | null
          reviewed_at?: string | null
          status?: string
          step_id?: string | null
          step_order?: number | null
          teacher_response?: string | null
          trip_id: string
        }
        Update: {
          administrator_id?: string | null
          administrator_name?: string
          chain_id?: string | null
          changes_requested?: string | null
          comments?: string | null
          created_at?: string
          deadline?: string | null
          decision?: string | null
          delegated_from?: string | null
          id?: string
          notification_sent?: boolean
          reason?: string | null
          reminder_sent_at?: string | null
          response_at?: string | null
          reviewed_at?: string | null
          status?: string
          step_id?: string | null
          step_order?: number | null
          teacher_response?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_approvals_chain_id_fkey"
            columns: ["chain_id"]
            isOneToOne: false
            referencedRelation: "approval_chains"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_approvals_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "approval_chain_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_approvals_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string
          direct_link_token: string | null
          experience_id: string
          id: string
          special_requirements: string | null
          status: string
          student_count: number
          teacher_id: string
          transportation: Json | null
          trip_date: string
          trip_time: string | null
          updated_at: string
          venue_booking_id: string | null
        }
        Insert: {
          created_at?: string
          direct_link_token?: string | null
          experience_id: string
          id?: string
          special_requirements?: string | null
          status?: string
          student_count?: number
          teacher_id: string
          transportation?: Json | null
          trip_date: string
          trip_time?: string | null
          updated_at?: string
          venue_booking_id?: string | null
        }
        Update: {
          created_at?: string
          direct_link_token?: string | null
          experience_id?: string
          id?: string
          special_requirements?: string | null
          status?: string
          student_count?: number
          teacher_id?: string
          transportation?: Json | null
          trip_date?: string
          trip_time?: string | null
          updated_at?: string
          venue_booking_id?: string | null
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
          },
        ]
      }
      user_role_assignments: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          organization_id: string
          organization_type: string
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id: string
          organization_type: string
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          organization_id?: string
          organization_type?: string
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_role_assignments_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "user_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      venue_bookings: {
        Row: {
          cancelled_at: string | null
          chaperone_count: number
          completed_at: string | null
          confirmation_number: string
          confirmed_at: string | null
          created_at: string
          deposit_cents: number | null
          end_time: string
          experience_id: string
          id: string
          internal_notes: string | null
          paid_cents: number
          quoted_price_cents: number
          requested_at: string
          scheduled_date: string
          special_requirements: string | null
          start_time: string
          status: string
          student_count: number
          trip_id: string
          updated_at: string
          venue_id: string
          venue_notes: string | null
        }
        Insert: {
          cancelled_at?: string | null
          chaperone_count?: number
          completed_at?: string | null
          confirmation_number: string
          confirmed_at?: string | null
          created_at?: string
          deposit_cents?: number | null
          end_time: string
          experience_id: string
          id?: string
          internal_notes?: string | null
          paid_cents?: number
          quoted_price_cents: number
          requested_at?: string
          scheduled_date: string
          special_requirements?: string | null
          start_time: string
          status?: string
          student_count: number
          trip_id: string
          updated_at?: string
          venue_id: string
          venue_notes?: string | null
        }
        Update: {
          cancelled_at?: string | null
          chaperone_count?: number
          completed_at?: string | null
          confirmation_number?: string
          confirmed_at?: string | null
          created_at?: string
          deposit_cents?: number | null
          end_time?: string
          experience_id?: string
          id?: string
          internal_notes?: string | null
          paid_cents?: number
          quoted_price_cents?: number
          requested_at?: string
          scheduled_date?: string
          special_requirements?: string | null
          start_time?: string
          status?: string
          student_count?: number
          trip_id?: string
          updated_at?: string
          venue_id?: string
          venue_notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue_analytics_summary"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "venue_bookings_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number
          id: string
          name: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          name?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "venue_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_category_assignments: {
        Row: {
          assigned_at: string
          category_id: string
          venue_id: string
        }
        Insert: {
          assigned_at?: string
          category_id: string
          venue_id: string
        }
        Update: {
          assigned_at?: string
          category_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_category_assignments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "venue_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_category_assignments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue_analytics_summary"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "venue_category_assignments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_claim_requests: {
        Row: {
          business_email: string
          created_at: string
          email_verification_sent_at: string | null
          email_verification_token: string | null
          email_verified: boolean
          id: string
          proof_document_url: string | null
          proof_type: string
          rejection_reason: string | null
          requester_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          venue_id: string
        }
        Insert: {
          business_email: string
          created_at?: string
          email_verification_sent_at?: string | null
          email_verification_token?: string | null
          email_verified?: boolean
          id?: string
          proof_document_url?: string | null
          proof_type: string
          rejection_reason?: string | null
          requester_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          venue_id: string
        }
        Update: {
          business_email?: string
          created_at?: string
          email_verification_sent_at?: string | null
          email_verification_token?: string | null
          email_verified?: boolean
          id?: string
          proof_document_url?: string | null
          proof_type?: string
          rejection_reason?: string | null
          requester_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_claim_requests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue_analytics_summary"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "venue_claim_requests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_forms: {
        Row: {
          category: string
          file_size_bytes: number | null
          file_url: string
          id: string
          name: string
          required: boolean
          uploaded_at: string
          uploaded_by: string | null
          venue_id: string
          version: number
        }
        Insert: {
          category: string
          file_size_bytes?: number | null
          file_url: string
          id?: string
          name: string
          required?: boolean
          uploaded_at?: string
          uploaded_by?: string | null
          venue_id: string
          version?: number
        }
        Update: {
          category?: string
          file_size_bytes?: number | null
          file_url?: string
          id?: string
          name?: string
          required?: boolean
          uploaded_at?: string
          uploaded_by?: string | null
          venue_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "venue_forms_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue_analytics_summary"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "venue_forms_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_photos: {
        Row: {
          caption: string | null
          display_order: number
          id: string
          uploaded_at: string
          uploaded_by: string | null
          url: string
          venue_id: string
        }
        Insert: {
          caption?: string | null
          display_order?: number
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
          url: string
          venue_id: string
        }
        Update: {
          caption?: string | null
          display_order?: number
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
          url?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_photos_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue_analytics_summary"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "venue_photos_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_reviews: {
        Row: {
          admin_notes: string | null
          created_at: string
          educational_value_rating: number | null
          facilities_rating: number | null
          feedback_text: string | null
          flag_reason: string | null
          flagged: boolean
          id: string
          overall_rating: number
          photos: string[] | null
          reviewed_by_admin: boolean
          staff_quality_rating: number | null
          trip_id: string
          updated_at: string
          user_id: string
          value_rating: number | null
          venue_id: string
          venue_response: string | null
          venue_response_at: string | null
          venue_response_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          educational_value_rating?: number | null
          facilities_rating?: number | null
          feedback_text?: string | null
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          overall_rating: number
          photos?: string[] | null
          reviewed_by_admin?: boolean
          staff_quality_rating?: number | null
          trip_id: string
          updated_at?: string
          user_id: string
          value_rating?: number | null
          venue_id: string
          venue_response?: string | null
          venue_response_at?: string | null
          venue_response_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          educational_value_rating?: number | null
          facilities_rating?: number | null
          feedback_text?: string | null
          flag_reason?: string | null
          flagged?: boolean
          id?: string
          overall_rating?: number
          photos?: string[] | null
          reviewed_by_admin?: boolean
          staff_quality_rating?: number | null
          trip_id?: string
          updated_at?: string
          user_id?: string
          value_rating?: number | null
          venue_id?: string
          venue_response?: string | null
          venue_response_at?: string | null
          venue_response_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "venue_reviews_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue_analytics_summary"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "venue_reviews_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_tag_assignments: {
        Row: {
          assigned_at: string
          tag_id: string
          venue_id: string
        }
        Insert: {
          assigned_at?: string
          tag_id: string
          venue_id: string
        }
        Update: {
          assigned_at?: string
          tag_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "venue_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venue_tag_assignments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue_analytics_summary"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "venue_tag_assignments_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_tags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      venue_users: {
        Row: {
          accepted_at: string | null
          created_at: string
          deactivated_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          role: string
          user_id: string
          venue_id: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          user_id: string
          venue_id: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          deactivated_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string
          user_id?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_users_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue_analytics_summary"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "venue_users_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venue_videos: {
        Row: {
          id: string
          title: string | null
          type: string
          uploaded_at: string
          uploaded_by: string | null
          url: string
          venue_id: string
        }
        Insert: {
          id?: string
          title?: string | null
          type: string
          uploaded_at?: string
          uploaded_by?: string | null
          url: string
          venue_id: string
        }
        Update: {
          id?: string
          title?: string | null
          type?: string
          uploaded_at?: string
          uploaded_by?: string | null
          url?: string
          venue_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venue_videos_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venue_analytics_summary"
            referencedColumns: ["venue_id"]
          },
          {
            foreignKeyName: "venue_videos_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      venues: {
        Row: {
          accessibility_features: Json | null
          address: Json | null
          booking_lead_time_days: number | null
          capacity_max: number | null
          capacity_min: number | null
          claimed: boolean
          claimed_at: string | null
          claimed_by: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          location: unknown
          name: string
          operating_hours: Json | null
          primary_photo_url: string | null
          profile_completeness: number | null
          rating: number | null
          review_count: number | null
          seasonal_availability: Json | null
          settings: Json | null
          supported_age_groups: string[] | null
          updated_at: string
          verified: boolean | null
          verified_at: string | null
          virtual_tour_url: string | null
          website: string | null
        }
        Insert: {
          accessibility_features?: Json | null
          address?: Json | null
          booking_lead_time_days?: number | null
          capacity_max?: number | null
          capacity_min?: number | null
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: unknown
          name: string
          operating_hours?: Json | null
          primary_photo_url?: string | null
          profile_completeness?: number | null
          rating?: number | null
          review_count?: number | null
          seasonal_availability?: Json | null
          settings?: Json | null
          supported_age_groups?: string[] | null
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          virtual_tour_url?: string | null
          website?: string | null
        }
        Update: {
          accessibility_features?: Json | null
          address?: Json | null
          booking_lead_time_days?: number | null
          capacity_max?: number | null
          capacity_min?: number | null
          claimed?: boolean
          claimed_at?: string | null
          claimed_by?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          location?: unknown
          name?: string
          operating_hours?: Json | null
          primary_photo_url?: string | null
          profile_completeness?: number | null
          rating?: number | null
          review_count?: number | null
          seasonal_availability?: Json | null
          settings?: Json | null
          supported_age_groups?: string[] | null
          updated_at?: string
          verified?: boolean | null
          verified_at?: string | null
          virtual_tour_url?: string | null
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      geography_columns: {
        Row: {
          coord_dimension: number | null
          f_geography_column: unknown
          f_table_catalog: unknown
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Relationships: []
      }
      geometry_columns: {
        Row: {
          coord_dimension: number | null
          f_geometry_column: unknown
          f_table_catalog: string | null
          f_table_name: unknown
          f_table_schema: unknown
          srid: number | null
          type: string | null
        }
        Insert: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Update: {
          coord_dimension?: number | null
          f_geometry_column?: unknown
          f_table_catalog?: string | null
          f_table_name?: unknown
          f_table_schema?: unknown
          srid?: number | null
          type?: string | null
        }
        Relationships: []
      }
      venue_analytics_summary: {
        Row: {
          avg_group_size: number | null
          cancelled_bookings: number | null
          completed_bookings: number | null
          conversion_rate_percent: number | null
          current_rating: number | null
          profile_views: number | null
          review_count: number | null
          total_bookings: number | null
          total_revenue_cents: number | null
          venue_id: string | null
          venue_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      _postgis_deprecate: {
        Args: { newname: string; oldname: string; version: string }
        Returns: undefined
      }
      _postgis_index_extent: {
        Args: { col: string; tbl: unknown }
        Returns: unknown
      }
      _postgis_pgsql_version: { Args: never; Returns: string }
      _postgis_scripts_pgsql_version: { Args: never; Returns: string }
      _postgis_selectivity: {
        Args: { att_name: string; geom: unknown; mode?: string; tbl: unknown }
        Returns: number
      }
      _postgis_stats: {
        Args: { ""?: string; att_name: string; tbl: unknown }
        Returns: string
      }
      _st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_crosses: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      _st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      _st_intersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      _st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      _st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      _st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_sortablehash: { Args: { geom: unknown }; Returns: number }
      _st_touches: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      _st_voronoi: {
        Args: {
          clip?: unknown
          g1: unknown
          return_polygons?: boolean
          tolerance?: number
        }
        Returns: unknown
      }
      _st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      addauth: { Args: { "": string }; Returns: boolean }
      addgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              new_dim: number
              new_srid_in: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              schema_name: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              new_dim: number
              new_srid: number
              new_type: string
              table_name: string
              use_typmod?: boolean
            }
            Returns: string
          }
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      count_venues_in_category: {
        Args: { category_id: string }
        Returns: number
      }
      create_notification: {
        Args: {
          p_body: string
          p_channel: string
          p_is_critical?: boolean
          p_metadata?: Json
          p_subject: string
          p_user_id: string
          p_user_type: string
        }
        Returns: string
      }
      create_trip_approvals_from_chain: {
        Args: { p_chain_id: string; p_trip_id: string }
        Returns: undefined
      }
      disablelongtransactions: { Args: never; Returns: string }
      dropgeometrycolumn:
        | {
            Args: {
              catalog_name: string
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | {
            Args: {
              column_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { column_name: string; table_name: string }; Returns: string }
      dropgeometrytable:
        | {
            Args: {
              catalog_name: string
              schema_name: string
              table_name: string
            }
            Returns: string
          }
        | { Args: { schema_name: string; table_name: string }; Returns: string }
        | { Args: { table_name: string }; Returns: string }
      enablelongtransactions: { Args: never; Returns: string }
      equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      generate_booking_confirmation_number: { Args: never; Returns: string }
      generate_direct_link_token: { Args: never; Returns: string }
      generate_magic_link_token: {
        Args: never
        Returns: {
          expires_at: string
          token: string
        }[]
      }
      generate_secure_token: { Args: { length?: number }; Returns: string }
      geometry: { Args: { "": string }; Returns: unknown }
      geometry_above: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_below: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_cmp: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_contained_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_contains_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_distance_box: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_distance_centroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      geometry_eq: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_ge: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_gt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_le: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_left: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_lt: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overabove: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overbelow: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overlaps_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overleft: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_overright: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_right: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_same_3d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geometry_within: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      geomfromewkt: { Args: { "": string }; Returns: unknown }
      get_approval_chain_for_trip: {
        Args: {
          p_cost_cents: number
          p_duration_days: number
          p_is_international: boolean
          p_is_out_of_state: boolean
          p_is_overnight: boolean
          p_school_id: string
          p_trip_id: string
        }
        Returns: string
      }
      get_category_path: { Args: { category_id: string }; Returns: string }
      get_category_tree: {
        Args: { category_id: string }
        Returns: {
          id: string
          level: number
          name: string
          parent_id: string
        }[]
      }
      get_current_approver_for_trip: {
        Args: { p_trip_id: string }
        Returns: {
          administrator_id: string
          administrator_name: string
          approval_id: string
          deadline: string
          step_order: number
        }[]
      }
      get_payment_total_refunded: {
        Args: { payment_id: string }
        Returns: number
      }
      get_slip_total_paid: { Args: { slip_id: string }; Returns: number }
      get_unread_message_count: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: number
      }
      gettransactionid: { Args: never; Returns: unknown }
      has_role: { Args: { required_role: string }; Returns: boolean }
      is_split_payment_complete: {
        Args: { expected_total_cents: number; group_id: string }
        Returns: boolean
      }
      is_tripslip_admin: { Args: never; Returns: boolean }
      longtransactionsenabled: { Args: never; Returns: boolean }
      mark_booking_messages_read: {
        Args: { p_booking_id: string; p_user_id: string }
        Returns: number
      }
      mark_notification_read: {
        Args: { notification_id: string }
        Returns: undefined
      }
      populate_geometry_columns:
        | { Args: { tbl_oid: unknown; use_typmod?: boolean }; Returns: number }
        | { Args: { use_typmod?: boolean }; Returns: string }
      postgis_constraint_dims: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_srid: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: number
      }
      postgis_constraint_type: {
        Args: { geomcolumn: string; geomschema: string; geomtable: string }
        Returns: string
      }
      postgis_extensions_upgrade: { Args: never; Returns: string }
      postgis_full_version: { Args: never; Returns: string }
      postgis_geos_version: { Args: never; Returns: string }
      postgis_lib_build_date: { Args: never; Returns: string }
      postgis_lib_revision: { Args: never; Returns: string }
      postgis_lib_version: { Args: never; Returns: string }
      postgis_libjson_version: { Args: never; Returns: string }
      postgis_liblwgeom_version: { Args: never; Returns: string }
      postgis_libprotobuf_version: { Args: never; Returns: string }
      postgis_libxml_version: { Args: never; Returns: string }
      postgis_proj_version: { Args: never; Returns: string }
      postgis_scripts_build_date: { Args: never; Returns: string }
      postgis_scripts_installed: { Args: never; Returns: string }
      postgis_scripts_released: { Args: never; Returns: string }
      postgis_svn_version: { Args: never; Returns: string }
      postgis_type_name: {
        Args: {
          coord_dimension: number
          geomname: string
          use_new_name?: boolean
        }
        Returns: string
      }
      postgis_version: { Args: never; Returns: string }
      postgis_wagyu_version: { Args: never; Returns: string }
      refresh_venue_analytics: { Args: never; Returns: undefined }
      search_venues: {
        Args: {
          center_lat?: number
          center_lng?: number
          max_capacity?: number
          max_results?: number
          min_capacity?: number
          radius_miles?: number
          search_text?: string
          verified_only?: boolean
        }
        Returns: {
          claimed: boolean
          description: string
          distance_miles: number
          id: string
          name: string
          primary_photo_url: string
          rating: number
          review_count: number
          text_rank: number
          verified: boolean
        }[]
      }
      search_venues_by_text: {
        Args: { max_results?: number; search_query: string }
        Returns: {
          description: string
          id: string
          name: string
          rank: number
        }[]
      }
      st_3dclosestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3ddistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dintersects: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_3dlongestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmakebox: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_3dmaxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_3dshortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_addpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_angle:
        | { Args: { line1: unknown; line2: unknown }; Returns: number }
        | {
            Args: { pt1: unknown; pt2: unknown; pt3: unknown; pt4?: unknown }
            Returns: number
          }
      st_area:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_asencodedpolyline: {
        Args: { geom: unknown; nprecision?: number }
        Returns: string
      }
      st_asewkt: { Args: { "": string }; Returns: string }
      st_asgeojson:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | {
            Args: {
              geom_column?: string
              maxdecimaldigits?: number
              pretty_bool?: boolean
              r: Record<string, unknown>
            }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_asgml:
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
            }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
        | {
            Args: {
              geog: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown
              id?: string
              maxdecimaldigits?: number
              nprefix?: string
              options?: number
              version: number
            }
            Returns: string
          }
      st_askml:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; nprefix?: string }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_aslatlontext: {
        Args: { geom: unknown; tmpl?: string }
        Returns: string
      }
      st_asmarc21: { Args: { format?: string; geom: unknown }; Returns: string }
      st_asmvtgeom: {
        Args: {
          bounds: unknown
          buffer?: number
          clip_geom?: boolean
          extent?: number
          geom: unknown
        }
        Returns: unknown
      }
      st_assvg:
        | {
            Args: { geog: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | {
            Args: { geom: unknown; maxdecimaldigits?: number; rel?: number }
            Returns: string
          }
        | { Args: { "": string }; Returns: string }
      st_astext: { Args: { "": string }; Returns: string }
      st_astwkb:
        | {
            Args: {
              geom: unknown
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
        | {
            Args: {
              geom: unknown[]
              ids: number[]
              prec?: number
              prec_m?: number
              prec_z?: number
              with_boxes?: boolean
              with_sizes?: boolean
            }
            Returns: string
          }
      st_asx3d: {
        Args: { geom: unknown; maxdecimaldigits?: number; options?: number }
        Returns: string
      }
      st_azimuth:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: number }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_boundingdiagonal: {
        Args: { fits?: boolean; geom: unknown }
        Returns: unknown
      }
      st_buffer:
        | {
            Args: { geom: unknown; options?: string; radius: number }
            Returns: unknown
          }
        | {
            Args: { geom: unknown; quadsegs: number; radius: number }
            Returns: unknown
          }
      st_centroid: { Args: { "": string }; Returns: unknown }
      st_clipbybox2d: {
        Args: { box: unknown; geom: unknown }
        Returns: unknown
      }
      st_closestpoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_collect: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_concavehull: {
        Args: {
          param_allow_holes?: boolean
          param_geom: unknown
          param_pctconvex: number
        }
        Returns: unknown
      }
      st_contains: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_containsproperly: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_coorddim: { Args: { geometry: unknown }; Returns: number }
      st_coveredby:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_covers:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_crosses: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_curvetoline: {
        Args: { flags?: number; geom: unknown; tol?: number; toltype?: number }
        Returns: unknown
      }
      st_delaunaytriangles: {
        Args: { flags?: number; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_difference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_disjoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_distance:
        | {
            Args: { geog1: unknown; geog2: unknown; use_spheroid?: boolean }
            Returns: number
          }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
      st_distancesphere:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: number }
        | {
            Args: { geom1: unknown; geom2: unknown; radius: number }
            Returns: number
          }
      st_distancespheroid: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_dwithin: {
        Args: {
          geog1: unknown
          geog2: unknown
          tolerance: number
          use_spheroid?: boolean
        }
        Returns: boolean
      }
      st_equals: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_expand:
        | { Args: { box: unknown; dx: number; dy: number }; Returns: unknown }
        | {
            Args: { box: unknown; dx: number; dy: number; dz?: number }
            Returns: unknown
          }
        | {
            Args: {
              dm?: number
              dx: number
              dy: number
              dz?: number
              geom: unknown
            }
            Returns: unknown
          }
      st_force3d: { Args: { geom: unknown; zvalue?: number }; Returns: unknown }
      st_force3dm: {
        Args: { geom: unknown; mvalue?: number }
        Returns: unknown
      }
      st_force3dz: {
        Args: { geom: unknown; zvalue?: number }
        Returns: unknown
      }
      st_force4d: {
        Args: { geom: unknown; mvalue?: number; zvalue?: number }
        Returns: unknown
      }
      st_generatepoints:
        | { Args: { area: unknown; npoints: number }; Returns: unknown }
        | {
            Args: { area: unknown; npoints: number; seed: number }
            Returns: unknown
          }
      st_geogfromtext: { Args: { "": string }; Returns: unknown }
      st_geographyfromtext: { Args: { "": string }; Returns: unknown }
      st_geohash:
        | { Args: { geog: unknown; maxchars?: number }; Returns: string }
        | { Args: { geom: unknown; maxchars?: number }; Returns: string }
      st_geomcollfromtext: { Args: { "": string }; Returns: unknown }
      st_geometricmedian: {
        Args: {
          fail_if_not_converged?: boolean
          g: unknown
          max_iter?: number
          tolerance?: number
        }
        Returns: unknown
      }
      st_geometryfromtext: { Args: { "": string }; Returns: unknown }
      st_geomfromewkt: { Args: { "": string }; Returns: unknown }
      st_geomfromgeojson:
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": Json }; Returns: unknown }
        | { Args: { "": string }; Returns: unknown }
      st_geomfromgml: { Args: { "": string }; Returns: unknown }
      st_geomfromkml: { Args: { "": string }; Returns: unknown }
      st_geomfrommarc21: { Args: { marc21xml: string }; Returns: unknown }
      st_geomfromtext: { Args: { "": string }; Returns: unknown }
      st_gmltosql: { Args: { "": string }; Returns: unknown }
      st_hasarc: { Args: { geometry: unknown }; Returns: boolean }
      st_hausdorffdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_hexagon: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_hexagongrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_interpolatepoint: {
        Args: { line: unknown; point: unknown }
        Returns: number
      }
      st_intersection: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_intersects:
        | { Args: { geog1: unknown; geog2: unknown }; Returns: boolean }
        | { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_isvaliddetail: {
        Args: { flags?: number; geom: unknown }
        Returns: Database["public"]["CompositeTypes"]["valid_detail"]
        SetofOptions: {
          from: "*"
          to: "valid_detail"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      st_length:
        | { Args: { geog: unknown; use_spheroid?: boolean }; Returns: number }
        | { Args: { "": string }; Returns: number }
      st_letters: { Args: { font?: Json; letters: string }; Returns: unknown }
      st_linecrossingdirection: {
        Args: { line1: unknown; line2: unknown }
        Returns: number
      }
      st_linefromencodedpolyline: {
        Args: { nprecision?: number; txtin: string }
        Returns: unknown
      }
      st_linefromtext: { Args: { "": string }; Returns: unknown }
      st_linelocatepoint: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_linetocurve: { Args: { geometry: unknown }; Returns: unknown }
      st_locatealong: {
        Args: { geometry: unknown; leftrightoffset?: number; measure: number }
        Returns: unknown
      }
      st_locatebetween: {
        Args: {
          frommeasure: number
          geometry: unknown
          leftrightoffset?: number
          tomeasure: number
        }
        Returns: unknown
      }
      st_locatebetweenelevations: {
        Args: { fromelevation: number; geometry: unknown; toelevation: number }
        Returns: unknown
      }
      st_longestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makebox2d: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makeline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_makevalid: {
        Args: { geom: unknown; params: string }
        Returns: unknown
      }
      st_maxdistance: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: number
      }
      st_minimumboundingcircle: {
        Args: { inputgeom: unknown; segs_per_quarter?: number }
        Returns: unknown
      }
      st_mlinefromtext: { Args: { "": string }; Returns: unknown }
      st_mpointfromtext: { Args: { "": string }; Returns: unknown }
      st_mpolyfromtext: { Args: { "": string }; Returns: unknown }
      st_multilinestringfromtext: { Args: { "": string }; Returns: unknown }
      st_multipointfromtext: { Args: { "": string }; Returns: unknown }
      st_multipolygonfromtext: { Args: { "": string }; Returns: unknown }
      st_node: { Args: { g: unknown }; Returns: unknown }
      st_normalize: { Args: { geom: unknown }; Returns: unknown }
      st_offsetcurve: {
        Args: { distance: number; line: unknown; params?: string }
        Returns: unknown
      }
      st_orderingequals: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_overlaps: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: boolean
      }
      st_perimeter: {
        Args: { geog: unknown; use_spheroid?: boolean }
        Returns: number
      }
      st_pointfromtext: { Args: { "": string }; Returns: unknown }
      st_pointm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
        }
        Returns: unknown
      }
      st_pointz: {
        Args: {
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_pointzm: {
        Args: {
          mcoordinate: number
          srid?: number
          xcoordinate: number
          ycoordinate: number
          zcoordinate: number
        }
        Returns: unknown
      }
      st_polyfromtext: { Args: { "": string }; Returns: unknown }
      st_polygonfromtext: { Args: { "": string }; Returns: unknown }
      st_project: {
        Args: { azimuth: number; distance: number; geog: unknown }
        Returns: unknown
      }
      st_quantizecoordinates: {
        Args: {
          g: unknown
          prec_m?: number
          prec_x: number
          prec_y?: number
          prec_z?: number
        }
        Returns: unknown
      }
      st_reduceprecision: {
        Args: { geom: unknown; gridsize: number }
        Returns: unknown
      }
      st_relate: { Args: { geom1: unknown; geom2: unknown }; Returns: string }
      st_removerepeatedpoints: {
        Args: { geom: unknown; tolerance?: number }
        Returns: unknown
      }
      st_segmentize: {
        Args: { geog: unknown; max_segment_length: number }
        Returns: unknown
      }
      st_setsrid:
        | { Args: { geog: unknown; srid: number }; Returns: unknown }
        | { Args: { geom: unknown; srid: number }; Returns: unknown }
      st_sharedpaths: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_shortestline: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_simplifypolygonhull: {
        Args: { geom: unknown; is_outer?: boolean; vertex_fraction: number }
        Returns: unknown
      }
      st_split: { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
      st_square: {
        Args: { cell_i: number; cell_j: number; origin?: unknown; size: number }
        Returns: unknown
      }
      st_squaregrid: {
        Args: { bounds: unknown; size: number }
        Returns: Record<string, unknown>[]
      }
      st_srid:
        | { Args: { geog: unknown }; Returns: number }
        | { Args: { geom: unknown }; Returns: number }
      st_subdivide: {
        Args: { geom: unknown; gridsize?: number; maxvertices?: number }
        Returns: unknown[]
      }
      st_swapordinates: {
        Args: { geom: unknown; ords: unknown }
        Returns: unknown
      }
      st_symdifference: {
        Args: { geom1: unknown; geom2: unknown; gridsize?: number }
        Returns: unknown
      }
      st_symmetricdifference: {
        Args: { geom1: unknown; geom2: unknown }
        Returns: unknown
      }
      st_tileenvelope: {
        Args: {
          bounds?: unknown
          margin?: number
          x: number
          y: number
          zoom: number
        }
        Returns: unknown
      }
      st_touches: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_transform:
        | {
            Args: { from_proj: string; geom: unknown; to_proj: string }
            Returns: unknown
          }
        | {
            Args: { from_proj: string; geom: unknown; to_srid: number }
            Returns: unknown
          }
        | { Args: { geom: unknown; to_proj: string }; Returns: unknown }
      st_triangulatepolygon: { Args: { g1: unknown }; Returns: unknown }
      st_union:
        | { Args: { geom1: unknown; geom2: unknown }; Returns: unknown }
        | {
            Args: { geom1: unknown; geom2: unknown; gridsize: number }
            Returns: unknown
          }
      st_voronoilines: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_voronoipolygons: {
        Args: { extend_to?: unknown; g1: unknown; tolerance?: number }
        Returns: unknown
      }
      st_within: { Args: { geom1: unknown; geom2: unknown }; Returns: boolean }
      st_wkbtosql: { Args: { wkb: string }; Returns: unknown }
      st_wkttosql: { Args: { "": string }; Returns: unknown }
      st_wrapx: {
        Args: { geom: unknown; move: number; wrap: number }
        Returns: unknown
      }
      unlockrows: { Args: { "": string }; Returns: number }
      update_user_role_claims: {
        Args: {
          p_organization_id: string
          p_organization_type: string
          p_role: string
          p_user_id: string
        }
        Returns: undefined
      }
      updategeometrysrid: {
        Args: {
          catalogn_name: string
          column_name: string
          new_srid_in: number
          schema_name: string
          table_name: string
        }
        Returns: string
      }
      user_organization_id: { Args: never; Returns: string }
      user_organization_type: { Args: never; Returns: string }
      user_role: { Args: never; Returns: string }
      venues_within_radius: {
        Args: {
          lat: number
          lng: number
          radius_meters: number
          venue_ids?: string[]
        }
        Returns: {
          distance_meters: number
          id: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      geometry_dump: {
        path: number[] | null
        geom: unknown
      }
      valid_detail: {
        valid: boolean | null
        reason: string | null
        location: unknown
      }
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
