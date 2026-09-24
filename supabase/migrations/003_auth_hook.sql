-- ============================================================
-- EDUFLOW PLATFORM — AUTH HOOK
-- Migration 003: Custom Access Token Hook
-- Run AFTER 002_rls.sql
--
-- IMPORTANT: After running this SQL, you MUST also enable the hook
-- in the Supabase Dashboard:
-- Authentication → Hooks → Custom Access Token → Enable
-- → Select function: public.custom_access_token_hook
-- ============================================================

-- This function runs every time a user logs in.
-- It reads the user's tenant_id and role from tenant_users
-- and injects them into the JWT token.
-- The RLS policies then use auth.jwt() to enforce tenant isolation.

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
    claims         JSONB;
    user_tenant_id UUID;
    user_role      TEXT;
    user_id        UUID;
BEGIN
    user_id := (event ->> 'user_id')::UUID;
    claims := event -> 'claims';

    -- Check if super admin first
    IF EXISTS (
        SELECT 1 FROM public.super_admins
        WHERE auth_user_id = user_id AND is_active = true
    ) THEN
        claims := jsonb_set(claims, '{user_role}', '"super_admin"');
        claims := jsonb_set(claims, '{tenant_id}', 'null');
        RETURN jsonb_set(event, '{claims}', claims);
    END IF;

    -- Get tenant_id and role for regular staff
    SELECT tenant_id, role
    INTO user_tenant_id, user_role
    FROM public.tenant_users
    WHERE auth_user_id = user_id
      AND is_active = true
    LIMIT 1;

    -- Inject into JWT claims
    IF user_tenant_id IS NOT NULL THEN
        claims := jsonb_set(claims, '{tenant_id}', to_jsonb(user_tenant_id::TEXT));
        claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    END IF;

    RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant the auth system permission to call this function
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;

-- Revoke from everyone else
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
