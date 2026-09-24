'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lang, setLang] = useState<'en' | 'ar'>('en')

  const isAr = lang === 'ar'

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        shouldCreateUser: false, // Only allow existing users
      },
    })

    if (error) {
      // Don't reveal whether the email exists or not
      // Always show the same message for security
      setError(
        isAr
          ? 'تحقق من بريدك الإلكتروني. إذا كان لديك حساب، ستتلقى رمز التحقق.'
          : 'Check your email. If you have an account, you will receive a verification code.'
      )
      // Still advance to OTP step (so we don't reveal if email exists)
      setStep('otp')
    } else {
      setStep('otp')
    }

    setLoading(false)
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.toLowerCase().trim(),
      token: otp.trim(),
      type: 'email',
    })

    if (error || !data.session) {
      setError(
        isAr
          ? 'رمز التحقق غير صحيح أو انتهت صلاحيته. يرجى المحاولة مرة أخرى.'
          : 'Invalid or expired code. Please try again.'
      )
      setLoading(false)
      return
    }

    // Decode JWT to find tenant slug
    const jwt = data.session.access_token
    const payload = JSON.parse(
      Buffer.from(jwt.split('.')[1], 'base64').toString()
    )

    if (payload.user_role === 'super_admin') {
      router.push('/platform')
    } else if (payload.tenant_id) {
      // Look up the tenant slug
      const { data: tenant } = await supabase
        .from('tenants')
        .select('slug')
        .eq('id', payload.tenant_id)
        .single()

      if (tenant) {
        router.push(`/${tenant.slug}/dashboard`)
      } else {
        setError('Account configuration error. Please contact your administrator.')
      }
    } else {
      setError('Account not configured. Please contact your administrator.')
    }

    setLoading(false)
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 ${isAr ? 'rtl font-arabic' : 'ltr'}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Language Toggle */}
      <button
        onClick={() => setLang(isAr ? 'en' : 'ar')}
        className="absolute top-6 end-6 text-sm text-slate-500 hover:text-slate-900 font-medium"
      >
        {isAr ? 'English' : 'العربية'}
      </button>

      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="bg-[#0D1F5C] text-white font-bold text-sm px-3 py-1.5 rounded">
              EduFlow
            </div>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            {isAr ? 'تسجيل الدخول' : 'Sign in to EduFlow'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isAr ? 'منصة إدارة المدارس' : 'School Administration Platform'}
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">

          {step === 'email' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {isAr ? 'البريد الإلكتروني' : 'Email address'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoFocus
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                  placeholder={isAr ? 'name@school.edu.sa' : 'name@school.edu.sa'}
                  dir="ltr"
                />
              </div>

              {error && (
                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || !email}
                className="w-full bg-[#0D1F5C] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#1A3380] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (isAr ? 'جاري الإرسال...' : 'Sending...')
                  : (isAr ? 'إرسال رمز التحقق' : 'Send verification code')}
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center text-sm text-slate-600 mb-4">
                {isAr
                  ? `أرسلنا رمز تحقق إلى ${email}`
                  : `We sent a code to ${email}`}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  {isAr ? 'رمز التحقق' : 'Verification code'}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                  required
                  autoFocus
                  className="w-full px-3 py-3 border border-slate-300 rounded-lg text-2xl text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-[#0EA5E9] focus:border-transparent"
                  placeholder="000000"
                  dir="ltr"
                />
              </div>

              {error && (
                <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-[#0D1F5C] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#1A3380] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (isAr ? 'جاري التحقق...' : 'Verifying...')
                  : (isAr ? 'تسجيل الدخول' : 'Sign in')}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep('email')
                  setOtp('')
                  setError(null)
                }}
                className="w-full text-sm text-slate-500 hover:text-slate-900 py-1"
              >
                {isAr ? 'تغيير البريد الإلكتروني' : 'Change email'}
              </button>
            </form>
          )}

        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          {isAr
            ? 'للدعم الفني، تواصل مع مسؤول النظام'
            : 'For access, contact your school administrator'}
        </p>
      </div>
    </div>
  )
}
