// ============================================================
// EDUFLOW — Database Types
// These mirror the Supabase database schema.
// When schema changes, update both the SQL migrations AND these types.
// To auto-generate from Supabase: npx supabase gen types typescript
// ============================================================

export type UserRole = 'viewer' | 'admission_staff' | 'finance_manager' | 'tenant_admin'
export type SubscriptionTier = 'starter' | 'professional' | 'institution'
export type QuotationStatus = 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'expired' | 'converted'
export type StudentType = 'new' | 'returning' | 'all'
export type DiscountValueType = 'percentage' | 'fixed'
export type PdfLanguage = 'en' | 'ar' | 'bilingual'
export type LineType = 'fee' | 'discount' | 'tax' | 'addon' | 'transport'

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name_en: string
          name_ar: string
          slug: string
          logo_url: string | null
          letterhead_url: string | null
          primary_color: string
          secondary_color: string
          timezone: string
          currency: string
          country: string
          address_en: string | null
          address_ar: string | null
          phone: string | null
          email: string | null
          website: string | null
          subscription_tier: SubscriptionTier
          max_users: number
          is_active: boolean
          is_demo: boolean
          demo_expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenants']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tenants']['Insert']>
      }

      tenant_users: {
        Row: {
          id: string
          tenant_id: string
          auth_user_id: string
          role: UserRole
          full_name: string | null
          email: string
          is_active: boolean
          invited_by: string | null
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tenant_users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tenant_users']['Insert']>
      }

      academic_years: {
        Row: {
          id: string
          tenant_id: string
          name_en: string
          name_ar: string
          start_date: string
          end_date: string
          is_current: boolean
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['academic_years']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['academic_years']['Insert']>
      }

      grades: {
        Row: {
          id: string
          tenant_id: string
          academic_year_id: string
          name_en: string
          name_ar: string
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['grades']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['grades']['Insert']>
      }

      fee_categories: {
        Row: {
          id: string
          tenant_id: string
          name_en: string
          name_ar: string
          description_en: string | null
          description_ar: string | null
          is_taxable: boolean
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['fee_categories']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['fee_categories']['Insert']>
      }

      fee_items: {
        Row: {
          id: string
          tenant_id: string
          academic_year_id: string
          grade_id: string
          fee_category_id: string
          student_type: StudentType
          amount: number
          is_mandatory: boolean
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['fee_items']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['fee_items']['Insert']>
      }

      tax_rules: {
        Row: {
          id: string
          tenant_id: string
          name_en: string
          name_ar: string
          rate: number
          applies_to_nationality: string | null
          is_default: boolean
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tax_rules']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['tax_rules']['Insert']>
      }

      addon_packages: {
        Row: {
          id: string
          tenant_id: string
          name_en: string
          name_ar: string
          description_en: string | null
          description_ar: string | null
          amount: number
          is_taxable: boolean
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['addon_packages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['addon_packages']['Insert']>
      }

      transport_zones: {
        Row: {
          id: string
          tenant_id: string
          name_en: string
          name_ar: string
          amount: number
          display_order: number
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['transport_zones']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['transport_zones']['Insert']>
      }

      discount_types: {
        Row: {
          id: string
          tenant_id: string
          name_en: string
          name_ar: string
          description_en: string | null
          description_ar: string | null
          discount_value_type: DiscountValueType
          default_value: number | null
          max_value: number | null
          requires_approval: boolean
          approval_threshold: number | null
          applies_to: 'tuition' | 'total'
          is_stackable: boolean
          is_active: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['discount_types']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['discount_types']['Insert']>
      }

      quotations: {
        Row: {
          id: string
          tenant_id: string
          reference_number: string
          academic_year_id: string | null
          family_id: string | null
          parent_name: string
          parent_email: string | null
          parent_phone: string | null
          nationality: string | null
          subtotal: number
          discount_total: number
          tax_total: number
          grand_total: number
          currency: string
          issue_date: string
          discount_valid_until: string | null
          quote_valid_until: string | null
          status: QuotationStatus
          pdf_url: string | null
          pdf_language: PdfLanguage
          created_by: string | null
          approved_by: string | null
          approved_at: string | null
          rejection_reason: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['quotations']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['quotations']['Insert']>
      }

      quotation_students: {
        Row: {
          id: string
          quotation_id: string
          tenant_id: string
          student_name: string
          student_type: 'new' | 'returning'
          grade_id: string | null
          grade_name_en: string
          grade_name_ar: string
          base_tuition: number
          discount_amount: number
          tax_amount: number
          addons_total: number
          student_total: number
          display_order: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['quotation_students']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['quotation_students']['Insert']>
      }

      audit_logs: {
        Row: {
          id: string
          tenant_id: string
          actor_id: string | null
          actor_email: string | null
          action: string
          entity_type: string
          entity_id: string | null
          previous_state: Record<string, unknown> | null
          new_state: Record<string, unknown> | null
          ip_address: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['audit_logs']['Row'], 'id' | 'created_at'>
        Update: never  // Audit logs are immutable
      }
    }
  }
}
