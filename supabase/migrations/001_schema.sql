-- ============================================================
-- EDUFLOW PLATFORM — DATABASE SCHEMA
-- Migration 001: Initial Schema
-- Run this first in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (already enabled on Supabase, but safe to run)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TENANTS — one row per school/institution
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en             TEXT NOT NULL,
    name_ar             TEXT NOT NULL,
    slug                TEXT UNIQUE NOT NULL,  -- URL identifier e.g. "al-andalus"
    logo_url            TEXT,
    letterhead_url      TEXT,
    primary_color       TEXT DEFAULT '#0D1F5C',
    secondary_color     TEXT DEFAULT '#0EA5E9',
    timezone            TEXT DEFAULT 'Asia/Riyadh',
    currency            TEXT DEFAULT 'SAR',
    country             TEXT DEFAULT 'SA',
    address_en          TEXT,
    address_ar          TEXT,
    phone               TEXT,
    email               TEXT,
    website             TEXT,
    subscription_tier   TEXT DEFAULT 'starter'
                            CHECK (subscription_tier IN ('starter', 'professional', 'institution')),
    max_users           INT DEFAULT 5,
    is_active           BOOLEAN DEFAULT true,
    is_demo             BOOLEAN DEFAULT false,
    demo_expires_at     TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SUPER ADMINS — platform-level only (no tenant_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.super_admins (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id    UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    email           TEXT NOT NULL,
    full_name       TEXT,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TENANT USERS — staff accounts per school
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenant_users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    auth_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role            TEXT NOT NULL DEFAULT 'viewer'
                        CHECK (role IN ('viewer', 'admission_staff', 'finance_manager', 'tenant_admin')),
    full_name       TEXT,
    email           TEXT NOT NULL,
    is_active       BOOLEAN DEFAULT true,
    invited_by      UUID REFERENCES public.tenant_users(id),
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, auth_user_id)
);

