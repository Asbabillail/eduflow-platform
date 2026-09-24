-- ============================================================
-- EDUFLOW PLATFORM — DEMO SEED DATA
-- Migration 004: Demo School (Al Andalus International School)
-- Run AFTER 003_auth_hook.sql
--
-- This creates a complete, realistic demo school.
-- The tenant_admin demo user email is set in this file.
-- Change 'demo@eduflow.sa' to the email you want to use for demos.
-- ============================================================

DO $$
DECLARE
    v_tenant_id         UUID := gen_random_uuid();
    v_year_id           UUID := gen_random_uuid();

    -- Grade IDs
    v_kg1_id   UUID := gen_random_uuid();
    v_kg2_id   UUID := gen_random_uuid();
    v_kg3_id   UUID := gen_random_uuid();
    v_g1_id    UUID := gen_random_uuid();
    v_g2_id    UUID := gen_random_uuid();
    v_g3_id    UUID := gen_random_uuid();
    v_g4_id    UUID := gen_random_uuid();
    v_g5_id    UUID := gen_random_uuid();
    v_g6_id    UUID := gen_random_uuid();
    v_g7_id    UUID := gen_random_uuid();
    v_g8_id    UUID := gen_random_uuid();
    v_g9_id    UUID := gen_random_uuid();
    v_g10_id   UUID := gen_random_uuid();
    v_g11_id   UUID := gen_random_uuid();
    v_g12_id   UUID := gen_random_uuid();

    -- Fee category IDs
    v_tuition_id    UUID := gen_random_uuid();
    v_books_id      UUID := gen_random_uuid();
    v_activities_id UUID := gen_random_uuid();

    -- Tax rule IDs
    v_vat_non_saudi UUID := gen_random_uuid();

    -- Addon IDs
    v_ipad_full_id     UUID := gen_random_uuid();
    v_ipad_migrate_id  UUID := gen_random_uuid();

    -- Transport zone IDs
    v_zone_a UUID := gen_random_uuid();
    v_zone_b UUID := gen_random_uuid();
    v_zone_c UUID := gen_random_uuid();

    -- Discount type IDs
    v_disc_early     UUID := gen_random_uuid();
    v_disc_sibling   UUID := gen_random_uuid();
    v_disc_staff     UUID := gen_random_uuid();
    v_disc_flex      UUID := gen_random_uuid();

BEGIN

-- ============================================================
-- TENANT — Al Andalus International School (Demo)
-- ============================================================
INSERT INTO public.tenants (
    id, name_en, name_ar, slug,
    primary_color, secondary_color,
    timezone, currency, country,
    address_en, address_ar,
    phone, email,
    subscription_tier, max_users,
    is_active, is_demo
) VALUES (
    v_tenant_id,
    'Al Andalus International School',
    'مدرسة الأندلس الدولية',
    'al-andalus',
    '#0D1F5C', '#0EA5E9',
    'Asia/Riyadh', 'SAR', 'SA',
    'King Fahd Road, Riyadh, Kingdom of Saudi Arabia',
    'طريق الملك فهد، الرياض، المملكة العربية السعودية',
    '+966 11 123 4567',
    'admin@al-andalus.edu.sa',
    'professional', 15,
    true, true
);

-- ============================================================
-- ACADEMIC YEAR — 2025-2026
-- ============================================================
INSERT INTO public.academic_years (id, tenant_id, name_en, name_ar, start_date, end_date, is_current, is_active)
VALUES (v_year_id, v_tenant_id, '2025-2026', '٢٠٢٥-٢٠٢٦', '2025-09-01', '2026-06-30', true, true);

