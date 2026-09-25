'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const supabase = createClient()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lang, setLang] = useState('en')
  const ar = lang === 'ar'

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/app')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.toLowerCase().trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) setError(ar ? 'تعذر إرسال رابط تسجيل الدخول.' : 'Could not send sign-in link.')
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center bg-slate-50 px-4 ${ar ? 'rtl' : 'ltr'}`} dir={ar ? 'rtl' : 'ltr'}>
      <button onClick={() => setLang(ar ? 'en' : 'ar')} className="absolute top-6 end-6 text-sm text-slate-500 hover:text-slate-900">
        {ar ? 'English' : 'العربية'}
      </button>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-block bg-[#0D1F5C] text-white font-bold text-sm px-3 py-1.5 rounded mb-4">EduFlow</div>
          <h1 className="text-xl font-bold text-slate-900">{ar ? 'تسجيل الدخول' : 'Sign in to EduFlow'}</h1>
          <p className="text-sm text-slate-500 mt-1">{ar ? 'منصة إدارة المدارس' : 'School Administration Platform'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{ar ? 'البريد الإلكتروني' : 'Email address'}</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  placeholder="name@school.edu.sa" dir="ltr" />
              </div>
              {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
              <button type="submit" disabled={loading || !email}
                className="w-full bg-[#0D1F5C] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#1A3380] disabled:opacity-50">
                {loading ? (ar ? 'جاري الإرسال...' : 'Sending...') : (ar ? 'إرسال رابط الدخول' : 'Send sign-in link')}
              </button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-4xl">📧</div>
              <h2 className="font-bold text-slate-900">{ar ? 'تحقق من بريدك الإلكتروني' : 'Check your email'}</h2>
              <p className="text-sm text-slate-600">{ar ? `أرسلنا رابط تسجيل الدخول إلى ${email}` : `We sent a sign-in link to ${email}`}</p>
              <p className="text-xs text-slate-400">{ar ? 'انقر على الرابط في البريد الإلكتروني لتسجيل الدخول' : 'Click the link in the email to sign in'}</p>
              <button onClick={() => { setSent(false); setEmail('') }} className="text-sm text-slate-500 hover:text-slate-900">
                {ar ? 'استخدام بريد إلكتروني آخر' : 'Use a different email'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