-- ============================================================
-- ACADEMIC YEARS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.academic_years (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name_en         TEXT NOT NULL,   -- "2025-2026"
    name_ar         TEXT NOT NULL,   -- "٢٠٢٥-٢٠٢٦"
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    is_current      BOOLEAN DEFAULT false,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- GRADES — configurable per tenant per academic year
-- ============================================================
CREATE TABLE IF NOT EXISTS public.grades (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    academic_year_id    UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    name_en             TEXT NOT NULL,   -- "Grade 1", "KG 1", "Foundation"
    name_ar             TEXT NOT NULL,   -- "الصف الأول"
    display_order       INT DEFAULT 0,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FEE CATEGORIES — types of fees (Tuition, Books, Registration…)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fee_categories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name_en         TEXT NOT NULL,
    name_ar         TEXT NOT NULL,
    description_en  TEXT,
    description_ar  TEXT,
    is_taxable      BOOLEAN DEFAULT false,  -- does VAT apply to this category?
    display_order   INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FEE ITEMS — actual amounts per grade + year + category
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fee_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    academic_year_id    UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE CASCADE,
    grade_id            UUID NOT NULL REFERENCES public.grades(id) ON DELETE CASCADE,
    fee_category_id     UUID NOT NULL REFERENCES public.fee_categories(id) ON DELETE CASCADE,
    student_type        TEXT DEFAULT 'all'
                            CHECK (student_type IN ('new', 'returning', 'all')),
    amount              DECIMAL(12, 2) NOT NULL,
    is_mandatory        BOOLEAN DEFAULT true,
    is_active           BOOLEAN DEFAULT true,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TAX RULES — VAT configuration per tenant
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tax_rules (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name_en                 TEXT NOT NULL,   -- "VAT — Non-Saudi Resident"
    name_ar                 TEXT NOT NULL,
    rate                    DECIMAL(5, 4) NOT NULL,   -- 0.1500 = 15%
    applies_to_nationality  TEXT,            -- NULL = applies to all nationalities
    is_default              BOOLEAN DEFAULT false,
    is_active               BOOLEAN DEFAULT true,
    created_at              TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ADDON PACKAGES — iPad bundles, devices, kits
-- ============================================================
CREATE TABLE IF NOT EXISTS public.addon_packages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name_en         TEXT NOT NULL,
    name_ar         TEXT NOT NULL,
    description_en  TEXT,
    description_ar  TEXT,
    amount          DECIMAL(12, 2) NOT NULL,
    is_taxable      BOOLEAN DEFAULT false,
    display_order   INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TRANSPORT ZONES — bus routes with pricing
-- ============================================================
CREATE TABLE IF NOT EXISTS public.transport_zones (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name_en         TEXT NOT NULL,
    name_ar         TEXT NOT NULL,
    amount          DECIMAL(12, 2) NOT NULL,
    display_order   INT DEFAULT 0,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- DISCOUNT TYPES — configurable discount rules per school
-- ============================================================
CREATE TABLE IF NOT EXISTS public.discount_types (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name_en                 TEXT NOT NULL,   -- "Sibling Discount", "Early Enrollment"
    name_ar                 TEXT NOT NULL,
    description_en          TEXT,
    description_ar          TEXT,
    discount_value_type     TEXT NOT NULL CHECK (discount_value_type IN ('percentage', 'fixed')),
    default_value           DECIMAL(10, 2),  -- suggested % or SAR
    max_value               DECIMAL(10, 2),  -- max % or max SAR amount
    requires_approval       BOOLEAN DEFAULT false,
    approval_threshold      DECIMAL(10, 2),  -- above this value, auto-route to approval
    applies_to              TEXT DEFAULT 'tuition'
                                CHECK (applies_to IN ('tuition', 'total')),
    is_stackable            BOOLEAN DEFAULT false,
    is_active               BOOLEAN DEFAULT true,
    created_at              TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FAMILIES — parent / guardian records
-- ============================================================
CREATE TABLE IF NOT EXISTS public.families (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    parent_name     TEXT NOT NULL,
    email           TEXT,
    phone           TEXT,
    nationality     TEXT,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- QUOTATIONS — the main document record
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotations (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id               UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    reference_number        TEXT NOT NULL,   -- e.g. "EDU-2026-0042"
    academic_year_id        UUID REFERENCES public.academic_years(id),

    -- Family info (snapshot at creation — never reference live family record)
    family_id               UUID REFERENCES public.families(id),
    parent_name             TEXT NOT NULL,
    parent_email            TEXT,
    parent_phone            TEXT,
    nationality             TEXT,

    -- Calculated totals (snapshot — never recalculate from live fee tables)
    subtotal                DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_total          DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_total               DECIMAL(12, 2) NOT NULL DEFAULT 0,
    grand_total             DECIMAL(12, 2) NOT NULL DEFAULT 0,
    currency                TEXT NOT NULL DEFAULT 'SAR',

    -- Validity dates
    issue_date              DATE NOT NULL,
    discount_valid_until    DATE,
    quote_valid_until       DATE,

    -- Status workflow
    status                  TEXT NOT NULL DEFAULT 'draft'
                                CHECK (status IN (
                                    'draft',
                                    'pending_approval',
                                    'approved',
                                    'rejected',
                                    'expired',
                                    'converted'
                                )),

    -- PDF
    pdf_url                 TEXT,
    pdf_language            TEXT DEFAULT 'en'
                                CHECK (pdf_language IN ('en', 'ar', 'bilingual')),

    -- Audit
    created_by              UUID REFERENCES public.tenant_users(id),
    approved_by             UUID REFERENCES public.tenant_users(id),
    approved_at             TIMESTAMPTZ,
    rejection_reason        TEXT,
    notes                   TEXT,

    created_at              TIMESTAMPTZ DEFAULT now(),
    updated_at              TIMESTAMPTZ DEFAULT now()
);

-- Auto-generate reference number per tenant
CREATE SEQUENCE IF NOT EXISTS public.quotation_seq START 1;

-- ============================================================
-- QUOTATION STUDENTS — snapshot per student (up to 6 per quotation)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotation_students (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id        UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    tenant_id           UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_name        TEXT NOT NULL,
    student_type        TEXT NOT NULL CHECK (student_type IN ('new', 'returning')),

    -- Grade snapshot (so history survives grade renames)
    grade_id            UUID REFERENCES public.grades(id),
    grade_name_en       TEXT NOT NULL,
    grade_name_ar       TEXT NOT NULL,

    -- Totals (all snapshot)
    base_tuition        DECIMAL(12, 2) NOT NULL DEFAULT 0,
    discount_amount     DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax_amount          DECIMAL(12, 2) NOT NULL DEFAULT 0,
    addons_total        DECIMAL(12, 2) NOT NULL DEFAULT 0,
    student_total       DECIMAL(12, 2) NOT NULL DEFAULT 0,

    display_order       INT DEFAULT 0,
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- QUOTATION LINE ITEMS — detailed fee breakdown per student
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotation_line_items (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id            UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    quotation_student_id    UUID NOT NULL REFERENCES public.quotation_students(id) ON DELETE CASCADE,
    tenant_id               UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

    line_type               TEXT NOT NULL
                                CHECK (line_type IN ('fee', 'discount', 'tax', 'addon', 'transport')),

    -- Snapshots of names at creation time (survive category renames)
    description_en          TEXT NOT NULL,
    description_ar          TEXT NOT NULL,

    -- Optional references (nullable — items may be deleted in future)
    fee_item_id             UUID REFERENCES public.fee_items(id),
    discount_type_id        UUID REFERENCES public.discount_types(id),
    addon_package_id        UUID REFERENCES public.addon_packages(id),
    transport_zone_id       UUID REFERENCES public.transport_zones(id),

    -- Values (snapshot)
    unit_amount             DECIMAL(12, 2) NOT NULL DEFAULT 0,
    quantity                INT NOT NULL DEFAULT 1,
    discount_percent        DECIMAL(5, 2),
    line_total              DECIMAL(12, 2) NOT NULL DEFAULT 0,

    display_order           INT DEFAULT 0,
    created_at              TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- APPROVAL REQUESTS — for discounts above threshold
-- ============================================================
CREATE TABLE IF NOT EXISTS public.approval_requests (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quotation_id    UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    requested_by    UUID NOT NULL REFERENCES public.tenant_users(id),
    requested_at    TIMESTAMPTZ DEFAULT now(),
    reviewed_by     UUID REFERENCES public.tenant_users(id),
    reviewed_at     TIMESTAMPTZ,
    decision        TEXT CHECK (decision IN ('approved', 'rejected')),
    reason          TEXT,
    trigger_reason  TEXT NOT NULL,  -- "Discount 45% exceeds threshold 40%"
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- AUDIT LOG — append-only, never UPDATE or DELETE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    actor_id        UUID REFERENCES public.tenant_users(id),
    actor_email     TEXT,   -- snapshot in case user is later deactivated
    action          TEXT NOT NULL,   -- 'quotation.created', 'fee.updated', 'user.invited'
    entity_type     TEXT NOT NULL,   -- 'quotation', 'fee_item', 'tenant', 'user'
    entity_id       UUID,
    previous_state  JSONB,
    new_state       JSONB,
    ip_address      TEXT,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- GENERATED DOCUMENTS — PDF file records
-- ============================================================
CREATE TABLE IF NOT EXISTS public.generated_documents (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id           UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    quotation_id        UUID NOT NULL REFERENCES public.quotations(id) ON DELETE CASCADE,
    pdf_url             TEXT NOT NULL,
    language            TEXT DEFAULT 'en',
    file_size_bytes     INT,
    generated_by        UUID REFERENCES public.tenant_users(id),
    created_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_auth ON public.tenant_users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_academic_years_tenant ON public.academic_years(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grades_tenant ON public.grades(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grades_year ON public.grades(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_fee_items_tenant ON public.fee_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fee_items_grade ON public.fee_items(grade_id);
CREATE INDEX IF NOT EXISTS idx_quotations_tenant ON public.quotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON public.quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_by ON public.quotations(created_by);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON public.audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- ============================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER tenant_users_updated_at
    BEFORE UPDATE ON public.tenant_users
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER fee_items_updated_at
    BEFORE UPDATE ON public.fee_items
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER quotations_updated_at
    BEFORE UPDATE ON public.quotations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER families_updated_at
    BEFORE UPDATE ON public.families
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
