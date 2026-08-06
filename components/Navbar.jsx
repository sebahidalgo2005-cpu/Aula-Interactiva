'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/utils/supabase/client'
import { 
  LayoutDashboard, Layers, Calendar, CheckSquare, 
  BarChart2, User, LogOut 
} from 'lucide-react'

export default function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const getUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUser(user)
    }
    getUsuario()
  }, [])

  const handleCerrarSesion = async () => {
    if (window.confirm("¿Seguro que deseas salir de Aula Interactiva?")) {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/malla', label: 'Malla', icon: Layers },
    { href: '/calendario', label: 'Calendario', icon: Calendar },
    { href: '/evaluaciones', label: 'Evaluaciones', icon: CheckSquare },
    { href: '/rendimiento', label: 'Rendimiento', icon: BarChart2 },
  ]

  return (
    <header className="bg-[#0f172a] text-white py-3 px-6 shadow-md sticky top-0 z-40 flex items-center justify-between flex-wrap gap-4 transition-colors">
      
      {/* LOGO */}
      <Link href="/dashboard" className="flex items-center gap-3 group">
        <div 
          className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-md transition-transform group-hover:scale-105"
          style={{ backgroundColor: 'var(--primary-color, #3b82f6)' }}
        >
          A
        </div>
        <div>
          <h1 className="font-extrabold text-base leading-tight tracking-tight">Aula Interactiva</h1>
          <p className="text-[10px] font-bold text-slate-400">Plataforma Académica</p>
        </div>
      </Link>

      {/* MENÚ NAVEGACIÓN */}
      <nav className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isActive
                  ? 'text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
              style={isActive ? { backgroundColor: 'var(--primary-color, #3b82f6)' } : {}}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* PERFIL Y SALIR */}
      <div className="flex items-center gap-3">
        <Link 
          href="/perfil" 
          className={`flex items-center gap-2 font-bold text-xs px-3 py-1.5 rounded-xl border transition ${
            pathname === '/perfil' 
              ? 'border-blue-500 bg-slate-800 text-white' 
              : 'border-slate-700/80 bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <div 
            className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'var(--primary-color, #3b82f6)' }}
          >
            {user?.user_metadata?.avatar_url ? (
              <Image src={user.user_metadata.avatar_url} alt="User" width={20} height={20} unoptimized />
            ) : (
              <User size={12} className="text-white"/>
            )}
          </div>
          <span className="max-w-[110px] truncate">
            {user?.user_metadata?.full_name?.split(' ')[0] || 'Mi Perfil'}
          </span>
        </Link>

        <button 
          onClick={handleCerrarSesion}
          title="Cerrar Sesión"
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
        >
          <LogOut size={17} />
        </button>
      </div>

    </header>
  )
}