-- ============================================================
-- GRADES — KG 1 through Grade 12
-- ============================================================
INSERT INTO public.grades (id, tenant_id, academic_year_id, name_en, name_ar, display_order) VALUES
    (v_kg1_id,  v_tenant_id, v_year_id, 'KG 1',     'روضة 1',            1),
    (v_kg2_id,  v_tenant_id, v_year_id, 'KG 2',     'روضة 2',            2),
    (v_kg3_id,  v_tenant_id, v_year_id, 'KG 3',     'روضة 3',            3),
    (v_g1_id,   v_tenant_id, v_year_id, 'Grade 1',  'الصف الأول',        4),
    (v_g2_id,   v_tenant_id, v_year_id, 'Grade 2',  'الصف الثاني',       5),
    (v_g3_id,   v_tenant_id, v_year_id, 'Grade 3',  'الصف الثالث',       6),
    (v_g4_id,   v_tenant_id, v_year_id, 'Grade 4',  'الصف الرابع',       7),
    (v_g5_id,   v_tenant_id, v_year_id, 'Grade 5',  'الصف الخامس',       8),
    (v_g6_id,   v_tenant_id, v_year_id, 'Grade 6',  'الصف السادس',       9),
    (v_g7_id,   v_tenant_id, v_year_id, 'Grade 7',  'الصف السابع',       10),
    (v_g8_id,   v_tenant_id, v_year_id, 'Grade 8',  'الصف الثامن',       11),
    (v_g9_id,   v_tenant_id, v_year_id, 'Grade 9',  'الصف التاسع',       12),
    (v_g10_id,  v_tenant_id, v_year_id, 'Grade 10', 'الصف العاشر',       13),
    (v_g11_id,  v_tenant_id, v_year_id, 'Grade 11', 'الصف الحادي عشر',   14),
    (v_g12_id,  v_tenant_id, v_year_id, 'Grade 12', 'الصف الثاني عشر',   15);

-- ============================================================
-- FEE CATEGORIES
-- ============================================================
INSERT INTO public.fee_categories (id, tenant_id, name_en, name_ar, is_taxable, display_order) VALUES
    (v_tuition_id,    v_tenant_id, 'Tuition',             'رسوم الدراسة',      true,  1),
    (v_books_id,      v_tenant_id, 'Books & Materials',   'الكتب والمواد',     false, 2),
    (v_activities_id, v_tenant_id, 'Activities Fee',      'رسوم الأنشطة',      false, 3);

-- ============================================================
-- FEE ITEMS — Tuition (New Students)
-- ============================================================
INSERT INTO public.fee_items (tenant_id, academic_year_id, grade_id, fee_category_id, student_type, amount, is_mandatory) VALUES
-- KG Tuition - New
(v_tenant_id, v_year_id, v_kg1_id,  v_tuition_id, 'new', 26000, true),
(v_tenant_id, v_year_id, v_kg2_id,  v_tuition_id, 'new', 26000, true),
(v_tenant_id, v_year_id, v_kg3_id,  v_tuition_id, 'new', 28000, true),
-- Primary Tuition - New
(v_tenant_id, v_year_id, v_g1_id,   v_tuition_id, 'new', 33000, true),
(v_tenant_id, v_year_id, v_g2_id,   v_tuition_id, 'new', 33000, true),
(v_tenant_id, v_year_id, v_g3_id,   v_tuition_id, 'new', 33000, true),
(v_tenant_id, v_year_id, v_g4_id,   v_tuition_id, 'new', 33000, true),
(v_tenant_id, v_year_id, v_g5_id,   v_tuition_id, 'new', 36000, true),
(v_tenant_id, v_year_id, v_g6_id,   v_tuition_id, 'new', 36000, true),
-- Middle Tuition - New
(v_tenant_id, v_year_id, v_g7_id,   v_tuition_id, 'new', 36000, true),
(v_tenant_id, v_year_id, v_g8_id,   v_tuition_id, 'new', 36000, true),
(v_tenant_id, v_year_id, v_g9_id,   v_tuition_id, 'new', 36000, true),
-- High School Tuition - New
(v_tenant_id, v_year_id, v_g10_id,  v_tuition_id, 'new', 38000, true),
(v_tenant_id, v_year_id, v_g11_id,  v_tuition_id, 'new', 40000, true),
(v_tenant_id, v_year_id, v_g12_id,  v_tuition_id, 'new', 42000, true);

