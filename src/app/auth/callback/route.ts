import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: tenantUser } = await supabase
          .from('tenant_users')
          .select('role, tenants(slug)')
          .eq('auth_user_id', user.id)
          .eq('is_active', true)
          .single()

        if (tenantUser?.tenants) {
          const tenant = (Array.isArray(tenantUser.tenants) ? tenantUser.tenants[0] : tenantUser.tenants) as { slug: string }
          return NextResponse.redirect(`${origin}/${tenant.slug}/dashboard`)
        }

        const { data: superAdmin } = await supabase
          .from('super_admins')
          .select('id')
          .eq('auth_user_id', user.id)
          .single()

        if (superAdmin) {
          return NextResponse.redirect(`${origin}/platform`)
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}