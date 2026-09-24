import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type")

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: type as any })
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: tu } = await supabase
          .from("tenant_users")
          .select("tenant_id")
          .eq("auth_user_id", user.id)
          .eq("is_active", true)
          .single()
        if (tu?.tenant_id) {
          const { data: tenant } = await supabase
            .from("tenants")
            .select("slug")
            .eq("id", tu.tenant_id)
            .single()
          if (tenant?.slug) return NextResponse.redirect(`${origin}/${tenant.slug}/dashboard`)
        }
      }
    }
  }
  return NextResponse.redirect(`${origin}/login`)
}