-- ============================================================
-- FEE ITEMS — Tuition (Returning Students)
-- ============================================================
INSERT INTO public.fee_items (tenant_id, academic_year_id, grade_id, fee_category_id, student_type, amount, is_mandatory) VALUES
(v_tenant_id, v_year_id, v_kg1_id,  v_tuition_id, 'returning', 21500, true),
(v_tenant_id, v_year_id, v_kg2_id,  v_tuition_id, 'returning', 21500, true),
(v_tenant_id, v_year_id, v_kg3_id,  v_tuition_id, 'returning', 23500, true),
(v_tenant_id, v_year_id, v_g1_id,   v_tuition_id, 'returning', 28500, true),
(v_tenant_id, v_year_id, v_g2_id,   v_tuition_id, 'returning', 28500, true),
(v_tenant_id, v_year_id, v_g3_id,   v_tuition_id, 'returning', 28500, true),
(v_tenant_id, v_year_id, v_g4_id,   v_tuition_id, 'returning', 30500, true),
(v_tenant_id, v_year_id, v_g5_id,   v_tuition_id, 'returning', 30500, true),
(v_tenant_id, v_year_id, v_g6_id,   v_tuition_id, 'returning', 30500, true),
(v_tenant_id, v_year_id, v_g7_id,   v_tuition_id, 'returning', 31500, true),
(v_tenant_id, v_year_id, v_g8_id,   v_tuition_id, 'returning', 32500, true),
(v_tenant_id, v_year_id, v_g9_id,   v_tuition_id, 'returning', 32500, true),
(v_tenant_id, v_year_id, v_g10_id,  v_tuition_id, 'returning', 34500, true),
(v_tenant_id, v_year_id, v_g11_id,  v_tuition_id, 'returning', 36500, true),
(v_tenant_id, v_year_id, v_g12_id,  v_tuition_id, 'returning', 38500, true);

-- ============================================================
-- FEE ITEMS — Books (same for new and returning)
-- ============================================================
INSERT INTO public.fee_items (tenant_id, academic_year_id, grade_id, fee_category_id, student_type, amount, is_mandatory) VALUES
(v_tenant_id, v_year_id, v_kg1_id,  v_books_id, 'all', 500,  true),
(v_tenant_id, v_year_id, v_kg2_id,  v_books_id, 'all', 500,  true),
(v_tenant_id, v_year_id, v_kg3_id,  v_books_id, 'all', 500,  true),
(v_tenant_id, v_year_id, v_g1_id,   v_books_id, 'all', 1200, true),
(v_tenant_id, v_year_id, v_g2_id,   v_books_id, 'all', 1200, true),
(v_tenant_id, v_year_id, v_g3_id,   v_books_id, 'all', 1200, true),
(v_tenant_id, v_year_id, v_g4_id,   v_books_id, 'all', 1500, true),
(v_tenant_id, v_year_id, v_g5_id,   v_books_id, 'all', 1500, true),
(v_tenant_id, v_year_id, v_g6_id,   v_books_id, 'all', 1500, true),
(v_tenant_id, v_year_id, v_g7_id,   v_books_id, 'all', 1500, true),
(v_tenant_id, v_year_id, v_g8_id,   v_books_id, 'all', 1500, true),
(v_tenant_id, v_year_id, v_g9_id,   v_books_id, 'all', 1500, true),
(v_tenant_id, v_year_id, v_g10_id,  v_books_id, 'all', 1500, true),
(v_tenant_id, v_year_id, v_g11_id,  v_books_id, 'all', 1500, true),
(v_tenant_id, v_year_id, v_g12_id,  v_books_id, 'all', 1500, true);

-- ============================================================
-- TAX RULES
-- ============================================================
INSERT INTO public.tax_rules (id, tenant_id, name_en, name_ar, rate, applies_to_nationality, is_default, is_active) VALUES
(v_vat_non_saudi, v_tenant_id,
 'VAT 15% — Non-Saudi Residents',
 'ضريبة القيمة المضافة 15% — غير السعوديين',
 0.1500, 'non_saudi', true, true);

