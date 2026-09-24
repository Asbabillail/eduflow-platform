import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface Props {
  params: { tenant: string }
}

export default async function DashboardPage({ params }: Props) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get tenant data
  const { data: tenant } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', params.tenant)
    .single()

  if (!tenant) redirect('/login')

  // Get current user profile
  const { data: userProfile } = await supabase
    .from('tenant_users')
    .select('*')
    .eq('auth_user_id', user.id)
    .eq('tenant_id', tenant.id)
    .single()

  // Dashboard stats
  const { count: totalQuotations } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)

  const { count: pendingApprovals } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .eq('status', 'pending_approval')

  const { count: todayQuotations } = await supabase
    .from('quotations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenant.id)
    .gte('created_at', new Date().toISOString().split('T')[0])

  // Recent quotations
  const { data: recentQuotations } = await supabase
    .from('quotations')
    .select('id, reference_number, parent_name, grand_total, currency, status, created_at')
    .eq('tenant_id', tenant.id)
    .order('created_at', { ascending: false })
    .limit(5)

  const canCreateQuotation = ['admission_staff', 'finance_manager', 'tenant_admin']
    .includes(userProfile?.role || '')

  return (
    <div className="p-6 max-w-7xl mx-auto">

      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {userProfile?.full_name?.split(' ')[0] || 'Staff'} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {tenant.name_en} · {new Date().toLocaleDateString('en-SA', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
          })}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Quotations"
          value={totalQuotations ?? 0}
          color="blue"
        />
        <StatCard
          label="Pending Approval"
          value={pendingApprovals ?? 0}
          color="amber"
          link={`/${params.tenant}/approvals`}
        />
        <StatCard
          label="Today"
          value={todayQuotations ?? 0}
          color="green"
        />
        <StatCard
          label="Your Role"
          value={formatRole(userProfile?.role || '')}
          color="purple"
          isText
        />
      </div>

      {/* Quick Actions */}
      {canCreateQuotation && (
        <div className="mb-6">
          <Link
            href={`/${params.tenant}/quotations/new`}
            className="inline-flex items-center gap-2 bg-[#0D1F5C] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-[#1A3380] transition-colors"
          >
            <span>+</span>
            New Fee Quotation
          </Link>
        </div>
      )}

      {/* Pending Approvals Alert */}
      {(pendingApprovals ?? 0) > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-900 text-sm">
              {pendingApprovals} quotation{(pendingApprovals ?? 0) > 1 ? 's' : ''} awaiting approval
            </p>
            <p className="text-amber-700 text-xs mt-0.5">
              These require a finance manager or admin to approve before the PDF can be generated.
            </p>
          </div>
          <Link
            href={`/${params.tenant}/approvals`}
            className="bg-amber-600 text-white text-xs font-medium px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors whitespace-nowrap"
          >
            Review Now
          </Link>
        </div>
      )}

      {/* Recent Quotations */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900 text-sm">Recent Quotations</h2>
          <Link
            href={`/${params.tenant}/quotations`}
            className="text-xs text-[#0EA5E9] font-medium hover:underline"
          >
            View all
          </Link>
        </div>

        {!recentQuotations || recentQuotations.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-400 text-sm">
            No quotations yet. Create your first one above.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentQuotations.map(q => (
              <Link
                key={q.id}
                href={`/${params.tenant}/quotations/${q.id}`}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">{q.parent_name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{q.reference_number}</p>
                </div>
                <div className="flex items-center gap-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {formatCurrency(q.grand_total, q.currency)}
                  </p>
                  <StatusBadge status={q.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}

// ---- Sub-components ----

function StatCard({
  label, value, color, link, isText
}: {
  label: string
  value: number | string
  color: 'blue' | 'amber' | 'green' | 'purple'
  link?: string
  isText?: boolean
}) {
  const colorMap = {
    blue:   'border-t-[#0EA5E9]',
    amber:  'border-t-amber-400',
    green:  'border-t-emerald-500',
    purple: 'border-t-violet-500',
  }
  const card = (
    <div className={`bg-white rounded-xl border border-slate-200 border-t-4 ${colorMap[color]} p-4`}>
      <p className="text-xs text-slate-500 font-medium mb-1">{label}</p>
      <p className={`font-bold text-slate-900 ${isText ? 'text-base' : 'text-2xl'}`}>
        {value}
      </p>
    </div>
  )
  return link ? <a href={link}>{card}</a> : card
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; class: string }> = {
    draft:            { label: 'Draft',           class: 'bg-slate-100 text-slate-600' },
    pending_approval: { label: 'Pending',          class: 'bg-amber-100 text-amber-700' },
    approved:         { label: 'Approved',         class: 'bg-green-100 text-green-700' },
    rejected:         { label: 'Rejected',         class: 'bg-red-100 text-red-700' },
    expired:          { label: 'Expired',          class: 'bg-slate-100 text-slate-400' },
    converted:        { label: 'Enrolled',         class: 'bg-blue-100 text-blue-700' },
  }
  const s = map[status] ?? { label: status, class: 'bg-slate-100 text-slate-500' }
  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${s.class}`}>
      {s.label}
    </span>
  )
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat('en-SA', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' ' + currency
}

function formatRole(role: string) {
  const map: Record<string, string> = {
    viewer:           'Viewer',
    admission_staff:  'Admission',
    finance_manager:  'Finance',
    tenant_admin:     'Admin',
    super_admin:      'Super Admin',
  }
  return map[role] ?? role
}
