import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  if (code) {
    // Aquí agregamos el await que faltaba
    const supabase = await createClient() 
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Si el inicio de sesión es exitoso, redirige a la malla
      return NextResponse.redirect(`${origin}/malla`)
    }
  }

  // Si hay error, redirige al inicio
  return NextResponse.redirect(`${origin}/`)
}