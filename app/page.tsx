'use client'
import { createClient } from '@/utils/supabase/client'

export default function Home() {
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-24">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Mi Universidad ERP</h1>
        <p className="text-gray-500 mb-8 font-medium">Gestiona tu malla, notas y asistencia.</p>
        
        <button 
          onClick={handleGoogleLogin}
          className="flex items-center justify-center w-full gap-3 bg-white border-2 border-slate-300 text-slate-700 hover:bg-slate-50 font-bold py-3 px-4 rounded-lg transition-all shadow-sm"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google logo" />
          Continuar con Google
        </button>
      </div>
    </main>
  )
}