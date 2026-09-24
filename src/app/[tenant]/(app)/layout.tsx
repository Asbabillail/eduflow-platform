import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  params: { tenant: string }
}

export default async function AppLayout({ children, params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get tenant
  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name_en, name_ar, logo_url, slug')
    .eq('slug', params.tenant)
    .single()

  if (!tenant) redirect('/login')

  // Get user profile + role
  const { data: userProfile } = await supabase
    .from('tenant_users')
    .select('id, full_name, email, role')
    .eq('auth_user_id', user.id)
    .eq('tenant_id', tenant.id)
    .single()

  if (!userProfile) redirect('/login')

  const role = userProfile.role
  const base = `/${params.tenant}`

  const canManageSettings = ['tenant_admin'].includes(role)
  const canApprove = ['finance_manager', 'tenant_admin'].includes(role)

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* SIDEBAR */}
      <aside className="w-60 bg-[#0D1F5C] flex flex-col flex-shrink-0">

        {/* School Name */}
        <div className="px-4 py-5 border-b border-white/10">
          {tenant.logo_url ? (
            <img src={tenant.logo_url} alt={tenant.name_en} className="h-8 mb-2 object-contain" />
          ) : (
            <div className="bg-white/10 text-white font-bold text-xs px-2 py-1 rounded inline-block mb-2">
              EduFlow
            </div>
          )}
          <p className="text-white text-sm font-semibold leading-tight truncate">
            {tenant.name_en}
          </p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavItem href={`${base}/dashboard`} icon="⬛" label="Dashboard" />
          <NavItem href={`${base}/quotations`} icon="📄" label="Quotations" />
          <NavItem href={`${base}/quotations/new`} icon="✚" label="New Quotation" />
          {canApprove && (
            <NavItem href={`${base}/approvals`} icon="✅" label="Approvals" />
          )}

          {canManageSettings && (
            <>
              <div className="pt-4 pb-1 px-3">
                <p className="text-white/30 text-xs font-semibold uppercase tracking-wider">
                  Configuration
                </p>
              </div>
              <NavItem href={`${base}/settings/fees`} icon="💰" label="Fees" />
              <NavItem href={`${base}/settings/discounts`} icon="🏷️" label="Discounts" />
              <NavItem href={`${base}/settings/addons`} icon="📦" label="Add-ons" />
              <NavItem href={`${base}/settings/transport`} icon="🚌" label="Transport" />
              <NavItem href={`${base}/settings/branding`} icon="🎨" label="Branding" />
              <NavItem href={`${base}/settings/users`} icon="👥" label="Users" />
              <NavItem href={`${base}/settings/school`} icon="🏫" label="School Profile" />
            </>
          )}
        </nav>

        {/* User Footer */}
        <div className="px-4 py-4 border-t border-white/10">
          <p className="text-white text-xs font-medium truncate">
            {userProfile.full_name || userProfile.email}
          </p>
          <p className="text-white/40 text-xs mt-0.5 capitalize">
            {role.replace('_', ' ')}
          </p>
          <form action="/auth/signout" method="POST">
            <button
              type="submit"
              className="mt-3 text-white/40 text-xs hover:text-white/70 transition-colors"
            >
              Sign out →
            </button>
          </form>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

function NavItem({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-3 py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors text-sm font-medium"
    >
      <span className="text-base w-5 text-center">{icon}</span>
      {label}
    </Link>
  )
}
