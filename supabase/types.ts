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
      _manual_fixes_required: {
        Row: {
          category: string
          completed: boolean | null
          created_at: string | null
          description: string
          id: number
          instructions: string
          priority: string
          title: string
        }
        Insert: {
          category: string
          completed?: boolean | null
          created_at?: string | null
          description: string
          id?: number
          instructions: string
          priority: string
          title: string
        }
        Update: {
          category?: string
          completed?: boolean | null
          created_at?: string | null
          description?: string
          id?: number
          instructions?: string
          priority?: string
          title?: string
        }
        Relationships: []
      }
      ab_tests: {
        Row: {
          confidence_level: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          feature_name: string
          hypothesis: string | null
          id: string
          minimum_sample_size: number | null
          primary_metric: string
          results: Json | null
          secondary_metrics: string[] | null
          start_date: string | null
          statistical_significance: number | null
          status: string | null
          test_name: string
          traffic_split: Json
          updated_at: string | null
          variants: Json
          winner_variant: string | null
        }
        Insert: {
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          feature_name: string
          hypothesis?: string | null
          id?: string
          minimum_sample_size?: number | null
          primary_metric: string
          results?: Json | null
          secondary_metrics?: string[] | null
          start_date?: string | null
          statistical_significance?: number | null
          status?: string | null
          test_name: string
          traffic_split: Json
          updated_at?: string | null
          variants: Json
          winner_variant?: string | null
        }
        Update: {
          confidence_level?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          feature_name?: string
          hypothesis?: string | null
          id?: string
          minimum_sample_size?: number | null
          primary_metric?: string
          results?: Json | null
          secondary_metrics?: string[] | null
          start_date?: string | null
          statistical_significance?: number | null
          status?: string | null
          test_name?: string
          traffic_split?: Json
          updated_at?: string | null
          variants?: Json
          winner_variant?: string | null
        }
        Relationships: []
      }
      alert_incidents: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_name: string
          alert_rule_id: string
          created_at: string | null
          current_value: number | null
          description: string | null
          id: string
          metadata: Json | null
          metric_name: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string | null
          threshold_value: number | null
          triggered_at: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_name: string
          alert_rule_id: string
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          metadata?: Json | null
          metric_name: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string | null
          threshold_value?: number | null
          triggered_at?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_name?: string
          alert_rule_id?: string
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          id?: string
          metadata?: Json | null
          metric_name?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string | null
          threshold_value?: number | null
          triggered_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "alert_incidents_alert_rule_id_fkey"
            columns: ["alert_rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          alert_type: string
          condition_operator: string
          condition_value: number | null
          condition_value2: number | null
          cooldown_minutes: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          evaluation_window_minutes: number | null
          id: string
          is_active: boolean | null
          metric_name: string
          name: string
          notification_channels: string[] | null
          severity: string
          updated_at: string | null
        }
        Insert: {
          alert_type: string
          condition_operator: string
          condition_value?: number | null
          condition_value2?: number | null
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          evaluation_window_minutes?: number | null
          id?: string
          is_active?: boolean | null
          metric_name: string
          name: string
          notification_channels?: string[] | null
          severity: string
          updated_at?: string | null
        }
        Update: {
          alert_type?: string
          condition_operator?: string
          condition_value?: number | null
          condition_value2?: number | null
          cooldown_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          evaluation_window_minutes?: number | null
          id?: string
          is_active?: boolean | null
          metric_name?: string
          name?: string
          notification_channels?: string[] | null
          severity?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      analytics_data: {
        Row: {
          created_at: string | null
          date: string
          id: string
          metadata: Json | null
          metric_category: string
          metric_name: string
          value: number
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          metadata?: Json | null
          metric_category: string
          metric_name: string
          value: number
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          metadata?: Json | null
          metric_category?: string
          metric_name?: string
          value?: number
        }
        Relationships: []
      }
      api_analytics: {
        Row: {
          browser_name: string | null
          cache_hit: boolean | null
          country_code: string | null
          created_at: string | null
          device_type: string | null
          endpoint: string
          error_type: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          method: string
          request_size_bytes: number | null
          response_size_bytes: number | null
          response_time_ms: number
          status_code: number
          timestamp: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser_name?: string | null
          cache_hit?: boolean | null
          country_code?: string | null
          created_at?: string | null
          device_type?: string | null
          endpoint: string
          error_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms: number
          status_code: number
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser_name?: string | null
          cache_hit?: boolean | null
          country_code?: string | null
          created_at?: string | null
          device_type?: string | null
          endpoint?: string
          error_type?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_time_ms?: number
          status_code?: number
          timestamp?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_quotas: {
        Row: {
          created_at: string | null
          current_day_count: number | null
          current_hour_count: number | null
          current_minute_count: number | null
          id: string
          is_suspended: boolean | null
          plan_name: string | null
          quota_reset_day: string | null
          quota_reset_hour: string | null
          quota_reset_minute: string | null
          requests_per_day: number | null
          requests_per_hour: number | null
          requests_per_minute: number | null
          suspended_until: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_day_count?: number | null
          current_hour_count?: number | null
          current_minute_count?: number | null
          id?: string
          is_suspended?: boolean | null
          plan_name?: string | null
          quota_reset_day?: string | null
          quota_reset_hour?: string | null
          quota_reset_minute?: string | null
          requests_per_day?: number | null
          requests_per_hour?: number | null
          requests_per_minute?: number | null
          suspended_until?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_day_count?: number | null
          current_hour_count?: number | null
          current_minute_count?: number | null
          id?: string
          is_suspended?: boolean | null
          plan_name?: string | null
          quota_reset_day?: string | null
          quota_reset_hour?: string | null
          quota_reset_minute?: string | null
          requests_per_day?: number | null
          requests_per_hour?: number | null
          requests_per_minute?: number | null
          suspended_until?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_usage: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown
          metadata: Json | null
          method: string
          request_size: number | null
          response_size: number | null
          response_time_ms: number | null
          status_code: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address: unknown
          metadata?: Json | null
          method: string
          request_size?: number | null
          response_size?: number | null
          response_time_ms?: number | null
          status_code: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          method?: string
          request_size?: number | null
          response_size?: number | null
          response_time_ms?: number | null
          status_code?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_id: string
          session_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["audit_action"]
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          session_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["audit_action"]
          created_at?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          session_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      availability_blocks: {
        Row: {
          created_at: string
          created_by: string | null
          end_at_utc: string
          equipment_id: string
          id: string
          notes: string | null
          reason: Database["public"]["Enums"]["block_reason_enum"]
          start_at_utc: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_at_utc: string
          equipment_id: string
          id?: string
          notes?: string | null
          reason?: Database["public"]["Enums"]["block_reason_enum"]
          start_at_utc: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_at_utc?: string
          equipment_id?: string
          id?: string
          notes?: string | null
          reason?: Database["public"]["Enums"]["block_reason_enum"]
          start_at_utc?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "admin_audit_logs_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "availability_blocks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_blocks_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_blocks_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "mv_equipment_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_jobs: {
        Row: {
          backup_type: string
          checksum_sha256: string | null
          completed_at: string | null
          compression_enabled: boolean | null
          created_at: string | null
          encryption_enabled: boolean | null
          error_message: string | null
          file_size_bytes: number | null
          id: string
          job_name: string
          next_run: string | null
          retention_days: number | null
          schedule_cron: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["backup_status"] | null
          storage_location: string | null
          updated_at: string | null
        }
        Insert: {
          backup_type: string
          checksum_sha256?: string | null
          completed_at?: string | null
          compression_enabled?: boolean | null
          created_at?: string | null
          encryption_enabled?: boolean | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          job_name: string
          next_run?: string | null
          retention_days?: number | null
          schedule_cron?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"] | null
          storage_location?: string | null
          updated_at?: string | null
        }
        Update: {
          backup_type?: string
          checksum_sha256?: string | null
          completed_at?: string | null
          compression_enabled?: boolean | null
          created_at?: string | null
          encryption_enabled?: boolean | null
          error_message?: string | null
          file_size_bytes?: number | null
          id?: string
          job_name?: string
          next_run?: string | null
          retention_days?: number | null
          schedule_cron?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["backup_status"] | null
          storage_location?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      booking_attachments: {
        Row: {
          attachment_id: string | null
          booking_id: string | null
          created_at: string | null
          daily_rate: number
          days_rented: number
          id: string
          notes: string | null
          quantity: number | null
          total_amount: number
        }
        Insert: {
          attachment_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          daily_rate: number
          days_rented: number
          id?: string
          notes?: string | null
          quantity?: number | null
          total_amount: number
        }
        Update: {
          attachment_id?: string | null
          booking_id?: string | null
          created_at?: string | null
          daily_rate?: number
          days_rented?: number
          id?: string
          notes?: string | null
          quantity?: number | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "booking_attachments_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "equipment_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_attachments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_payments: {
        Row: {
          amount_cents: number
          booking_id: string
          created_at: string | null
          currency: string | null
          id: string
          idempotency_key: string | null
          metadata: Json | null
          purpose: string
          status: string | null
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount_cents: number
          booking_id: string
          created_at?: string | null
          currency?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          purpose: string
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount_cents?: number
          booking_id?: string
          created_at?: string | null
          currency?: string | null
          id?: string
          idempotency_key?: string | null
          metadata?: Json | null
          purpose?: string
          status?: string | null
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "booking_payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          actualEndDate: string | null
          actualStartDate: string | null
          additionalCharges: number
          attachments: Json | null
          bookingNumber: string
          cancellationFee: number
          cancellationReason: string | null
          cancelledAt: string | null
          completionEmailSentAt: string | null
          couponCode: string | null
          couponDiscount: number | null
          couponType: string | null
          couponValue: number | null
          createdAt: string
          customerId: string
          dailyRate: number
          deliveryAddress: string | null
          deliveryCity: string | null
          deliveryFee: number
          deliveryPostalCode: string | null
          deliveryProvince: string | null
          depositPaid: boolean
          depositPaidAt: string | null
          distanceKm: number | null
          documents: Json | null
          endDate: string
          endEngineHours: number
          equipmentId: string
          floatFee: number
          hold_amount_cents: number | null
          hold_security_amount_cents: number | null
          hold_verify_amount_cents: number | null
          id: string
          internalNotes: string | null
          monthlyRate: number
          overageCharges: number
          overageHours: number
          refundAmount: number
          search_vector: unknown
          seasonalMultiplier: number
          security_hold_intent_id: string | null
          securityDeposit: number
          signatures: Json | null
          specialInstructions: string | null
          startDate: string
          startEngineHours: number
          status: Database["public"]["Enums"]["bookings_status_enum"]
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          stripe_setup_intent_id: string | null
          stripeDepositPaymentIntentId: string | null
          stripeDepositPriceId: string | null
          stripeDepositSessionId: string | null
          stripeInvoicePriceId: string | null
          stripeInvoiceSessionId: string | null
          stripeProductId: string | null
          subtotal: number
          taxes: number
          termsAccepted: Json | null
          totalAmount: number
          type: Database["public"]["Enums"]["bookings_type_enum"]
          updatedAt: string
          verify_hold_intent_id: string | null
          waiver_rate_cents: number | null
          waiver_selected: boolean | null
          weeklyRate: number
        }
        Insert: {
          actualEndDate?: string | null
          actualStartDate?: string | null
          additionalCharges?: number
          attachments?: Json | null
          bookingNumber: string
          cancellationFee?: number
          cancellationReason?: string | null
          cancelledAt?: string | null
          completionEmailSentAt?: string | null
          couponCode?: string | null
          couponDiscount?: number | null
          couponType?: string | null
          couponValue?: number | null
          createdAt?: string
          customerId: string
          dailyRate: number
          deliveryAddress?: string | null
          deliveryCity?: string | null
          deliveryFee?: number
          deliveryPostalCode?: string | null
          deliveryProvince?: string | null
          depositPaid?: boolean
          depositPaidAt?: string | null
          distanceKm?: number | null
          documents?: Json | null
          endDate: string
          endEngineHours?: number
          equipmentId: string
          floatFee: number
          hold_amount_cents?: number | null
          hold_security_amount_cents?: number | null
          hold_verify_amount_cents?: number | null
          id?: string
          internalNotes?: string | null
          monthlyRate: number
          overageCharges?: number
          overageHours?: number
          refundAmount?: number
          search_vector?: unknown
          seasonalMultiplier?: number
          security_hold_intent_id?: string | null
          securityDeposit: number
          signatures?: Json | null
          specialInstructions?: string | null
          startDate: string
          startEngineHours?: number
          status?: Database["public"]["Enums"]["bookings_status_enum"]
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          stripeDepositPaymentIntentId?: string | null
          stripeDepositPriceId?: string | null
          stripeDepositSessionId?: string | null
          stripeInvoicePriceId?: string | null
          stripeInvoiceSessionId?: string | null
          stripeProductId?: string | null
          subtotal: number
          taxes: number
          termsAccepted?: Json | null
          totalAmount: number
          type?: Database["public"]["Enums"]["bookings_type_enum"]
          updatedAt?: string
          verify_hold_intent_id?: string | null
          waiver_rate_cents?: number | null
          waiver_selected?: boolean | null
          weeklyRate: number
        }
        Update: {
          actualEndDate?: string | null
          actualStartDate?: string | null
          additionalCharges?: number
          attachments?: Json | null
          bookingNumber?: string
          cancellationFee?: number
          cancellationReason?: string | null
          cancelledAt?: string | null
          completionEmailSentAt?: string | null
          couponCode?: string | null
          couponDiscount?: number | null
          couponType?: string | null
          couponValue?: number | null
          createdAt?: string
          customerId?: string
          dailyRate?: number
          deliveryAddress?: string | null
          deliveryCity?: string | null
          deliveryFee?: number
          deliveryPostalCode?: string | null
          deliveryProvince?: string | null
          depositPaid?: boolean
          depositPaidAt?: string | null
          distanceKm?: number | null
          documents?: Json | null
          endDate?: string
          endEngineHours?: number
          equipmentId?: string
          floatFee?: number
          hold_amount_cents?: number | null
          hold_security_amount_cents?: number | null
          hold_verify_amount_cents?: number | null
          id?: string
          internalNotes?: string | null
          monthlyRate?: number
          overageCharges?: number
          overageHours?: number
          refundAmount?: number
          search_vector?: unknown
          seasonalMultiplier?: number
          security_hold_intent_id?: string | null
          securityDeposit?: number
          signatures?: Json | null
          specialInstructions?: string | null
          startDate?: string
          startEngineHours?: number
          status?: Database["public"]["Enums"]["bookings_status_enum"]
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          stripe_setup_intent_id?: string | null
          stripeDepositPaymentIntentId?: string | null
          stripeDepositPriceId?: string | null
          stripeDepositSessionId?: string | null
          stripeInvoicePriceId?: string | null
          stripeInvoiceSessionId?: string | null
          stripeProductId?: string | null
          subtotal?: number
          taxes?: number
          termsAccepted?: Json | null
          totalAmount?: number
          type?: Database["public"]["Enums"]["bookings_type_enum"]
          updatedAt?: string
          verify_hold_intent_id?: string | null
          waiver_rate_cents?: number | null
          waiver_selected?: boolean | null
          weeklyRate?: number
        }
        Relationships: [
          {
            foreignKeyName: "FK_67b9cd20f987fc6dc70f7cd283f"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "admin_audit_logs_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "FK_67b9cd20f987fc6dc70f7cd283f"
            columns: ["customerId"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_985d0679a4ae95389dd7180adfa"
            columns: ["equipmentId"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "FK_985d0679a4ae95389dd7180adfa"
            columns: ["equipmentId"]
            isOneToOne: false
            referencedRelation: "mv_equipment_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_requirements: {
        Row: {
          created_at: string | null
          documentation_required: string[] | null
          entity_type: string
          fine_amount: number | null
          frequency_days: number | null
          grace_period_days: number | null
          id: string
          is_mandatory: boolean | null
          regulation: string | null
          requirement_name: string
          requirement_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          documentation_required?: string[] | null
          entity_type: string
          fine_amount?: number | null
          frequency_days?: number | null
          grace_period_days?: number | null
          id?: string
          is_mandatory?: boolean | null
          regulation?: string | null
          requirement_name: string
          requirement_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          documentation_required?: string[] | null
          entity_type?: string
          fine_amount?: number | null
          frequency_days?: number | null
          grace_period_days?: number | null
          id?: string
          is_mandatory?: boolean | null
          regulation?: string | null
          requirement_name?: string
          requirement_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contest_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entrant_id: string | null
          id: string
          ip_address: unknown
          metadata: Json | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entrant_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entrant_id?: string | null
          id?: string
          ip_address?: unknown
          metadata?: Json | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_audit_logs_entrant_id_fkey"
            columns: ["entrant_id"]
            isOneToOne: false
            referencedRelation: "contest_entrants"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_entrants: {
        Row: {
          city: string | null
          contest_month: string
          created_at: string | null
          device_fingerprint: string | null
          disqualification_reason: string | null
          disqualified: boolean | null
          email: string
          entry_source: string | null
          first_name: string
          flagged_for_review: boolean | null
          id: string
          ip_address: unknown
          last_name: string
          marketing_consent: boolean | null
          phone: string | null
          postal_code: string | null
          rules_accepted: boolean | null
          total_entries: number
          updated_at: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          verification_sent_at: string | null
          verification_token: string | null
          verified: boolean | null
          verified_at: string | null
        }
        Insert: {
          city?: string | null
          contest_month?: string
          created_at?: string | null
          device_fingerprint?: string | null
          disqualification_reason?: string | null
          disqualified?: boolean | null
          email: string
          entry_source?: string | null
          first_name: string
          flagged_for_review?: boolean | null
          id?: string
          ip_address?: unknown
          last_name: string
          marketing_consent?: boolean | null
          phone?: string | null
          postal_code?: string | null
          rules_accepted?: boolean | null
          total_entries?: number
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Update: {
          city?: string | null
          contest_month?: string
          created_at?: string | null
          device_fingerprint?: string | null
          disqualification_reason?: string | null
          disqualified?: boolean | null
          email?: string
          entry_source?: string | null
          first_name?: string
          flagged_for_review?: boolean | null
          id?: string
          ip_address?: unknown
          last_name?: string
          marketing_consent?: boolean | null
          phone?: string | null
          postal_code?: string | null
          rules_accepted?: boolean | null
          total_entries?: number
          updated_at?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
          verified?: boolean | null
          verified_at?: string | null
        }
        Relationships: []
      }
      contest_events: {
        Row: {
          created_at: string | null
          entrant_id: string | null
          event_type: string
          id: string
          properties: Json | null
        }
        Insert: {
          created_at?: string | null
          entrant_id?: string | null
          event_type: string
          id?: string
          properties?: Json | null
        }
        Update: {
          created_at?: string | null
          entrant_id?: string | null
          event_type?: string
          id?: string
          properties?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_events_entrant_id_fkey"
            columns: ["entrant_id"]
            isOneToOne: false
            referencedRelation: "contest_entrants"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_referral_codes: {
        Row: {
          code: string
          contest_month: string
          created_at: string | null
          entrant_id: string | null
          id: string
          times_used: number | null
        }
        Insert: {
          code: string
          contest_month: string
          created_at?: string | null
          entrant_id?: string | null
          id?: string
          times_used?: number | null
        }
        Update: {
          code?: string
          contest_month?: string
          created_at?: string | null
          entrant_id?: string | null
          id?: string
          times_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_referral_codes_entrant_id_fkey"
            columns: ["entrant_id"]
            isOneToOne: true
            referencedRelation: "contest_entrants"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_referrals: {
        Row: {
          contest_month: string
          created_at: string | null
          id: string
          referee_id: string | null
          referral_code: string | null
          referrer_id: string | null
          validated: boolean | null
          validated_at: string | null
        }
        Insert: {
          contest_month: string
          created_at?: string | null
          id?: string
          referee_id?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          validated?: boolean | null
          validated_at?: string | null
        }
        Update: {
          contest_month?: string
          created_at?: string | null
          id?: string
          referee_id?: string | null
          referral_code?: string | null
          referrer_id?: string | null
          validated?: boolean | null
          validated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_referrals_referee_id_fkey"
            columns: ["referee_id"]
            isOneToOne: false
            referencedRelation: "contest_entrants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contest_referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "contest_entrants"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_winners: {
        Row: {
          contest_month: string
          created_at: string | null
          draw_seed: string | null
          drawn_at: string | null
          entrant_id: string | null
          id: string
          identity_verified: boolean | null
          notified_at: string | null
          prize_description: string | null
          prize_type: string
          responded_at: string | null
          response_deadline: string | null
          total_entries_at_draw: number | null
          updated_at: string | null
          verification_notes: string | null
          voucher_code: string | null
          voucher_expires_at: string | null
          voucher_pdf_url: string | null
          voucher_redeemed: boolean | null
          voucher_redeemed_at: string | null
        }
        Insert: {
          contest_month: string
          created_at?: string | null
          draw_seed?: string | null
          drawn_at?: string | null
          entrant_id?: string | null
          id?: string
          identity_verified?: boolean | null
          notified_at?: string | null
          prize_description?: string | null
          prize_type: string
          responded_at?: string | null
          response_deadline?: string | null
          total_entries_at_draw?: number | null
          updated_at?: string | null
          verification_notes?: string | null
          voucher_code?: string | null
          voucher_expires_at?: string | null
          voucher_pdf_url?: string | null
          voucher_redeemed?: boolean | null
          voucher_redeemed_at?: string | null
        }
        Update: {
          contest_month?: string
          created_at?: string | null
          draw_seed?: string | null
          drawn_at?: string | null
          entrant_id?: string | null
          id?: string
          identity_verified?: boolean | null
          notified_at?: string | null
          prize_description?: string | null
          prize_type?: string
          responded_at?: string | null
          response_deadline?: string | null
          total_entries_at_draw?: number | null
          updated_at?: string | null
          verification_notes?: string | null
          voucher_code?: string | null
          voucher_expires_at?: string | null
          voucher_pdf_url?: string | null
          voucher_redeemed?: boolean | null
          voucher_redeemed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contest_winners_entrant_id_fkey"
            columns: ["entrant_id"]
            isOneToOne: false
            referencedRelation: "contest_entrants"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_templates: {
        Row: {
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_type: string
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_type: string
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_type?: string
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      contracts: {
        Row: {
          auditTrail: Json | null
          bookingId: string
          completedAt: string | null
          contractNumber: string
          createdAt: string
          declinedAt: string | null
          documentContent: string | null
          documentId: string | null
          documentMetadata: Json | null
          documentUrl: string | null
          docusignData: Json | null
          docusignEnvelopeId: string | null
          envelopeId: string | null
          equipment_rider_data: Json | null
          equipment_rider_signed_url: string | null
          equipment_rider_url: string | null
          expiresAt: string | null
          id: string
          initialsCapture: Json | null
          legalVersions: Json
          notes: string | null
          opensign_data: Json | null
          opensign_document_id: string | null
          opensign_envelope_id: string | null
          opensign_status: string | null
          sentAt: string | null
          sentForSignatureAt: string | null
          signatures: Json | null
          signedAt: string | null
          signedDocumentContent: string | null
          signedDocumentPath: string | null
          signedDocumentUrl: string | null
          status: Database["public"]["Enums"]["contracts_status_enum"]
          type: Database["public"]["Enums"]["contracts_type_enum"]
          updatedAt: string
          voidedAt: string | null
          voidedBy: string | null
          voidReason: string | null
        }
        Insert: {
          auditTrail?: Json | null
          bookingId: string
          completedAt?: string | null
          contractNumber: string
          createdAt?: string
          declinedAt?: string | null
          documentContent?: string | null
          documentId?: string | null
          documentMetadata?: Json | null
          documentUrl?: string | null
          docusignData?: Json | null
          docusignEnvelopeId?: string | null
          envelopeId?: string | null
          equipment_rider_data?: Json | null
          equipment_rider_signed_url?: string | null
          equipment_rider_url?: string | null
          expiresAt?: string | null
          id?: string
          initialsCapture?: Json | null
          legalVersions: Json
          notes?: string | null
          opensign_data?: Json | null
          opensign_document_id?: string | null
          opensign_envelope_id?: string | null
          opensign_status?: string | null
          sentAt?: string | null
          sentForSignatureAt?: string | null
          signatures?: Json | null
          signedAt?: string | null
          signedDocumentContent?: string | null
          signedDocumentPath?: string | null
          signedDocumentUrl?: string | null
          status?: Database["public"]["Enums"]["contracts_status_enum"]
          type?: Database["public"]["Enums"]["contracts_type_enum"]
          updatedAt?: string
          voidedAt?: string | null
          voidedBy?: string | null
          voidReason?: string | null
        }
        Update: {
          auditTrail?: Json | null
          bookingId?: string
          completedAt?: string | null
          contractNumber?: string
          createdAt?: string
          declinedAt?: string | null
          documentContent?: string | null
          documentId?: string | null
          documentMetadata?: Json | null
          documentUrl?: string | null
          docusignData?: Json | null
          docusignEnvelopeId?: string | null
          envelopeId?: string | null
          equipment_rider_data?: Json | null
          equipment_rider_signed_url?: string | null
          equipment_rider_url?: string | null
          expiresAt?: string | null
          id?: string
          initialsCapture?: Json | null
          legalVersions?: Json
          notes?: string | null
          opensign_data?: Json | null
          opensign_document_id?: string | null
          opensign_envelope_id?: string | null
          opensign_status?: string | null
          sentAt?: string | null
          sentForSignatureAt?: string | null
          signatures?: Json | null
          signedAt?: string | null
          signedDocumentContent?: string | null
          signedDocumentPath?: string | null
          signedDocumentUrl?: string | null
          status?: Database["public"]["Enums"]["contracts_status_enum"]
          type?: Database["public"]["Enums"]["contracts_type_enum"]
          updatedAt?: string
          voidedAt?: string | null
          voidedBy?: string | null
          voidReason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "FK_677bc3fb3daf7e5873fe1881e7a"
            columns: ["bookingId"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      conversion_funnels: {
        Row: {
          abandoned_at_stage: string | null
          completed_at: string | null
          conversion_rate: number | null
          created_at: string | null
          current_stage: string | null
          funnel_name: string
          funnel_stages: Json
          id: string
          metadata: Json | null
          session_id: string | null
          stage_progress: Json | null
          time_to_convert_seconds: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          abandoned_at_stage?: string | null
          completed_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          current_stage?: string | null
          funnel_name: string
          funnel_stages: Json
          id?: string
          metadata?: Json | null
          session_id?: string | null
          stage_progress?: Json | null
          time_to_convert_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          abandoned_at_stage?: string | null
          completed_at?: string | null
          conversion_rate?: number | null
          created_at?: string | null
          current_stage?: string | null
          funnel_name?: string
          funnel_stages?: Json
          id?: string
          metadata?: Json | null
          session_id?: string | null
          stage_progress?: Json | null
          time_to_convert_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      credit_applications: {
        Row: {
          approval_notes: string | null
          approved_limit: number | null
          business_name: string | null
          business_references: Json | null
          business_type: string | null
          created_at: string | null
          customer_id: string | null
          financial_statements_url: string | null
          id: string
          rejection_reason: string | null
          requested_limit: number
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          years_in_business: number | null
        }
        Insert: {
          approval_notes?: string | null
          approved_limit?: number | null
          business_name?: string | null
          business_references?: Json | null
          business_type?: string | null
          created_at?: string | null
          customer_id?: string | null
          financial_statements_url?: string | null
          id?: string
          rejection_reason?: string | null
          requested_limit: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          years_in_business?: number | null
        }
        Update: {
          approval_notes?: string | null
          approved_limit?: number | null
          business_name?: string | null
          business_references?: Json | null
          business_type?: string | null
          created_at?: string | null
          customer_id?: string | null
          financial_statements_url?: string | null
          id?: string
          rejection_reason?: string | null
          requested_limit?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          years_in_business?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "credit_applications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "admin_audit_logs_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "credit_applications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "credit_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "admin_audit_logs_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "credit_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_behavior_analytics: {
        Row: {
          browser_name: string | null
          conversion_funnel_stage: string | null
          created_at: string | null
          customer_id: string
          device_type: string | null
          event_data: Json | null
          event_name: string
          event_type: string
          id: string
          page_url: string | null
          referrer_url: string | null
          screen_resolution: string | null
          scroll_depth_percentage: number | null
          session_id: string | null
          time_on_page_seconds: number | null
          timestamp: string | null
        }
        Insert: {
          browser_name?: string | null
          conversion_funnel_stage?: string | null
          created_at?: string | null
          customer_id: string
          device_type?: string | null
          event_data?: Json | null
          event_name: string
          event_type: string
          id?: string
          page_url?: string | null
          referrer_url?: string | null
          screen_resolution?: string | null
          scroll_depth_percentage?: number | null
          session_id?: string | null
          time_on_page_seconds?: number | null
          timestamp?: string | null
        }
        Update: {
          browser_name?: string | null
          conversion_funnel_stage?: string | null
          created_at?: string | null
          customer_id?: string
          device_type?: string | null
          event_data?: Json | null
          event_name?: string
          event_type?: string
          id?: string
          page_url?: string | null
          referrer_url?: string | null
          screen_resolution?: string | null
          scroll_depth_percentage?: number | null
          session_id?: string | null
          time_on_page_seconds?: number | null
          timestamp?: string | null
        }
        Relationships: []
      }
      customer_communications: {
        Row: {
          booking_id: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          direction: string
          id: string
          metadata: Json | null
          subject: string | null
          type: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          direction: string
          id?: string
          metadata?: Json | null
          subject?: string | null
          type: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          direction?: string
          id?: string
          metadata?: Json | null
          subject?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_communications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_journeys: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_stage: string
          customer_id: string
          id: string
          journey_data: Json | null
          journey_type: string
          stage_progress: number | null
          target_completion_date: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_stage: string
          customer_id: string
          id?: string
          journey_data?: Json | null
          journey_type: string
          stage_progress?: number | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_stage?: string
          customer_id?: string
          id?: string
          journey_data?: Json | null
          journey_type?: string
          stage_progress?: number | null
          target_completion_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      customer_segments: {
        Row: {
          avg_booking_frequency: number | null
          avg_booking_value: number | null
          behavior_embedding: string | null
          created_at: string | null
          criteria: Json
          customer_count: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          tier: Database["public"]["Enums"]["customer_tier"] | null
          updated_at: string | null
        }
        Insert: {
          avg_booking_frequency?: number | null
          avg_booking_value?: number | null
          behavior_embedding?: string | null
          created_at?: string | null
          criteria: Json
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          tier?: Database["public"]["Enums"]["customer_tier"] | null
          updated_at?: string | null
        }
        Update: {
          avg_booking_frequency?: number | null
          avg_booking_value?: number | null
          behavior_embedding?: string | null
          created_at?: string | null
          criteria?: Json
          customer_count?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          tier?: Database["public"]["Enums"]["customer_tier"] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      damage_reports: {
        Row: {
          actual_repair_cost: number | null
          assessed_at: string | null
          booking_id: string | null
          created_at: string | null
          customer_liable_amount: number | null
          description: string
          equipment_id: string | null
          estimated_repair_cost: number | null
          id: string
          incident_date: string | null
          insurance_claim_filed: boolean | null
          insurance_claim_number: string | null
          location_of_incident: string | null
          photos: Json | null
          repair_status: string | null
          report_number: string | null
          report_type: string
          reported_at: string | null
          reported_by: string | null
          resolution_notes: string | null
          resolved_at: string | null
          responsibility: string | null
          severity: string
          updated_at: string | null
        }
        Insert: {
          actual_repair_cost?: number | null
          assessed_at?: string | null
          booking_id?: string | null
          created_at?: string | null
          customer_liable_amount?: number | null
          description: string
          equipment_id?: string | null
          estimated_repair_cost?: number | null
          id?: string
          incident_date?: string | null
          insurance_claim_filed?: boolean | null
          insurance_claim_number?: string | null
          location_of_incident?: string | null
          photos?: Json | null
          repair_status?: string | null
          report_number?: string | null
          report_type: string
          reported_at?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          responsibility?: string | null
          severity: string
          updated_at?: string | null
        }
        Update: {
          actual_repair_cost?: number | null
          assessed_at?: string | null
          booking_id?: string | null
          created_at?: string | null
          customer_liable_amount?: number | null
          description?: string
          equipment_id?: string | null
          estimated_repair_cost?: number | null
          id?: string
          incident_date?: string | null
          insurance_claim_filed?: boolean | null
          insurance_claim_number?: string | null
          location_of_incident?: string | null
          photos?: Json | null
          repair_status?: string | null
          report_number?: string | null
          report_type?: string
          reported_at?: string | null
          reported_by?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          responsibility?: string | null
          severity?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "damage_reports_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_reports_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_reports_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "mv_equipment_dashboard"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "damage_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "admin_audit_logs_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "damage_reports_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      database_performance_metrics: {
        Row: {
          active_connections: number | null
          avg_query_time_ms: number | null
          buffer_cache_hit_ratio: number | null
          cache_hit_ratio: number | null
          created_at: string | null
          deadlocks_count: number | null
          id: string
          idle_connections: number | null
          shared_buffers_used_mb: number | null
          slow_queries_count: number | null
          temp_bytes_written: number | null
          temp_files_created: number | null
          timestamp: string | null
          total_connections: number | null
          waiting_connections: number | null
          wal_generated_bytes: number | null
        }
        Insert: {
          active_connections?: number | null
          avg_query_time_ms?: number | null
          buffer_cache_hit_ratio?: number | null
          cache_hit_ratio?: number | null
          created_at?: string | null
          deadlocks_count?: number | null
          id?: string
          idle_connections?: number | null
          shared_buffers_used_mb?: number | null
          slow_queries_count?: number | null
          temp_bytes_written?: number | null
          temp_files_created?: number | null
          timestamp?: string | null
          total_connections?: number | null
          waiting_connections?: number | null
          wal_generated_bytes?: number | null
        }
        Update: {
          active_connections?: number | null
          avg_query_time_ms?: number | null
          buffer_cache_hit_ratio?: number | null
          cache_hit_ratio?: number | null
          created_at?: string | null
          deadlocks_count?: number | null
          id?: string
          idle_connections?: number | null
          shared_buffers_used_mb?: number | null
          slow_queries_count?: number | null
          temp_bytes_written?: number | null
          temp_files_created?: number | null
          timestamp?: string | null
          total_connections?: number | null
          waiting_connections?: number | null
          wal_generated_bytes?: number | null
        }
        Relationships: []
      }
      delivery_assignments: {
        Row: {
          actual_duration_minutes: number | null
          assigned_at: string | null
          assigned_by: string | null
          booking_id: string
          completed_at: string | null
          created_at: string | null
          driver_id: string
          driver_notes: string | null
          gps_tracking_data: Json | null
          id: string
          started_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_duration_minutes?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          booking_id: string
          completed_at?: string | null
          created_at?: string | null
          driver_id: string
          driver_notes?: string | null
          gps_tracking_data?: Json | null
          id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_duration_minutes?: number | null
          assigned_at?: string | null
          assigned_by?: string | null
          booking_id?: string
          completed_at?: string | null
          created_at?: string | null
          driver_id?: string
          driver_notes?: string | null
          gps_tracking_data?: Json | null
          id?: string
          started_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_assignments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_assignments_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          applicable_equipment_types: string[] | null
          code: string
          created_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          max_uses_per_user: number | null
          min_booking_amount: number | null
          name: string
          type: string
          updated_at: string | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          applicable_equipment_types?: string[] | null
          code: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_booking_amount?: number | null
          name: string
          type: string
          updated_at?: string | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          applicable_equipment_types?: string[] | null
          code?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          max_uses_per_user?: number | null
          min_booking_amount?: number | null
          name?: string
          type?: string
          updated_at?: string | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: []
      }
      document_relations: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          related_id: string
          related_table: string
          relation_type: string
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          related_id: string
          related_table: string
          relation_type: string
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          related_id?: string
          related_table?: string
          relation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_relations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string | null
          checksum: string
          created_at: string | null
          file_path: string
          file_size: number
          id: string
          is_template: boolean | null
          metadata: Json | null
          mime_type: string
          name: string
          parent_document_id: string | null
          tags: string[] | null
          template_variables: Json | null
          type: string
          updated_at: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          category?: string | null
          checksum: string
          created_at?: string | null
          file_path: string
          file_size: number
          id?: string
          is_template?: boolean | null
          metadata?: Json | null
          mime_type: string
          name: string
          parent_document_id?: string | null
          tags?: string[] | null
          template_variables?: Json | null
          type: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          category?: string | null
          checksum?: string
          created_at?: string | null
          file_path?: string
          file_size?: number
          id?: string
          is_template?: boolean | null
          metadata?: Json | null
          mime_type?: string
          name?: string
          parent_document_id?: string | null
          tags?: string[] | null
          template_variables?: Json | null
          type?: string
          updated_at?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          active_deliveries: number | null
          created_at: string | null
          current_location: string | null
          id: string
          is_available: boolean | null
          license_expiry: string | null
          license_number: string | null
          name: string
          notes: string | null
          phone: string | null
          total_deliveries_completed: number | null
          updated_at: string | null
          user_id: string | null
          vehicle_registration: string | null
          vehicle_type: string | null
        }
        Insert: {
          active_deliveries?: number | null
          created_at?: string | null
          current_location?: string | null
          id?: string
          is_available?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          total_deliveries_completed?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_registration?: string | null
          vehicle_type?: string | null
        }
        Update: {
          active_deliveries?: number | null
          created_at?: string | null
          current_location?: string | null
          id?: string
          is_available?: boolean | null
          license_expiry?: string | null
          license_number?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          total_deliveries_completed?: number | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_registration?: string | null
          vehicle_type?: string | null
        }
        Relationships: []
      }
      dynamic_pricing_rules: {
        Row: {
          applied_count: number | null
          conditions: Json
          created_at: string | null
          created_by: string | null
          description: string | null
          equipment_types: string[]
          id: string
          is_active: boolean | null
          max_applications: number | null
          name: string
          pricing_formula: Json
          priority: number
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applied_count?: number | null
          conditions: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equipment_types: string[]
          id?: string
          is_active?: boolean | null
          max_applications?: number | null
          name: string
          pricing_formula: Json
          priority?: number
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applied_count?: number | null
          conditions?: Json
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          equipment_types?: string[]
          id?: string
          is_active?: boolean | null
          max_applications?: number | null
          name?: string
          pricing_formula?: Json
          priority?: number
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          emails_bounced: number | null
          emails_clicked: number | null
          emails_delivered: number | null
          emails_failed: number | null
          emails_opened: number | null
          emails_sent: number | null
          html_content: string | null
          id: string
          metadata: Json | null
          name: string
          recipient_count: number | null
          recipient_filter: Json | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string
          template_id: string | null
          text_content: string | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emails_bounced?: number | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_failed?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          name: string
          recipient_count?: number | null
          recipient_filter?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          text_content?: string | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          emails_bounced?: number | null
          emails_clicked?: number | null
          emails_delivered?: number | null
          emails_failed?: number | null
          emails_opened?: number | null
          emails_sent?: number | null
          html_content?: string | null
          id?: string
          metadata?: Json | null
          name?: string
          recipient_count?: number | null
          recipient_filter?: Json | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          text_content?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          campaign_id: string | null
          clicked_at: string | null
          created_at: string | null
          delivered_at: string | null
          error_message: string | null
          failed_at: string | null
          id: string
          metadata: Json | null
          opened_at: string | null
          recipient_email: string
          recipient_name: string | null
          recipient_user_id: string | null
          retry_count: number | null
          sent_at: string | null
          status: string
          subject: string
          updated_at: string | null
        }
        Insert: {
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string | null
        }
        Update: {
          bounced_at?: string | null
          campaign_id?: string | null
          clicked_at?: string | null
          created_at?: string | null
          delivered_at?: string | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          metadata?: Json | null
          opened_at?: string | null
          recipient_email?: string
          recipient_name?: string | null
          recipient_user_id?: string | null
          retry_count?: number | null
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          html_content: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_type: string
          text_content: string | null
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_type: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          html_content?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_type?: string
          text_content?: string | null
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          attachments: Json | null
          category_id: string | null
          createdAt: string
          current_location_id: string | null
          dailyHourAllowance: number
          dailyRate: number
          description: string
          description_embedding: string | null
          documents: Json | null
          half_day_rate: number | null
          home_location_id: string | null
          hourly_rate: number | null
          id: string
          images: Json | null
          last_rental_date: string | null
          lastMaintenanceDate: string | null
          location: Json | null
          make: string
          minimum_rental_hours: number | null
          model: string
          monthlyRate: number
          nextMaintenanceDue: string | null
          notes: string | null
          overageHourlyRate: number
          replacementValue: number
          revenue_generated: number | null
          rider_required: boolean | null
          rider_template_id: string | null
          rider_version: string | null
          search_vector: unknown
          serialNumber: string
          specifications: Json | null
          status: string
          subcategory: string | null
          total_rental_days: number | null
          totalEngineHours: number
          type: string
          unitId: string
          updatedAt: string
          utilization_rate: number | null
          weeklyHourAllowance: number
          weeklyRate: number
          year: number
        }
        Insert: {
          attachments?: Json | null
          category_id?: string | null
          createdAt?: string
          current_location_id?: string | null
          dailyHourAllowance?: number
          dailyRate: number
          description: string
          description_embedding?: string | null
          documents?: Json | null
          half_day_rate?: number | null
          home_location_id?: string | null
          hourly_rate?: number | null
          id?: string
          images?: Json | null
          last_rental_date?: string | null
          lastMaintenanceDate?: string | null
          location?: Json | null
          make: string
          minimum_rental_hours?: number | null
          model: string
          monthlyRate: number
          nextMaintenanceDue?: string | null
          notes?: string | null
          overageHourlyRate: number
          replacementValue: number
          revenue_generated?: number | null
          rider_required?: boolean | null
          rider_template_id?: string | null
          rider_version?: string | null
          search_vector?: unknown
          serialNumber: string
          specifications?: Json | null
          status?: string
          subcategory?: string | null
          total_rental_days?: number | null
          totalEngineHours?: number
          type?: string
          unitId: string
          updatedAt?: string
          utilization_rate?: number | null
          weeklyHourAllowance?: number
          weeklyRate: number
          year: number
        }
        Update: {
          attachments?: Json | null
          category_id?: string | null
          createdAt?: string
          current_location_id?: string | null
          dailyHourAllowance?: number
          dailyRate?: number
          description?: string
          description_embedding?: string | null
          documents?: Json | null
          half_day_rate?: number | null
          home_location_id?: string | null
          hourly_rate?: number | null
          id?: string
          images?: Json | null
          last_rental_date?: string | null
          lastMaintenanceDate?: string | null
          location?: Json | null
          make?: string
          minimum_rental_hours?: number | null
          model?: string
          monthlyRate?: number
          nextMaintenanceDue?: string | null
          notes?: string | null
          overageHourlyRate?: number
          replacementValue?: number
          revenue_generated?: number | null
          rider_required?: boolean | null
          rider_template_id?: string | null
          rider_version?: string | null
          search_vector?: unknown
          serialNumber?: string
          specifications?: Json | null
          status?: string
          subcategory?: string | null
          total_rental_days?: number | null
          totalEngineHours?: number
          type?: string
          unitId?: string
          updatedAt?: string
          utilization_rate?: number | null
          weeklyHourAllowance?: number
          weeklyRate?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipment_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "equipment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_current_location_id_fkey"
            columns: ["current_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_home_location_id_fkey"
            columns: ["home_location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_attachments: {
        Row: {
          attachment_type: string
          compatible_equipment_categories: string[] | null
          compatible_models: string[] | null
          condition: string | null
          created_at: string | null
          daily_rate: number
          description: string | null
          id: string
          images: Json | null
          included_with_rental: boolean | null
          is_active: boolean | null
          monthly_rate: number | null
          name: string
          quantity_available: number | null
          quantity_in_use: number | null
          replacement_cost: number | null
          requires_training: boolean | null
          serial_number: string | null
          specifications: Json | null
          updated_at: string | null
          weekly_rate: number | null
        }
        Insert: {
          attachment_type: string
          compatible_equipment_categories?: string[] | null
          compatible_models?: string[] | null
          condition?: string | null
          created_at?: string | null
          daily_rate?: number
          description?: string | null
          id?: string
          images?: Json | null
          included_with_rental?: boolean | null
          is_active?: boolean | null
          monthly_rate?: number | null
          name: string
          quantity_available?: number | null
          quantity_in_use?: number | null
          replacement_cost?: number | null
          requires_training?: boolean | null
          serial_number?: string | null
          specifications?: Json | null
          updated_at?: string | null
          weekly_rate?: number | null
        }
        Update: {
          attachment_type?: string
          compatible_equipment_categories?: string[] | null
          compatible_models?: string[] | null
          condition?: string | null
          created_at?: string | null
          daily_rate?: number
          description?: string | null
          id?: string
          images?: Json | null
          included_with_rental?: boolean | null
          is_active?: boolean | null
          monthly_rate?: number | null
          name?: string
          quantity_available?: number | null
          quantity_in_use?: number | null
          replacement_cost?: number | null
          requires_training?: boolean | null
          serial_number?: string | null
          specifications?: Json | null
          updated_at?: string | null
          weekly_rate?: number | null
        }
        Relationships: []
      }
      equipment_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          insurance_multiplier: number | null
          is_active: boolean | null
          name: string
          requires_operator_training: boolean | null
          search_keywords: string[] | null
          slug: string
          typical_applications: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          insurance_multiplier?: number | null
          is_active?: boolean | null
          name: string
          requires_operator_training?: boolean | null
          search_keywords?: string[] | null
          slug: string
          typical_applications?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          insurance_multiplier?: number | null
          is_active?: boolean | null
          name?: string
          requires_operator_training?: boolean | null
          search_keywords?: string[] | null
          slug?: string
          typical_applications?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      equipment_lifecycle: {
        Row: {
          acquisition_cost: number
          acquisition_date: string
          created_at: string | null
          current_book_value: number | null
          depreciation_method: string | null
          depreciation_rate: number | null
          equipment_id: string
          id: string
          retirement_date: string | null
          retirement_reason: string | null
          roi_percentage: number | null
          stage: string
          total_maintenance_cost: number | null
          total_revenue_generated: number | null
          updated_at: string | null
          utilization_rate: number | null
        }
        Insert: {
          acquisition_cost: number
          acquisition_date: string
          created_at?: string | null
          current_book_value?: number | null
          depreciation_method?: string | null
          depreciation_rate?: number | null
          equipment_id: string
          id?: string
          retirement_date?: string | null
          retirement_reason?: string | null
          roi_percentage?: number | null
          stage: string
          total_maintenance_cost?: number | null
          total_revenue_generated?: number | null
          updated_at?: string | null
          utilization_rate?: number | null
        }
        Update: {
          acquisition_cost?: number
          acquisition_date?: string
          created_at?: string | null
          current_book_value?: number | null
          depreciation_method?: string | null
          depreciation_rate?: number | null
          equipment_id?: string
          id?: string
          retirement_date?: string | null
          retirement_reason?: string | null
          roi_percentage?: number | null
          stage?: string
          total_maintenance_cost?: number | null
          total_revenue_generated?: number | null
          updated_at?: string | null
          utilization_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_lifecycle_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_lifecycle_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "mv_equipment_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_maintenance: {
        Row: {
          attachments: Json | null
          completed_date: string | null
          cost: number | null
          created_at: string | null
          description: string | null
          equipment_id: string
          id: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          next_due_date: string | null
          next_due_hours: number | null
          notes: string | null
          parts_used: Json | null
          performed_by: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          scheduled_date: string
          status: Database["public"]["Enums"]["maintenance_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          equipment_id: string
          id?: string
          maintenance_type: Database["public"]["Enums"]["maintenance_type"]
          next_due_date?: string | null
          next_due_hours?: number | null
          notes?: string | null
          parts_used?: Json | null
          performed_by?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          scheduled_date: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string | null
          description?: string | null
          equipment_id?: string
          id?: string
          maintenance_type?: Database["public"]["Enums"]["maintenance_type"]
          next_due_date?: string | null
          next_due_hours?: number | null
          notes?: string | null
          parts_used?: Json | null
          performed_by?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          scheduled_date?: string
          status?: Database["public"]["Enums"]["maintenance_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_maintenance_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "mv_equipment_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_riders: {
        Row: {
          created_at: string | null
          description: string | null
          effective_date: string | null
          equipment_model: string | null
          equipment_type: string
          expiry_date: string | null
          id: string
          is_active: boolean | null
          required_fields: Json | null
          template_data: Json
          template_id: string
          title: string
          updated_at: string | null
          version: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          effective_date?: string | null
          equipment_model?: string | null
          equipment_type: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          required_fields?: Json | null
          template_data: Json
          template_id: string
          title: string
          updated_at?: string | null
          version: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          effective_date?: string | null
          equipment_model?: string | null
          equipment_type?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          required_fields?: Json | null
          template_data?: Json
          template_id?: string
          title?: string
          updated_at?: string | null
          version?: string
        }
        Relationships: []
      }
      equipment_utilization: {
        Row: {
          booking_id: string | null
          created_at: string | null
          date: string
          equipment_id: string
          fuel_consumed: number | null
          hours_used: number
          id: string
          revenue_generated: number | null
          utilization_percentage: number
        }
        Insert: {
          booking_id?: string | null
          created_at?: string | null
          date: string
          equipment_id: string
          fuel_consumed?: number | null
          hours_used?: number
          id?: string
          revenue_generated?: number | null
          utilization_percentage: number
        }
        Update: {
          booking_id?: string | null
          created_at?: string | null
          date?: string
          equipment_id?: string
          fuel_consumed?: number | null
          hours_used?: number
          id?: string
          revenue_generated?: number | null
          utilization_percentage?: number
        }
        Relationships: [
          {
            foreignKeyName: "equipment_utilization_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_utilization_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_utilization_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "mv_equipment_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      error_logs: {
        Row: {
          browser_info: Json | null
          created_at: string | null
          device_info: Json | null
          environment: string | null
          error_code: string | null
          error_level: string
          error_message: string
          error_stack: string | null
          error_type: string
          first_occurrence: string | null
          id: string
          ip_address: unknown
          last_occurrence: string | null
          location_data: Json | null
          metadata: Json | null
          occurrence_count: number | null
          request_body: string | null
          request_headers: Json | null
          request_method: string | null
          request_url: string | null
          resolution_notes: string | null
          resolved: boolean | null
          resolved_at: string | null
          response_status: number | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          version: string | null
        }
        Insert: {
          browser_info?: Json | null
          created_at?: string | null
          device_info?: Json | null
          environment?: string | null
          error_code?: string | null
          error_level: string
          error_message: string
          error_stack?: string | null
          error_type: string
          first_occurrence?: string | null
          id?: string
          ip_address?: unknown
          last_occurrence?: string | null
          location_data?: Json | null
          metadata?: Json | null
          occurrence_count?: number | null
          request_body?: string | null
          request_headers?: Json | null
          request_method?: string | null
          request_url?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          response_status?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          version?: string | null
        }
        Update: {
          browser_info?: Json | null
          created_at?: string | null
          device_info?: Json | null
          environment?: string | null
          error_code?: string | null
          error_level?: string
          error_message?: string
          error_stack?: string | null
          error_type?: string
          first_occurrence?: string | null
          id?: string
          ip_address?: unknown
          last_occurrence?: string | null
          location_data?: Json | null
          metadata?: Json | null
          occurrence_count?: number | null
          request_body?: string | null
          request_headers?: Json | null
          request_method?: string | null
          request_url?: string | null
          resolution_notes?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          response_status?: number | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          version?: string | null
        }
        Relationships: []
      }
      external_integrations: {
        Row: {
          api_key_encrypted: string | null
          configuration: Json
          created_at: string | null
          error_count: number | null
          id: string
          last_error: string | null
          last_error_at: string | null
          last_sync: string | null
          name: string
          provider: string | null
          rate_limits: Json | null
          status: Database["public"]["Enums"]["integration_status"] | null
          sync_frequency_minutes: number | null
          type: string
          updated_at: string | null
          webhook_url: string | null
        }
        Insert: {
          api_key_encrypted?: string | null
          configuration: Json
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          last_sync?: string | null
          name: string
          provider?: string | null
          rate_limits?: Json | null
          status?: Database["public"]["Enums"]["integration_status"] | null
          sync_frequency_minutes?: number | null
          type: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Update: {
          api_key_encrypted?: string | null
          configuration?: Json
          created_at?: string | null
          error_count?: number | null
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          last_sync?: string | null
          name?: string
          provider?: string | null
          rate_limits?: Json | null
          status?: Database["public"]["Enums"]["integration_status"] | null
          sync_frequency_minutes?: number | null
          type?: string
          updated_at?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      feature_usage_analytics: {
        Row: {
          created_at: string | null
          error_count: number | null
          feature_name: string
          first_used: string | null
          id: string
          last_used: string | null
          metadata: Json | null
          success_rate: number | null
          total_time_spent_seconds: number | null
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_count?: number | null
          feature_name: string
          first_used?: string | null
          id?: string
          last_used?: string | null
          metadata?: Json | null
          success_rate?: number | null
          total_time_spent_seconds?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_count?: number | null
          feature_name?: string
          first_used?: string | null
          id?: string
          last_used?: string | null
          metadata?: Json | null
          success_rate?: number | null
          total_time_spent_seconds?: number | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_transactions: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          cost_center: Database["public"]["Enums"]["cost_center"]
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          metadata: Json | null
          recorded_by: string | null
          reference_id: string | null
          reference_table: string | null
          revenue_stream: Database["public"]["Enums"]["revenue_stream"] | null
          transaction_type: string
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          cost_center: Database["public"]["Enums"]["cost_center"]
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          recorded_by?: string | null
          reference_id?: string | null
          reference_table?: string | null
          revenue_stream?: Database["public"]["Enums"]["revenue_stream"] | null
          transaction_type: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          cost_center?: Database["public"]["Enums"]["cost_center"]
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          recorded_by?: string | null
          reference_id?: string | null
          reference_table?: string | null
          revenue_stream?: Database["public"]["Enums"]["revenue_stream"] | null
          transaction_type?: string
        }
        Relationships: []
      }
      fleet_tracking: {
        Row: {
          battery_level: number | null
          created_at: string | null
          device_id: string | null
          diagnostic_codes: string[] | null
          engine_hours: number | null
          equipment_id: string
          fuel_level: number | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          is_online: boolean | null
          last_communication: string | null
          last_location_update: string | null
          metadata: Json | null
          odometer_reading: number | null
          provider: string | null
          temperature_celsius: number | null
          updated_at: string | null
        }
        Insert: {
          battery_level?: number | null
          created_at?: string | null
          device_id?: string | null
          diagnostic_codes?: string[] | null
          engine_hours?: number | null
          equipment_id: string
          fuel_level?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          is_online?: boolean | null
          last_communication?: string | null
          last_location_update?: string | null
          metadata?: Json | null
          odometer_reading?: number | null
          provider?: string | null
          temperature_celsius?: number | null
          updated_at?: string | null
        }
        Update: {
          battery_level?: number | null
          created_at?: string | null
          device_id?: string | null
          diagnostic_codes?: string[] | null
          engine_hours?: number | null
          equipment_id?: string
          fuel_level?: number | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          is_online?: boolean | null
          last_communication?: string | null
          last_location_update?: string | null
          metadata?: Json | null
          odometer_reading?: number | null
          provider?: string | null
          temperature_celsius?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fleet_tracking_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fleet_tracking_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "mv_equipment_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      id_verification_audits: {
        Row: {
          action: 'auto_decision' | 'manual_review_opened' | 'manual_review_resolved' | 'override_approved' | 'override_rejected'
          created_at: string
          id: string
          metadata: Json
          notes: string | null
          performed_by: string | null
          request_id: string
        }
        Insert: {
          action: 'auto_decision' | 'manual_review_opened' | 'manual_review_resolved' | 'override_approved' | 'override_rejected'
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          performed_by?: string | null
          request_id: string
        }
        Update: {
          action?: 'auto_decision' | 'manual_review_opened' | 'manual_review_resolved' | 'override_approved' | 'override_rejected'
          created_at?: string
          id?: string
          metadata?: Json
          notes?: string | null
          performed_by?: string | null
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "id_verification_audits_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_verification_audits_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "id_verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      id_verification_requests: {
        Row: {
          attempt_number: number
          booking_id: string
          consent_method: string | null
          consent_recorded_at: string | null
          created_at: string
          id: string
          idkit_session_id: string | null
          metadata: Json
          status: 'submitted' | 'processing' | 'approved' | 'manual_review' | 'rejected' | 'failed'
          updated_at: string
          user_id: string
        }
        Insert: {
          attempt_number?: number
          booking_id: string
          consent_method?: string | null
          consent_recorded_at?: string | null
          created_at?: string
          id?: string
          idkit_session_id?: string | null
          metadata?: Json
          status?: 'submitted' | 'processing' | 'approved' | 'manual_review' | 'rejected' | 'failed'
          updated_at?: string
          user_id: string
        }
        Update: {
          attempt_number?: number
          booking_id?: string
          consent_method?: string | null
          consent_recorded_at?: string | null
          created_at?: string
          id?: string
          idkit_session_id?: string | null
          metadata?: Json
          status?: 'submitted' | 'processing' | 'approved' | 'manual_review' | 'rejected' | 'failed'
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "id_verification_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_verification_requests_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "mv_booking_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "id_verification_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      id_verification_results: {
        Row: {
          created_at: string
          document_liveness_score: number | null
          document_status: 'passed' | 'failed' | 'suspected' | 'not_applicable' | null
          face_liveness_score: number | null
          face_match_score: number | null
          failure_reasons: string[] | null
          id: string
          processed_at: string | null
          raw_payload: Json | null
          request_id: string
          extracted_fields: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_liveness_score?: number | null
          document_status?: 'passed' | 'failed' | 'suspected' | 'not_applicable' | null
          face_liveness_score?: number | null
          face_match_score?: number | null
          failure_reasons?: string[] | null
          id?: string
          processed_at?: string | null
          raw_payload?: Json | null
          request_id: string
          extracted_fields?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_liveness_score?: number | null
          document_status?: 'passed' | 'failed' | 'suspected' | 'not_applicable' | null
          face_liveness_score?: number | null
          face_match_score?: number | null
          failure_reasons?: string[] | null
          id?: string
          processed_at?: string | null
          raw_payload?: Json | null
          request_id?: string
          extracted_fields?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "id_verification_results_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: true
            referencedRelation: "id_verification_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_documents: {
        Row: {
          additionalInsuredIncluded: boolean
          bookingId: string
          createdAt: string
          deductible: number | null
          description: string | null
          documentNumber: string
          effectiveDate: string | null
          equipmentLimit: number | null
          expiresAt: string | null
          extractedData: Json | null
          fileName: string
          fileSize: number
          fileUrl: string
          generalLiabilityLimit: number | null
          id: string
          insuranceCompany: string | null
          lossPayeeIncluded: boolean
          metadata: Json | null
          mimeType: string
          originalFileName: string
          policyNumber: string | null
          reviewedAt: string | null
          reviewedBy: string | null
          reviewNotes: string | null
          status: Database["public"]["Enums"]["insurance_documents_status_enum"]
          type: Database["public"]["Enums"]["insurance_documents_type_enum"]
          updatedAt: string
          validationResults: Json | null
          waiverOfSubrogationIncluded: boolean
        }
        Insert: {
          additionalInsuredIncluded?: boolean
          bookingId: string
          createdAt?: string
          deductible?: number | null
          description?: string | null
          documentNumber: string
          effectiveDate?: string | null
          equipmentLimit?: number | null
          expiresAt?: string | null
          extractedData?: Json | null
          fileName: string
          fileSize: number
          fileUrl: string
          generalLiabilityLimit?: number | null
          id?: string
          insuranceCompany?: string | null
          lossPayeeIncluded?: boolean
          metadata?: Json | null
          mimeType: string
          originalFileName: string
          policyNumber?: string | null
          reviewedAt?: string | null
          reviewedBy?: string | null
          reviewNotes?: string | null
          status?: Database["public"]["Enums"]["insurance_documents_status_enum"]
          type: Database["public"]["Enums"]["insurance_documents_type_enum"]
          updatedAt?: string
          validationResults?: Json | null
          waiverOfSubrogationIncluded?: boolean
        }
        Update: {
          additionalInsuredIncluded?: boolean
          bookingId?: string
          createdAt?: string
          deductible?: number | null
          description?: string | null
          documentNumber?: string
          effectiveDate?: string | null
          equipmentLimit?: number | null
          expiresAt?: string | null
          extractedData?: Json | null
          fileName?: string
          fileSize?: number
          fileUrl?: string
          generalLiabilityLimit?: number | null
          id?: string
          insuranceCompany?: string | null
          lossPayeeIncluded?: boolean
          metadata?: Json | null
          mimeType?: string
          originalFileName?: string
          policyNumber?: string | null
          reviewedAt?: string | null
          reviewedBy?: string | null
          reviewNotes?: string | null
          status?: Database["public"]["Enums"]["insurance_documents_status_enum"]
          type?: Database["public"]["Enums"]["insurance_documents_type_enum"]
          updatedAt?: string
          validationResults?: Json | null
          waiverOfSubrogationIncluded?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "FK_bb4b5834b845451e1a4652fa5b0"
            columns: ["bookingId"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address: string
          capacity_units: number | null
          city: string
          country: string | null
          created_at: string | null
          email: string | null
          geo_latitude: number | null
          geo_longitude: number | null
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          manager_id: string | null
          name: string
          notes: string | null
          operating_hours: Json | null
          phone: string | null
          postal_code: string | null
          province: string
          service_radius_km: number | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          address: string
          capacity_units?: number | null
          city: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          geo_latitude?: number | null
          geo_longitude?: number | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          manager_id?: string | null
          name: string
          notes?: string | null
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          province: string
          service_radius_km?: number | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          address?: string
          capacity_units?: number | null
          city?: string
          country?: string | null
          created_at?: string | null
          email?: string | null
          geo_latitude?: number | null
          geo_longitude?: number | null
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          manager_id?: string | null
          name?: string
          notes?: string | null
          operating_hours?: Json | null
          phone?: string | null
          postal_code?: string | null
          province?: string
          service_radius_km?: number | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "locations_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "admin_audit_logs_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "locations_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
          variables: Json | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          variables?: Json | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string | null
          cta_label: string | null
          delivered_at: string | null
          external_id: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          max_retries: number | null
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["priority_level"]
          read_at: string | null
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template_data: Json | null
          template_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_url?: string | null
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string | null
          cta_label?: string | null
          delivered_at?: string | null
          external_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          max_retries?: number | null
          message: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"]
          read_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_data?: Json | null
          template_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_url?: string | null
          category?: Database["public"]["Enums"]["notification_category"]
          created_at?: string | null
          cta_label?: string | null
          delivered_at?: string | null
          external_id?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          max_retries?: number | null
          message?: string
          metadata?: Json | null
          priority?: Database["public"]["Enums"]["priority_level"]
          read_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["notification_status"]
          template_data?: Json | null
          template_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      operator_certifications: {
        Row: {
          certification_number: string | null
          certification_type: string
          created_at: string | null
          customer_id: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          is_verified: boolean | null
          issue_date: string | null
          issuing_authority: string | null
          notes: string | null
          updated_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          certification_number?: string | null
          certification_type: string
          created_at?: string | null
          customer_id?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          certification_number?: string | null
          certification_type?: string
          created_at?: string | null
          customer_id?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          is_verified?: boolean | null
          issue_date?: string | null
          issuing_authority?: string | null
          notes?: string | null
          updated_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "operator_certifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "admin_audit_logs_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "operator_certifications_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_certifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "admin_audit_logs_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "operator_certifications_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_schedules: {
        Row: {
          amount: number
          booking_id: string | null
          created_at: string | null
          due_date: string
          id: string
          installment_number: number
          late_fee: number | null
          notes: string | null
          paid_at: string | null
          payment_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          booking_id?: string | null
          created_at?: string | null
          due_date: string
          id?: string
          installment_number: number
          late_fee?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          booking_id?: string | null
          created_at?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          late_fee?: number | null
          notes?: string | null
          paid_at?: string | null
          payment_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_schedules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_schedules_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          amountRefunded: number
          billingAddress: Json | null
          bookingId: string
          createdAt: string
          description: string | null
          failedAt: string | null
          failureReason: string | null
          id: string
          method: Database["public"]["Enums"]["payments_method_enum"]
          notes: string | null
          paymentNumber: string
          processedAt: string | null
          status: Database["public"]["Enums"]["payments_status_enum"]
          stripeChargeId: string | null
          stripeCheckoutSessionId: string | null
          stripeMetadata: Json | null
          stripePaymentIntentId: string | null
          stripeRefundId: string | null
          type: Database["public"]["Enums"]["payments_type_enum"]
          updatedAt: string
          webhookEvents: Json | null
        }
        Insert: {
          amount: number
          amountRefunded?: number
          billingAddress?: Json | null
          bookingId: string
          createdAt?: string
          description?: string | null
          failedAt?: string | null
          failureReason?: string | null
          id?: string
          method: Database["public"]["Enums"]["payments_method_enum"]
          notes?: string | null
          paymentNumber: string
          processedAt?: string | null
          status?: Database["public"]["Enums"]["payments_status_enum"]
          stripeChargeId?: string | null
          stripeCheckoutSessionId?: string | null
          stripeMetadata?: Json | null
          stripePaymentIntentId?: string | null
          stripeRefundId?: string | null
          type: Database["public"]["Enums"]["payments_type_enum"]
          updatedAt?: string
          webhookEvents?: Json | null
        }
        Update: {
          amount?: number
          amountRefunded?: number
          billingAddress?: Json | null
          bookingId?: string
          createdAt?: string
          description?: string | null
          failedAt?: string | null
          failureReason?: string | null
          id?: string
          method?: Database["public"]["Enums"]["payments_method_enum"]
          notes?: string | null
          paymentNumber?: string
          processedAt?: string | null
          status?: Database["public"]["Enums"]["payments_status_enum"]
          stripeChargeId?: string | null
          stripeCheckoutSessionId?: string | null
          stripeMetadata?: Json | null
          stripePaymentIntentId?: string | null
          stripeRefundId?: string | null
          type?: Database["public"]["Enums"]["payments_type_enum"]
          updatedAt?: string
          webhookEvents?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "FK_1ead3dc5d71db0ea822706e389d"
            columns: ["bookingId"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      predictive_models: {
        Row: {
          accuracy_score: number | null
          algorithm: string
          created_at: string | null
          created_by: string | null
          features: Json
          hyperparameters: Json | null
          id: string
          is_active: boolean | null
          last_trained: string | null
          model_type: string
          name: string
          training_data_query: string
          training_frequency_hours: number | null
          updated_at: string | null
        }
        Insert: {
          accuracy_score?: number | null
          algorithm: string
          created_at?: string | null
          created_by?: string | null
          features: Json
          hyperparameters?: Json | null
          id?: string
          is_active?: boolean | null
          last_trained?: string | null
          model_type: string
          name: string
          training_data_query: string
          training_frequency_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          accuracy_score?: number | null
          algorithm?: string
          created_at?: string | null
          created_by?: string | null
          features?: Json
          hyperparameters?: Json | null
          id?: string
          is_active?: boolean | null
          last_trained?: string | null
          model_type?: string
          name?: string
          training_data_query?: string
          training_frequency_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      rental_contracts: {
        Row: {
          bookingId: string
          completed_at: string | null
          contract_number: string
          contract_type: string
          created_at: string | null
          created_by: string | null
          docusign_envelope_id: string | null
          docusign_status: string | null
          generated_content: string | null
          id: string
          metadata: Json | null
          notes: string | null
          pdf_url: string | null
          sent_at: string | null
          signed_at: string | null
          signer_email: string | null
          signer_ip: unknown
          signer_name: string | null
          status: string
          template_id: string | null
          updated_at: string | null
          viewed_at: string | null
        }
        Insert: {
          bookingId: string
          completed_at?: string | null
          contract_number: string
          contract_type: string
          created_at?: string | null
          created_by?: string | null
          docusign_envelope_id?: string | null
          docusign_status?: string | null
          generated_content?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_ip?: unknown
          signer_name?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Update: {
          bookingId?: string
          completed_at?: string | null
          contract_number?: string
          contract_type?: string
          created_at?: string | null
          created_by?: string | null
          docusign_envelope_id?: string | null
          docusign_status?: string | null
          generated_content?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          pdf_url?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signer_email?: string | null
          signer_ip?: unknown
          signer_name?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_contracts_bookingId_fkey"
            columns: ["bookingId"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rental_contracts_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "contract_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      report_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          output_format: string | null
          parameters: Json | null
          query_template: string
          recipients: string[] | null
          schedule_cron: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          output_format?: string | null
          parameters?: Json | null
          query_template: string
          recipients?: string[] | null
          schedule_cron?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          output_format?: string | null
          parameters?: Json | null
          query_template?: string
          recipients?: string[] | null
          schedule_cron?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      risk_assessments: {
        Row: {
          assessment_type: string
          created_at: string | null
          entity_id: string
          entity_type: string
          id: string
          mitigation_strategies: string[] | null
          next_review_date: string | null
          review_required: boolean | null
          reviewed_at: string | null
          reviewed_by: string | null
          risk_factors: Json
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
          updated_at: string | null
        }
        Insert: {
          assessment_type: string
          created_at?: string | null
          entity_id: string
          entity_type: string
          id?: string
          mitigation_strategies?: string[] | null
          next_review_date?: string | null
          review_required?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_factors: Json
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
          updated_at?: string | null
        }
        Update: {
          assessment_type?: string
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          mitigation_strategies?: string[] | null
          next_review_date?: string | null
          review_required?: boolean | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          risk_factors?: Json
          risk_level?: Database["public"]["Enums"]["risk_level"]
          risk_score?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      schedules: {
        Row: {
          booking_id: string
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          idempotency_key: string | null
          job_type: string
          max_retries: number | null
          metadata: Json | null
          retry_count: number | null
          run_at_utc: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          booking_id: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          job_type: string
          max_retries?: number | null
          metadata?: Json | null
          retry_count?: number | null
          run_at_utc: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_id?: string
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          idempotency_key?: string | null
          job_type?: string
          max_retries?: number | null
          metadata?: Json | null
          retry_count?: number | null
          run_at_utc?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "schedules_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      search_index: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          metadata: Json | null
          result_id: string
          result_type: Database["public"]["Enums"]["search_result_type"]
          searchable_text: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          metadata?: Json | null
          result_id: string
          result_type: Database["public"]["Enums"]["search_result_type"]
          searchable_text: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          metadata?: Json | null
          result_id?: string
          result_type?: Database["public"]["Enums"]["search_result_type"]
          searchable_text?: string
          title?: string
        }
        Relationships: []
      }
      seasonal_pricing: {
        Row: {
          created_at: string | null
          end_date: string
          equipment_type: string
          id: string
          is_active: boolean | null
          multiplier: number
          name: string
          start_date: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          end_date: string
          equipment_type: string
          id?: string
          is_active?: boolean | null
          multiplier: number
          name: string
          start_date: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string
          equipment_type?: string
          id?: string
          is_active?: boolean | null
          multiplier?: number
          name?: string
          start_date?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      spin_prizes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          percentage: number
          promo_code: string | null
          stripe_coupon_id: string | null
          updated_at: string
          weight: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          percentage: number
          promo_code?: string | null
          stripe_coupon_id?: string | null
          updated_at?: string
          weight: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          percentage?: number
          promo_code?: string | null
          stripe_coupon_id?: string | null
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      spin_sessions: {
        Row: {
          booking_id: string | null
          completed: boolean | null
          coupon_code: string | null
          created_at: string
          current_spin: number
          device_fingerprint_hash: string | null
          email: string | null
          expires_at: string
          final_prize_percentage: number | null
          id: string
          ip_address: string | null
          is_first_booking_only: boolean | null
          outcomes: Json | null
          phone: string | null
          prize_pct: number | null
          promo_code: string | null
          session_token: string
          spin_1_result: string | null
          spin_2_result: string | null
          spin_3_result: string | null
          spins_allowed: number
          spins_used: number
          updated_at: string
          used_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          booking_id?: string | null
          completed?: boolean | null
          coupon_code?: string | null
          created_at?: string
          current_spin?: number
          device_fingerprint_hash?: string | null
          email?: string | null
          expires_at: string
          final_prize_percentage?: number | null
          id?: string
          ip_address?: string | null
          is_first_booking_only?: boolean | null
          outcomes?: Json | null
          phone?: string | null
          prize_pct?: number | null
          promo_code?: string | null
          session_token: string
          spin_1_result?: string | null
          spin_2_result?: string | null
          spin_3_result?: string | null
          spins_allowed?: number
          spins_used?: number
          updated_at?: string
          used_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          booking_id?: string | null
          completed?: boolean | null
          coupon_code?: string | null
          created_at?: string
          current_spin?: number
          device_fingerprint_hash?: string | null
          email?: string | null
          expires_at?: string
          final_prize_percentage?: number | null
          id?: string
          ip_address?: string | null
          is_first_booking_only?: boolean | null
          outcomes?: Json | null
          phone?: string | null
          prize_pct?: number | null
          promo_code?: string | null
          session_token?: string
          spin_1_result?: string | null
          spin_2_result?: string | null
          spin_3_result?: string | null
          spins_allowed?: number
          spins_used?: number
          updated_at?: string
          used_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "spin_sessions_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          booking_id: string | null
          category: string | null
          created_at: string | null
          customer_id: string
          description: string
          equipment_id: string | null
          first_response_at: string | null
          id: string
          internal_notes: string | null
          metadata: Json | null
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          satisfaction_score: number | null
          search_vector: unknown
          status: string | null
          subject: string
          tags: string[] | null
          ticket_number: string
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          customer_id: string
          description: string
          equipment_id?: string | null
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          metadata?: Json | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_score?: number | null
          search_vector?: unknown
          status?: string | null
          subject: string
          tags?: string[] | null
          ticket_number: string
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          booking_id?: string | null
          category?: string | null
          created_at?: string | null
          customer_id?: string
          description?: string
          equipment_id?: string | null
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          metadata?: Json | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          satisfaction_score?: number | null
          search_vector?: unknown
          status?: string | null
          subject?: string
          tags?: string[] | null
          ticket_number?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_tickets_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "mv_equipment_dashboard"
            referencedColumns: ["id"]
          },
        ]
      }
      system_config: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string | null
          value: Json
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string | null
          value: Json
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string | null
          value?: Json
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_category: string
          metric_name: string
          metric_value: number
          timestamp: string | null
          unit: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_category: string
          metric_name: string
          metric_value: number
          timestamp?: string | null
          unit?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_category?: string
          metric_name?: string
          metric_value?: number
          timestamp?: string | null
          unit?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string
          created_at: string | null
          id: string
          settings: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          settings?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          settings?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      usage_costs: {
        Row: {
          category: string
          created_at: string | null
          currency: string | null
          date: string
          id: string
          metadata: Json | null
          subcategory: string | null
          total_cost: number
          unit_cost: number
          units: number
        }
        Insert: {
          category: string
          created_at?: string | null
          currency?: string | null
          date: string
          id?: string
          metadata?: Json | null
          subcategory?: string | null
          total_cost: number
          unit_cost: number
          units: number
        }
        Update: {
          category?: string
          created_at?: string | null
          currency?: string | null
          date?: string
          id?: string
          metadata?: Json | null
          subcategory?: string | null
          total_cost?: number
          unit_cost?: number
          units?: number
        }
        Relationships: []
      }
      users: {
        Row: {
          address: string | null
          auto_approve_bookings: boolean | null
          avatar_url: string | null
          city: string | null
          companyName: string | null
          country: string | null
          createdAt: string
          credit_limit: number | null
          credit_used: number | null
          dateOfBirth: string | null
          driversLicense: string | null
          drivers_license_expiry: string | null
          drivers_license_number: string | null
          drivers_license_province: string | null
          drivers_license_verified_at: string | null
          email: string
          emailVerificationExpires: string | null
          emailVerificationToken: string | null
          emailVerified: boolean
          firstName: string | null
          id: string
          lastLoginAt: string | null
          lastLoginIp: unknown
          lastName: string | null
          passwordHash: string | null
          payment_terms_days: number | null
          phone: string | null
          phoneVerified: boolean
          postalCode: string | null
          preferences: Json | null
          province: string | null
          requires_deposit: boolean | null
          resetToken: string | null
          resetTokenExpires: string | null
          role: Database["public"]["Enums"]["users_role_enum"]
          status: Database["public"]["Enums"]["users_status_enum"]
          stripeCustomerId: string | null
          twoFactorEnabled: boolean
          twoFactorSecret: string | null
          updatedAt: string
        }
        Insert: {
          address?: string | null
          auto_approve_bookings?: boolean | null
          avatar_url?: string | null
          city?: string | null
          companyName?: string | null
          country?: string | null
          createdAt?: string
          credit_limit?: number | null
          credit_used?: number | null
          dateOfBirth?: string | null
          driversLicense?: string | null
          drivers_license_expiry?: string | null
          drivers_license_number?: string | null
          drivers_license_province?: string | null
          drivers_license_verified_at?: string | null
          email: string
          emailVerificationExpires?: string | null
          emailVerificationToken?: string | null
          emailVerified?: boolean
          firstName?: string | null
          id?: string
          lastLoginAt?: string | null
          lastLoginIp?: unknown
          lastName?: string | null
          passwordHash?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          phoneVerified?: boolean
          postalCode?: string | null
          preferences?: Json | null
          province?: string | null
          requires_deposit?: boolean | null
          resetToken?: string | null
          resetTokenExpires?: string | null
          role?: Database["public"]["Enums"]["users_role_enum"]
          status?: Database["public"]["Enums"]["users_status_enum"]
          stripeCustomerId?: string | null
          twoFactorEnabled?: boolean
          twoFactorSecret?: string | null
          updatedAt?: string
        }
        Update: {
          address?: string | null
          auto_approve_bookings?: boolean | null
          avatar_url?: string | null
          city?: string | null
          companyName?: string | null
          country?: string | null
          createdAt?: string
          credit_limit?: number | null
          credit_used?: number | null
          dateOfBirth?: string | null
          driversLicense?: string | null
          drivers_license_expiry?: string | null
          drivers_license_number?: string | null
          drivers_license_province?: string | null
          drivers_license_verified_at?: string | null
          email?: string
          emailVerificationExpires?: string | null
          emailVerificationToken?: string | null
          emailVerified?: boolean
          firstName?: string | null
          id?: string
          lastLoginAt?: string | null
          lastLoginIp?: unknown
          lastName?: string | null
          passwordHash?: string | null
          payment_terms_days?: number | null
          phone?: string | null
          phoneVerified?: boolean
          postalCode?: string | null
          preferences?: Json | null
          province?: string | null
          requires_deposit?: boolean | null
          resetToken?: string | null
          resetTokenExpires?: string | null
          role?: Database["public"]["Enums"]["users_role_enum"]
          status?: Database["public"]["Enums"]["users_status_enum"]
          stripeCustomerId?: string | null
          twoFactorEnabled?: boolean
          twoFactorSecret?: string | null
          updatedAt?: string
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          created_at: string | null
          event_type: Database["public"]["Enums"]["webhook_event_type"]
          id: string
          last_error: string | null
          max_retries: number | null
          next_retry_at: string | null
          payload: Json
          processed_at: string | null
          retry_count: number | null
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: Database["public"]["Enums"]["webhook_event_type"]
          id?: string
          last_error?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          payload: Json
          processed_at?: string | null
          retry_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: Database["public"]["Enums"]["webhook_event_type"]
          id?: string
          last_error?: string | null
          max_retries?: number | null
          next_retry_at?: string | null
          payload?: Json
          processed_at?: string | null
          retry_count?: number | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      workflow_templates: {
        Row: {
          actions: Json[]
          conditions: Json | null
          created_at: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          name: string
          success_rate: number | null
          trigger_event: string
          updated_at: string | null
        }
        Insert: {
          actions: Json[]
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          success_rate?: number | null
          trigger_event: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json[]
          conditions?: Json | null
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          success_rate?: number | null
          trigger_event?: string
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_audit_logs_view: {
        Row: {
          action: Database["public"]["Enums"]["audit_action"] | null
          created_at: string | null
          id: string | null
          ip_address: unknown
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          session_id: string | null
          table_name: string | null
          user_agent: string | null
          user_email: string | null
          user_first_name: string | null
          user_id: string | null
          user_last_name: string | null
          user_role: Database["public"]["Enums"]["users_role_enum"] | null
        }
        Relationships: []
      }
      mv_equipment_dashboard: {
        Row: {
          currently_rented: number | null
          dailyRate: number | null
          id: string | null
          make: string | null
          model: string | null
          return_date: string | null
          status: string | null
          total_bookings: number | null
          total_days_rented: number | null
          total_revenue: number | null
          unitId: string | null
        }
        Relationships: []
      }
      pending_manual_fixes: {
        Row: {
          category: string | null
          description: string | null
          instructions: string | null
          priority: string | null
          title: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          instructions?: string | null
          priority?: string | null
          title?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          instructions?: string | null
          priority?: string | null
          title?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      apply_discount_code: {
        Args: { p_booking_id: string; p_discount_code: string }
        Returns: {
          discount_applied: number
          discount_description: string
          new_total: number
          success: boolean
        }[]
      }
      assess_customer_risk: {
        Args: { customer_id: string }
        Returns: {
          risk_factors: Json
          risk_level: Database["public"]["Enums"]["risk_level"]
          risk_score: number
        }[]
      }
      auto_return_equipment_to_available: { Args: never; Returns: undefined }
      calculate_booking_pricing: {
        Args: {
          p_customer_id?: string
          p_end_date: string
          p_equipment_id: string
          p_start_date: string
        }
        Returns: {
          daily_rate: number
          delivery_fee: number
          float_fee: number
          monthly_rate: number
          seasonal_multiplier: number
          security_deposit: number
          subtotal: number
          taxes: number
          total_amount: number
          weekly_rate: number
        }[]
      }
      calculate_conversion_funnel: {
        Args: never
        Returns: {
          avg_time_to_stage: number
          conversion_rate: number
          funnel_stage: string
          users_count: number
        }[]
      }
      calculate_customer_tier: {
        Args: { customer_id: string }
        Returns: Database["public"]["Enums"]["customer_tier"]
      }
      check_equipment_availability: {
        Args: {
          p_end_date: string
          p_equipment_id: string
          p_exclude_booking_id?: string
          p_start_date: string
        }
        Returns: {
          blackout_dates: string[]
          conflicting_bookings: number
          is_available: boolean
          next_available_date: string
        }[]
      }
      confirm_stripe_payment:
        | {
            Args: { p_payment_intent_id: string }
            Returns: {
              charge_id: string
              error_message: string
              success: boolean
            }[]
          }
        | {
            Args: { booking_id: string; payment_intent_id: string }
            Returns: Json
          }
      create_audit_log: {
        Args: {
          action: Database["public"]["Enums"]["audit_action"]
          new_values?: Json
          old_values?: Json
          record_id: string
          table_name: string
          user_id?: string
        }
        Returns: string
      }
      create_booking_notifications: {
        Args: { p_booking_id: string }
        Returns: {
          notification_id: string
          notification_type: string
          recipient_email: string
          status: string
        }[]
      }
      create_maintenance_reminders: {
        Args: never
        Returns: {
          equipment_id: string
          notification_id: string
          notification_type: string
          status: string
        }[]
      }
      create_payment_reminders: {
        Args: { p_booking_id: string }
        Returns: {
          notification_id: string
          notification_type: string
          recipient_email: string
          status: string
        }[]
      }
      evaluate_alert_rules: {
        Args: never
        Returns: {
          alert_name: string
          alert_rule_id: string
          current_value: number
          incident_created: boolean
          severity: string
          threshold_value: number
        }[]
      }
      evaluate_dynamic_pricing: {
        Args: {
          p_customer_id: string
          p_end_date: string
          p_equipment_id: string
          p_start_date: string
        }
        Returns: {
          adjusted_price: number
          adjustment_amount: number
          adjustment_reason: string
          base_price: number
          rule_id: string
          rule_name: string
        }[]
      }
      find_similar_customers: {
        Args: {
          limit_count?: number
          similarity_threshold?: number
          target_customer_id: string
        }
        Returns: {
          customer_id: string
          email: string
          similarity_score: number
          total_bookings: number
        }[]
      }
      generate_booking_contract: {
        Args: { p_booking_id: string }
        Returns: {
          contract_id: string
          document_id: string
          status: string
        }[]
      }
      generate_contest_referral_code: {
        Args: { p_entrant_id: string }
        Returns: string
      }
      generate_contract_upload_path: {
        Args: { p_booking_id: string; p_contract_id: string }
        Returns: string
      }
      generate_daily_analytics: { Args: never; Returns: undefined }
      generate_insurance_upload_path: {
        Args: { p_booking_id: string; p_file_name: string }
        Returns: string
      }
      generate_license_upload_path: {
        Args: { p_file_name: string; p_user_id: string }
        Returns: string
      }
      generate_rental_contract: {
        Args: { p_booking_id: string }
        Returns: Json
      }
      generate_weekly_business_report: {
        Args: never
        Returns: {
          change_percentage: number
          current_period: number
          metric_name: string
          previous_period: number
          trend: string
        }[]
      }
      generate_weekly_report:
        | {
            Args: { p_week_start?: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.generate_weekly_report(p_week_start => text), public.generate_weekly_report(p_week_start => date). Try renaming the parameters or the function itself in the database so function overloading can be resolved"[]
          }
        | {
            Args: { p_week_start?: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.generate_weekly_report(p_week_start => text), public.generate_weekly_report(p_week_start => date). Try renaming the parameters or the function itself in the database so function overloading can be resolved"[]
          }
      get_audit_logs_filtered: {
        Args: {
          p_action?: string
          p_end_date?: string
          p_limit?: number
          p_offset?: number
          p_start_date?: string
          p_table_name?: string
          p_user_id?: string
        }
        Returns: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          new_values: Json
          old_values: Json
          record_id: string
          table_name: string
          user_agent: string
          user_email: string
          user_name: string
          user_role: string
        }[]
      }
      get_booking_conversion_funnel: {
        Args: never
        Returns: {
          avg_time_to_stage: number
          conversion_rate: number
          stage: string
          user_count: number
        }[]
      }
      get_booking_details: {
        Args: { p_booking_id: string }
        Returns: {
          booking_id: string
          booking_number: string
          contract_status: string
          customer_email: string
          customer_name: string
          end_date: string
          equipment_model: string
          equipment_unit_id: string
          insurance_status: string
          maintenance_due: string
          payments_total: number
          start_date: string
          status: string
          total_amount: number
          utilization_hours: number
        }[]
      }
      get_customer_analytics_dashboard: {
        Args: never
        Returns: {
          avg_booking_frequency: number
          avg_booking_value: number
          churn_risk_score: number
          customer_count: number
          customer_tier: Database["public"]["Enums"]["customer_tier"]
          top_issue_category: string
          total_revenue: number
        }[]
      }
      get_customers_with_stats: {
        Args: never
        Returns: {
          address: string
          city: string
          company: string
          email: string
          firstName: string
          id: string
          isActive: boolean
          isVerified: boolean
          lastBooking: string
          lastName: string
          phone: string
          postalCode: string
          province: string
          registrationDate: string
          status: string
          totalBookings: number
          totalSpent: number
        }[]
      }
      get_dashboard_metrics: {
        Args: { p_date_range?: string }
        Returns: {
          change_percentage: number
          current_value: number
          metric_name: string
          previous_value: number
          trend: string
        }[]
      }
      get_entrant_entry_count: {
        Args: { p_contest_month: string; p_entrant_id: string }
        Returns: number
      }
      get_equipment_image_url: {
        Args: { equipment_id: string; transformation?: string }
        Returns: string
      }
      get_equipment_utilization_dashboard: {
        Args: never
        Returns: {
          avg_booking_duration_days: number
          equipment_id: string
          equipment_model: string
          last_booking_date: string
          maintenance_due_days: number
          total_bookings: number
          total_revenue: number
          utilization_percentage: number
        }[]
      }
      get_fleet_performance_dashboard: {
        Args: never
        Returns: {
          downtime_hours: number
          efficiency_score: number
          equipment_id: string
          maintenance_cost: number
          model: string
          profitability_score: number
          revenue_generated: number
          utilization_rate: number
        }[]
      }
      get_live_availability_count: {
        Args: never
        Returns: {
          available_count: number
          equipment_type: string
          maintenance_count: number
          rented_count: number
          total_count: number
        }[]
      }
      get_revenue_analytics_dashboard: {
        Args: { p_date_range?: string }
        Returns: {
          avg_booking_value: number
          booking_count: number
          growth_percentage: number
          period: string
          top_customer_segment: string
          top_equipment_model: string
          total_revenue: number
        }[]
      }
      get_signed_contract_url: {
        Args: { p_contract_id: string; p_expires_in?: number }
        Returns: string
      }
      global_search: {
        Args: { p_search_term: string }
        Returns: {
          description: string
          metadata: Json
          relevance_score: number
          result_id: string
          result_type: Database["public"]["Enums"]["search_result_type"]
          title: string
        }[]
      }
      handle_contract_signed_webhook: {
        Args: { p_contract_id: string; p_signature_data: Json }
        Returns: undefined
      }
      initiate_customer_onboarding: {
        Args: { p_customer_id: string }
        Returns: {
          notification_id: string
          notification_type: string
          status: string
          step_number: number
        }[]
      }
      is_admin:
        | { Args: { user_id: string }; Returns: boolean }
        | { Args: never; Returns: boolean }
      is_contest_rate_limited: {
        Args: { p_ip_address: unknown }
        Returns: boolean
      }
      is_spin_rate_limited: {
        Args: {
          p_identifier_type: string
          p_identifier_value: string
          p_max_attempts?: number
          p_window_hours?: number
        }
        Returns: boolean
      }
      log_audit_event:
        | {
            Args: {
              p_action: Database["public"]["Enums"]["audit_action"]
              p_new_values?: Json
              p_old_values?: Json
              p_record_id: string
              p_table_name: string
              p_user_id?: string
            }
            Returns: string
          }
        | {
            Args: { event_data?: Json; event_type: string; user_id?: string }
            Returns: string
          }
      log_error: {
        Args: {
          p_environment?: string
          p_error_level: string
          p_error_message: string
          p_error_stack?: string
          p_error_type: string
          p_request_method?: string
          p_request_url?: string
          p_response_status?: number
          p_session_id?: string
          p_user_agent?: string
          p_user_id?: string
        }
        Returns: string
      }
      mark_all_notifications_read: {
        Args: never
        Returns: {
          action_url: string | null
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string | null
          cta_label: string | null
          delivered_at: string | null
          external_id: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          max_retries: number | null
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["priority_level"]
          read_at: string | null
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template_data: Json | null
          template_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_notification_read: {
        Args: { p_notification_id: string }
        Returns: {
          action_url: string | null
          category: Database["public"]["Enums"]["notification_category"]
          created_at: string | null
          cta_label: string | null
          delivered_at: string | null
          external_id: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          max_retries: number | null
          message: string
          metadata: Json | null
          priority: Database["public"]["Enums"]["priority_level"]
          read_at: string | null
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["notification_status"]
          template_data: Json | null
          template_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          updated_at: string | null
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      monitor_database_performance: {
        Args: never
        Returns: {
          current_value: number
          metric_name: string
          recommendation: string
          status: string
        }[]
      }
      optimize_database_performance: {
        Args: never
        Returns: {
          action_taken: string
          details: string
          impact: string
          optimization_type: string
        }[]
      }
      owns_booking: { Args: { p_booking_id: string }; Returns: boolean }
      owns_contract: { Args: { p_contract_id: string }; Returns: boolean }
      process_pending_notifications: { Args: never; Returns: undefined }
      process_stripe_payment:
        | {
            Args: {
              p_amount: number
              p_booking_id: string
              p_currency?: string
              p_description?: string
            }
            Returns: {
              client_secret: string
              error_message: string
              payment_intent_id: string
              success: boolean
            }[]
          }
        | {
            Args: {
              booking_id: string
              payment_amount: number
              payment_method_id: string
            }
            Returns: Json
          }
      process_stripe_refund:
        | {
            Args: { p_amount?: number; p_charge_id: string; p_reason?: string }
            Returns: {
              error_message: string
              refund_id: string
              success: boolean
            }[]
          }
        | {
            Args: { payment_id: string; reason: string; refund_amount: number }
            Returns: Json
          }
      recalculate_all_entry_counts: {
        Args: never
        Returns: {
          entrant_id: string
          new_count: number
          old_count: number
        }[]
      }
      record_spin_attempt: {
        Args: { p_identifier_type: string; p_identifier_value: string }
        Returns: undefined
      }
      refresh_materialized_views: { Args: never; Returns: undefined }
      search_equipment: {
        Args: { search_query: string }
        Returns: {
          dailyRate: number
          description: string
          id: string
          make: string
          model: string
          rank: number
          status: string
        }[]
      }
      search_equipment_hybrid: {
        Args: {
          match_count?: number
          query_embedding?: string
          search_query: string
        }
        Returns: {
          dailyRate: number
          description: string
          id: string
          model: string
          rank: number
          semantic_score: number
        }[]
      }
      search_equipment_semantic: {
        Args: {
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          dailyRate: number
          description: string
          id: string
          model: string
          similarity: number
        }[]
      }
      send_contract_via_opensign: {
        Args: { p_booking_id: string; p_contract_id: string }
        Returns: Json
      }
      send_email_notification:
        | {
            Args: {
              p_body: string
              p_subject: string
              p_template_data?: Json
              p_template_id?: string
              p_to_email: string
            }
            Returns: {
              error_message: string
              message_id: string
              success: boolean
            }[]
          }
        | {
            Args: {
              p_subject: string
              p_template_data?: Json
              p_template_id?: string
              p_to_email: string
              p_user_id?: string
            }
            Returns: {
              error_message: string
              message_id: string
              success: boolean
            }[]
          }
      send_email_via_sendgrid: {
        Args: {
          p_from?: string
          p_html: string
          p_subject: string
          p_to: string
        }
        Returns: Json
      }
      track_api_analytics: {
        Args: {
          p_endpoint: string
          p_error_type?: string
          p_method: string
          p_request_size?: number
          p_response_size?: number
          p_response_time_ms: number
          p_status_code: number
          p_user_agent?: string
          p_user_id: string
        }
        Returns: undefined
      }
      track_customer_behavior: {
        Args: {
          p_customer_id: string
          p_event_data?: Json
          p_event_name: string
          p_event_type: string
          p_page_url?: string
          p_referrer_url?: string
          p_scroll_depth?: number
          p_session_id?: string
          p_time_on_page?: number
        }
        Returns: undefined
      }
      update_daily_analytics: { Args: never; Returns: undefined }
      update_equipment_utilization_metrics: { Args: never; Returns: undefined }
      update_search_index: { Args: never; Returns: undefined }
      validate_contest_referral: {
        Args: { p_referee_id: string; p_referral_code: string }
        Returns: undefined
      }
    }
    Enums: {
      audit_action:
        | "create"
        | "update"
        | "delete"
        | "login"
        | "logout"
        | "payment"
        | "booking"
        | "cancel"
      backup_status: "pending" | "running" | "completed" | "failed"
      block_reason_enum:
        | "booked"
        | "maintenance"
        | "blackout"
        | "buffer"
        | "reserved"
      bookings_status_enum:
        | "pending"
        | "confirmed"
        | "paid"
        | "insurance_verified"
        | "ready_for_pickup"
        | "delivered"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "rejected"
        | "no_show"
        | "verify_hold_ok"
        | "deposit_scheduled"
        | "hold_placed"
        | "returned_ok"
        | "captured"
      bookings_type_enum: "delivery" | "pickup"
      contracts_status_enum:
        | "draft"
        | "sent_for_signature"
        | "signed"
        | "declined"
        | "voided"
        | "expired"
        | "delivered"
        | "completed"
      contracts_type_enum:
        | "rental_agreement"
        | "rider"
        | "terms_and_conditions"
        | "combined"
      cost_center:
        | "equipment"
        | "maintenance"
        | "marketing"
        | "operations"
        | "administrative"
      customer_tier: "bronze" | "silver" | "gold" | "platinum" | "enterprise"
      insurance_documents_status_enum:
        | "pending"
        | "under_review"
        | "approved"
        | "rejected"
        | "expired"
      insurance_documents_type_enum: "coi" | "binder" | "policy" | "endorsement"
      integration_status: "active" | "inactive" | "error" | "maintenance"
      maintenance_status:
        | "scheduled"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "overdue"
      maintenance_type:
        | "scheduled"
        | "preventive"
        | "repair"
        | "emergency"
        | "inspection"
      notification_category:
        | "system"
        | "booking"
        | "payment"
        | "equipment"
        | "reminder"
        | "support"
        | "compliance"
        | "marketing"
      notification_status:
        | "pending"
        | "sent"
        | "delivered"
        | "failed"
        | "cancelled"
      notification_type: "email" | "sms" | "push" | "webhook" | "in_app"
      payments_method_enum:
        | "credit_card"
        | "debit_card"
        | "bank_transfer"
        | "cash"
        | "check"
      payments_status_enum:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded"
        | "partially_refunded"
      payments_type_enum: "deposit" | "payment" | "refund" | "additional_charge"
      priority_level: "low" | "medium" | "high" | "critical"
      revenue_stream:
        | "rental_income"
        | "delivery_fees"
        | "overtime_charges"
        | "damage_fees"
        | "insurance_claims"
      risk_level: "low" | "medium" | "high" | "critical"
      search_result_type: "equipment" | "booking" | "customer" | "contract"
      users_role_enum: "customer" | "admin" | "super_admin"
      users_status_enum: "active" | "inactive" | "suspended"
      webhook_event_type:
        | "booking_created"
        | "booking_updated"
        | "payment_received"
        | "contract_signed"
        | "equipment_maintenance_due"
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
      audit_action: [
        "create",
        "update",
        "delete",
        "login",
        "logout",
        "payment",
        "booking",
        "cancel",
      ],
      backup_status: ["pending", "running", "completed", "failed"],
      block_reason_enum: [
        "booked",
        "maintenance",
        "blackout",
        "buffer",
        "reserved",
      ],
      bookings_status_enum: [
        "pending",
        "confirmed",
        "paid",
        "insurance_verified",
        "ready_for_pickup",
        "delivered",
        "in_progress",
        "completed",
        "cancelled",
        "rejected",
        "no_show",
        "verify_hold_ok",
        "deposit_scheduled",
        "hold_placed",
        "returned_ok",
        "captured",
      ],
      bookings_type_enum: ["delivery", "pickup"],
      contracts_status_enum: [
        "draft",
        "sent_for_signature",
        "signed",
        "declined",
        "voided",
        "expired",
        "delivered",
        "completed",
      ],
      contracts_type_enum: [
        "rental_agreement",
        "rider",
        "terms_and_conditions",
        "combined",
      ],
      cost_center: [
        "equipment",
        "maintenance",
        "marketing",
        "operations",
        "administrative",
      ],
      customer_tier: ["bronze", "silver", "gold", "platinum", "enterprise"],
      insurance_documents_status_enum: [
        "pending",
        "under_review",
        "approved",
        "rejected",
        "expired",
      ],
      insurance_documents_type_enum: ["coi", "binder", "policy", "endorsement"],
      integration_status: ["active", "inactive", "error", "maintenance"],
      maintenance_status: [
        "scheduled",
        "in_progress",
        "completed",
        "cancelled",
        "overdue",
      ],
      maintenance_type: [
        "scheduled",
        "preventive",
        "repair",
        "emergency",
        "inspection",
      ],
      notification_category: [
        "system",
        "booking",
        "payment",
        "equipment",
        "reminder",
        "support",
        "compliance",
        "marketing",
      ],
      notification_status: [
        "pending",
        "sent",
        "delivered",
        "failed",
        "cancelled",
      ],
      notification_type: ["email", "sms", "push", "webhook", "in_app"],
      payments_method_enum: [
        "credit_card",
        "debit_card",
        "bank_transfer",
        "cash",
        "check",
      ],
      payments_status_enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
        "partially_refunded",
      ],
      payments_type_enum: ["deposit", "payment", "refund", "additional_charge"],
      priority_level: ["low", "medium", "high", "critical"],
      revenue_stream: [
        "rental_income",
        "delivery_fees",
        "overtime_charges",
        "damage_fees",
        "insurance_claims",
      ],
      risk_level: ["low", "medium", "high", "critical"],
      search_result_type: ["equipment", "booking", "customer", "contract"],
      users_role_enum: ["customer", "admin", "super_admin"],
      users_status_enum: ["active", "inactive", "suspended"],
      webhook_event_type: [
        "booking_created",
        "booking_updated",
        "payment_received",
        "contract_signed",
        "equipment_maintenance_due",
      ],
    },
  },
} as const

