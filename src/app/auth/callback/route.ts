import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error && sessionData?.user) {
      const user = sessionData.user
      
      // Check if user already has an org
      const { data: existingMembership } = await supabase
        .from('lp_org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .limit(1)
        .single()
      
      // If no org, create one
      if (!existingMembership) {
        const userName = user.user_metadata?.full_name || 
                        user.user_metadata?.name ||
                        user.email?.split('@')[0] || 
                        'User'
        
        // Create organization
        const { data: newOrg, error: orgError } = await supabase
          .from('lp_organizations')
          .insert({
            name: `${userName}'s Workspace`,
            slug: `org-${user.id.substring(0, 8)}-${Date.now()}`
          })
          .select('id')
          .single()
        
        if (newOrg && !orgError) {
          // Add user as owner
          await supabase
            .from('lp_org_members')
            .insert({
              org_id: newOrg.id,
              user_id: user.id,
              role: 'owner'
            })
        }
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
