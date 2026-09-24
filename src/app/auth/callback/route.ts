import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        const payload = JSON.parse(Buffer.from(session.access_token.split('.')[1], 'base64').toString())
        if (payload.user_role === 'super_admin') return NextResponse.redirect(`${origin}/platform`)
        if (payload.tenant_id) {
          const { data: tenant } = await supabase.from('tenants').select('slug').eq('id', payload.tenant_id).single()
          if (tenant) return NextResponse.redirect(`${origin}/${tenant.slug}/dashboard`)
        }
      }
    }
  }

  return NextResponse.redirect(`${origin}/login`)
}
