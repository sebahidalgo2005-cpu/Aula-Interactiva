'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import TableroMalla from '@/components/TableroMalla'
import ModalGestorCategorias from '@/components/ModalGestorCategorias'
import { useMallaStore } from '@/store/useMallaStore'
import { User, Settings, Plus, Minus, LogOut, Link as LinkIcon, Calendar as CalendarIcon, ListOrdered, LayoutDashboard, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function MallaPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const { ramos, setRamos, modificarSemestres, modificarFilas, setModalCategoriasAbierto } = useMallaStore()
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    let estaMontado = true // Solución a las fugas de memoria

    const cargarDatos = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return router.push('/')
        
        if (estaMontado) setUser(user)

        const { data: ramosDB, error: dbError } = await supabase.from('ramos').select('*').eq('usuario_id', user.id)
        if (dbError) throw dbError

        if (estaMontado && ramosDB && Array.isArray(ramosDB)) {
          setRamos(ramosDB)
        }
      } catch (error) {
        console.error("Error al cargar la malla:", error)
      } finally {
        if (estaMontado) setLoading(false)
      }
    }
    cargarDatos()

    return () => { estaMontado = false }
  }, [router, setRamos])

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#0f172a] text-white font-bold text-xl">Cargando Malla...</div>

  const totalRamos = ramos.length
  const aprobados = ramos.filter(r => r.estado === 'aprobado').length
  const porcentaje = totalRamos === 0 ? 0 : Math.round((aprobados / totalRamos) * 100)

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans">
      
      <aside className="w-[280px] bg-[#0f172a] text-white flex flex-col shrink-0 border-r border-slate-900 shadow-xl z-10">
        <div className="p-6">
          <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Mi Malla Académica</h1>
          <button className="text-sm text-sky-300 hover:text-white flex items-center gap-2 transition font-medium"><LinkIcon size={14} /> Editar Nombre</button>
        </div>

        <div className="px-6 py-5 border-t border-slate-700/50">
          <h3 className="text-xs font-bold text-slate-400 mb-3 tracking-widest uppercase">Progreso Académico</h3>
          <div className="w-full bg-slate-800 rounded-full h-3 mb-2 overflow-hidden shadow-inner">
            <div className="bg-sky-500 h-3 rounded-full transition-all duration-500" style={{ width: `${porcentaje}%` }}></div>
          </div>
          <div className="text-right text-sm text-sky-300 font-bold">{aprobados} / {totalRamos} ({porcentaje}%)</div>
        </div>

        <div className="px-6 py-5 border-t border-slate-700/50 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
          <h3 className="text-xs font-bold text-slate-400 mb-3 tracking-widest uppercase">Módulos Principales</h3>
          
          <Link href="/dashboard" className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-sm py-2.5 px-4 rounded-md transition text-white font-bold border border-slate-700">
            <LayoutDashboard size={16} className="text-sky-400" /> Panel de Inicio
          </Link>
          <Link href="/rendimiento" className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-sm py-2.5 px-4 rounded-md transition text-white font-bold border border-slate-700 mt-2">
            <TrendingUp size={16} className="text-emerald-400" /> Rendimiento & PPA
          </Link>
          <Link href="/evaluaciones" className="w-full flex items-center gap-3 bg-slate-800 hover:bg-slate-700 text-sm py-2.5 px-4 rounded-md transition text-white font-bold border border-slate-700 mt-2">
            <CalendarIcon size={16} className="text-amber-400" /> Pruebas y Tareas
          </Link>
          <Link href="/calendario" className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-sm py-2.5 px-4 rounded-md transition text-white font-bold shadow-md shadow-blue-500/20 mt-2">
            <CalendarIcon size={16} /> Horario y Asistencia
          </Link>

          <h3 className="text-xs font-bold text-slate-400 mt-6 mb-3 tracking-widest uppercase">Administración de Malla</h3>
          <button onClick={() => setModalCategoriasAbierto(true)} className="w-full flex items-center gap-3 bg-[#1e293b] hover:bg-[#334155] text-sm py-2.5 px-4 rounded-md text-left transition text-white font-medium border border-slate-700">
            <Settings size={16} className="text-slate-400" /> Gestor Categorías
          </button>
          <button onClick={() => modificarSemestres(1)} className="w-full flex items-center gap-3 bg-[#1e293b] hover:bg-[#334155] text-sm py-2.5 px-4 rounded-md text-left transition text-white font-medium border border-slate-700">
            <Plus size={16} className="text-slate-400" /> Añadir Semestre
          </button>
          <button onClick={() => modificarSemestres(-1)} className="w-full flex items-center gap-3 bg-[#1e293b] hover:bg-[#334155] text-sm py-2.5 px-4 rounded-md text-left transition text-white font-medium border border-slate-700">
            <Minus size={16} className="text-slate-400" /> Quitar Semestre
          </button>
          <button onClick={() => modificarFilas(1)} className="w-full flex items-center gap-3 bg-[#1e293b] hover:bg-[#334155] text-sm py-2.5 px-4 rounded-md text-left transition text-white font-medium border border-slate-700">
            <Plus size={16} className="text-slate-400" /> Añadir Fila
          </button>
          <button onClick={() => modificarFilas(-1)} className="w-full flex items-center gap-3 bg-[#1e293b] hover:bg-[#334155] text-sm py-2.5 px-4 rounded-md text-left transition text-white font-medium border border-slate-700">
            <Minus size={16} className="text-slate-400" /> Quitar Fila
          </button>
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-[#0b1120]">
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-sm py-2 rounded-md transition font-bold">
            <LogOut size={16} /> Cerrar Sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-8 relative">
        <TableroMalla />
      </main>

      <ModalGestorCategorias />
    </div>
  )
}