'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AppRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) { router.push('/login'); return }
      const payload = JSON.parse(atob(session.access_token.split('.')[1]))
      const tenantId = payload.tenant_id
      if (!tenantId) { router.push('/login'); return }
      supabase.from('tenants').select('slug').eq('id', tenantId).single()
        .then(({ data: tenant }) => {
          if (tenant?.slug) router.push(`/${tenant.slug}/dashboard`)
          else router.push('/login')
        })
    })
  }, [])

  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'100vh',fontFamily:'sans-serif',color:'#64748B',fontSize:'14px'}}>
      Signing you in...
    </div>
  )
}