-- ============================================================
-- ADD-ON PACKAGES
-- ============================================================
INSERT INTO public.addon_packages (id, tenant_id, name_en, name_ar, description_en, description_ar, amount, display_order) VALUES
(v_ipad_full_id, v_tenant_id,
 'Full Student Device Package',
 'باقة الجهاز الطلابي الكاملة',
 'iPad (128GB), protective case, stylus pen, AppleCare+ 3yr, MDM enrollment, Microsoft 365 Education, managed Apple ID',
 'جهاز iPad (128 جيجا)، حافظة واقية، قلم، ضمان AppleCare+ 3 سنوات، إدارة MDM، Microsoft 365 للتعليم، Apple ID مُدار',
 2800, 1),
(v_ipad_migrate_id, v_tenant_id,
 'Device Migration & License Setup',
 'ترحيل الجهاز وإعداد التراخيص',
 'MDM enrollment, Microsoft 365 Education setup, managed Apple ID, security profiles, learning apps',
 'تسجيل MDM، إعداد Microsoft 365 للتعليم، Apple ID مُدار، ملفات تعريف الأمان، تطبيقات التعلم',
 600, 2);

-- ============================================================
-- TRANSPORT ZONES
-- ============================================================
INSERT INTO public.transport_zones (id, tenant_id, name_en, name_ar, amount, display_order) VALUES
(v_zone_a, v_tenant_id, 'Zone A — One Way (Annual)',  'المنطقة أ - اتجاه واحد (سنوي)',  3000, 1),
(v_zone_b, v_tenant_id, 'Zone B — Two Way (Annual)',  'المنطقة ب - اتجاهين (سنوي)',     5000, 2),
(v_zone_c, v_tenant_id, 'Zone C — Premium Two Way',  'المنطقة ج - اتجاهين مميز',        6500, 3);

-- ============================================================
-- DISCOUNT TYPES
-- ============================================================
INSERT INTO public.discount_types (
    id, tenant_id, name_en, name_ar,
    description_en, description_ar,
    discount_value_type, default_value, max_value,
    requires_approval, approval_threshold,
    applies_to, is_stackable
) VALUES
-- Early Enrollment Discount
(v_disc_early, v_tenant_id,
 'Early Enrollment Discount',
 'خصم التسجيل المبكر',
 'Applied to families who complete enrollment before the deadline',
 'يُطبق على الأسر التي تكمل التسجيل قبل الموعد النهائي',
 'percentage', 5, 15,
 false, NULL,
 'tuition', true),

-- Sibling Discount
(v_disc_sibling, v_tenant_id,
 'Sibling Discount',
 'خصم الأشقاء',
 'Applied for families enrolling multiple children',
 'يُطبق للأسر التي تُسجّل أكثر من طالب',
 'percentage', 10, 20,
 false, NULL,
 'tuition', true),

-- Staff Discount
(v_disc_staff, v_tenant_id,
 'Staff Child Discount',
 'خصم أبناء المعلمين',
 'For children of school staff members',
 'لأبناء وبنات العاملين في المدرسة',
 'percentage', 25, 50,
 true, 30,
 'tuition', false),

-- Flexible Discount (management decision)
(v_disc_flex, v_tenant_id,
 'Management Discretionary Discount',
 'خصم تقديري إداري',
 'Special discount approved by management on a case-by-case basis',
 'خصم خاص يوافق عليه الإدارة حسب كل حالة',
 'percentage', 0, 45,
 true, 20,
 'tuition', false);

RAISE NOTICE 'Demo seed completed. Tenant ID: %', v_tenant_id;
RAISE NOTICE 'Slug: al-andalus';
RAISE NOTICE 'Remember to create a demo user in Supabase Auth and add them to tenant_users with tenant_id = %', v_tenant_id;

END $$;
