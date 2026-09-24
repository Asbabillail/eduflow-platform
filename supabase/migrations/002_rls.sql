-- ============================================================
-- EDUFLOW PLATFORM — ROW LEVEL SECURITY POLICIES
-- Migration 002: RLS Policies
-- Run AFTER 001_schema.sql
-- ============================================================
-- These policies ensure one school CANNOT see another school's data.
-- They are enforced at the DATABASE engine level — cannot be bypassed.
-- ============================================================

-- ============================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.tenants            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.super_admins       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_users       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grades             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_categories     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_rules          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addon_packages     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transport_zones    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.families           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotation_line_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.approval_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Get the current user's tenant_id from their JWT
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS UUID AS $$
  SELECT NULLIF(auth.jwt() ->> 'tenant_id', '')::UUID;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Get the current user's role from their JWT
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() ->> 'user_role';
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user is a super admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Check if current user has a role >= minimum required
CREATE OR REPLACE FUNCTION public.has_role(min_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  role_order INT;
  user_role_order INT;
BEGIN
  role_order := CASE min_role
    WHEN 'viewer'           THEN 1
    WHEN 'admission_staff'  THEN 2
    WHEN 'finance_manager'  THEN 3
    WHEN 'tenant_admin'     THEN 4
    ELSE 0
  END;
  user_role_order := CASE public.get_user_role()
    WHEN 'viewer'           THEN 1
    WHEN 'admission_staff'  THEN 2
    WHEN 'finance_manager'  THEN 3
    WHEN 'tenant_admin'     THEN 4
    ELSE 0
  END;
  RETURN user_role_order >= role_order OR public.is_super_admin();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================================
-- TENANTS TABLE
-- Super admin sees all. Tenant users see only their own.
-- ============================================================
CREATE POLICY "tenants_select" ON public.tenants
    FOR SELECT USING (
        public.is_super_admin()
        OR id = public.get_tenant_id()
    );

CREATE POLICY "tenants_update" ON public.tenants
    FOR UPDATE USING (
        public.is_super_admin()
        OR (id = public.get_tenant_id() AND public.has_role('tenant_admin'))
    );

CREATE POLICY "tenants_insert" ON public.tenants
    FOR INSERT WITH CHECK (public.is_super_admin());

-- ============================================================
-- SUPER ADMINS — only super admins can read this table
-- ============================================================
CREATE POLICY "super_admins_all" ON public.super_admins
    FOR ALL USING (public.is_super_admin());

-- ============================================================
-- TENANT USERS
-- ============================================================
CREATE POLICY "tenant_users_select" ON public.tenant_users
    FOR SELECT USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

CREATE POLICY "tenant_users_insert" ON public.tenant_users
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR (tenant_id = public.get_tenant_id() AND public.has_role('tenant_admin'))
    );

CREATE POLICY "tenant_users_update" ON public.tenant_users
    FOR UPDATE USING (
        public.is_super_admin()
        OR (tenant_id = public.get_tenant_id() AND public.has_role('tenant_admin'))
    );

-- ============================================================
-- STANDARD TENANT ISOLATION POLICY (used for most tables)
-- Pattern: tenant users see their own data; super admin sees all.
-- ============================================================

-- ACADEMIC YEARS
CREATE POLICY "academic_years_all" ON public.academic_years
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- GRADES
CREATE POLICY "grades_all" ON public.grades
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- FEE CATEGORIES
CREATE POLICY "fee_categories_all" ON public.fee_categories
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- FEE ITEMS
CREATE POLICY "fee_items_all" ON public.fee_items
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- TAX RULES
CREATE POLICY "tax_rules_all" ON public.tax_rules
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- ADDON PACKAGES
CREATE POLICY "addon_packages_all" ON public.addon_packages
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- TRANSPORT ZONES
CREATE POLICY "transport_zones_all" ON public.transport_zones
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- DISCOUNT TYPES
CREATE POLICY "discount_types_all" ON public.discount_types
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- FAMILIES
CREATE POLICY "families_all" ON public.families
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- ============================================================
-- QUOTATIONS — role-based read restrictions
-- ============================================================
CREATE POLICY "quotations_select" ON public.quotations
    FOR SELECT USING (
        public.is_super_admin()
        OR (
            tenant_id = public.get_tenant_id()
            AND (
                -- admission_staff can only see approved quotations and their own drafts
                public.has_role('finance_manager')
                OR created_by = (
                    SELECT id FROM public.tenant_users
                    WHERE auth_user_id = auth.uid()
                    AND tenant_id = public.get_tenant_id()
                    LIMIT 1
                )
                OR status IN ('approved', 'rejected', 'expired', 'converted')
            )
        )
    );

CREATE POLICY "quotations_insert" ON public.quotations
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR (
            tenant_id = public.get_tenant_id()
            AND public.has_role('admission_staff')
        )
    );

CREATE POLICY "quotations_update" ON public.quotations
    FOR UPDATE USING (
        public.is_super_admin()
        OR (
            tenant_id = public.get_tenant_id()
            AND public.has_role('admission_staff')
        )
    );

-- ============================================================
-- QUOTATION STUDENTS
-- ============================================================
CREATE POLICY "quotation_students_all" ON public.quotation_students
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- ============================================================
-- QUOTATION LINE ITEMS
-- ============================================================
CREATE POLICY "quotation_line_items_all" ON public.quotation_line_items
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- ============================================================
-- APPROVAL REQUESTS
-- ============================================================
CREATE POLICY "approval_requests_select" ON public.approval_requests
    FOR SELECT USING (
        public.is_super_admin()
        OR (
            tenant_id = public.get_tenant_id()
            AND public.has_role('admission_staff')
        )
    );

CREATE POLICY "approval_requests_insert" ON public.approval_requests
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR (
            tenant_id = public.get_tenant_id()
            AND public.has_role('admission_staff')
        )
    );

CREATE POLICY "approval_requests_update" ON public.approval_requests
    FOR UPDATE USING (
        public.is_super_admin()
        OR (
            tenant_id = public.get_tenant_id()
            AND public.has_role('finance_manager')
        )
    );

-- ============================================================
-- AUDIT LOGS — SELECT only (no UPDATE, no DELETE, ever)
-- ============================================================
CREATE POLICY "audit_logs_select" ON public.audit_logs
    FOR SELECT USING (
        public.is_super_admin()
        OR (
            tenant_id = public.get_tenant_id()
            AND public.has_role('tenant_admin')
        )
    );

CREATE POLICY "audit_logs_insert" ON public.audit_logs
    FOR INSERT WITH CHECK (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );

-- NO UPDATE policy for audit_logs — intentional
-- NO DELETE policy for audit_logs — intentional

-- ============================================================
-- GENERATED DOCUMENTS
-- ============================================================
CREATE POLICY "generated_documents_all" ON public.generated_documents
    FOR ALL USING (
        public.is_super_admin()
        OR tenant_id = public.get_tenant_id()
    );
