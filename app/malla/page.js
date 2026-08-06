'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import html2canvas from 'html2canvas'
import { 
  Plus, Download, Layers, Calendar, CheckSquare, 
  BarChart2, User, LogOut, LayoutDashboard 
} from 'lucide-react'
import { useMallaStore } from '@/store/useMallaStore'
import TableroMalla from '@/components/TableroMalla'
import ModalRamo from '@/components/ModalRamo'
import ModalGestorCategorias from '@/components/ModalGestorCategorias'

export default function MallaPage() {
  const supabase = createClient()
  const router = useRouter()
  const mallaRef = useRef(null)

  const { 
    ramos, setRamos, semestres, setSemestres, 
    agregarSemestre, agregarFila, setRamoEnFoco,
    categorias, setCategorias
  } = useMallaStore()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState(false)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    let isMounted = true

    const cargarDatos = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        return router.push('/')
      }

      if (isMounted) setUser(user)

      const [ramosRes, semestresRes, catRes] = await Promise.all([
        supabase.from('ramos').select('*').eq('usuario_id', user.id),
        supabase.from('semestres').select('*').eq('usuario_id', user.id).order('numero', { ascending: true }),
        supabase.from('categorias').select('*').eq('usuario_id', user.id)
      ])

      if (isMounted) {
        if (ramosRes.data) setRamos(ramosRes.data)
        if (semestresRes.data) setSemestres(semestresRes.data)
        if (catRes.data) setCategorias(catRes.data)
        setLoading(false)
      }
    }

    cargarDatos()
    return () => { isMounted = false }
  }, [])

  // Exportar malla a Imagen sin recortar scroll
  const handleExportarImagen = async () => {
    if (!mallaRef.current) return
    try {
      setExportando(true)
      const canvas = await html2canvas(mallaRef.current, {
        scale: 2,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: mallaRef.current.scrollWidth,
        windowHeight: mallaRef.current.scrollHeight
      })

      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      link.href = image
      link.download = `Malla_Academica_${new Date().toISOString().split('T')[0]}.png`
      link.click()
    } catch (err) {
      console.error(err)
      alert("No se pudo exportar la imagen de la malla.")
    } finally {
      setExportando(false)
    }
  }

  const handleCerrarSesion = async () => {
    if (window.confirm("¿Seguro que deseas salir?")) {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 dark:bg-slate-900 font-bold text-xl text-slate-800 dark:text-white">
        Cargando tu Malla Académica...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors">
      
      {/* BARRA DE NAVEGACIÓN SUPERIOR HEADER */}
      <header className="bg-[#0f172a] text-white py-3.5 px-6 shadow-lg sticky top-0 z-30 flex items-center justify-between flex-wrap gap-4">
        
        {/* LOGO Y TITULO */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center font-black text-lg shadow-md">
            M
          </div>
          <div>
            <h1 className="font-extrabold text-lg leading-tight tracking-tight">Aula Interactiva</h1>
            <p className="text-[11px] font-bold text-slate-400">Malla Curricular Personalizada</p>
          </div>
        </div>

        {/* NAVEGACIÓN PRINCIPAL */}
        <nav className="flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
          <Link href="/dashboard" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition">
            <LayoutDashboard size={15}/> Dashboard
          </Link>

          <Link href="/malla" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold bg-blue-600 text-white shadow-sm transition">
            <Layers size={15}/> Malla
          </Link>

          <Link href="/calendario" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition">
            <Calendar size={15}/> Calendario
          </Link>

          <Link href="/evaluaciones" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition">
            <CheckSquare size={15}/> Evaluaciones
          </Link>

          <Link href="/rendimiento" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition">
            <BarChart2 size={15}/> Rendimiento
          </Link>
        </nav>

        {/* ACCIONES Y BOTÓN DE PERFIL */}
        <div className="flex items-center gap-3">
          
          <Link 
            href="/perfil" 
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl border border-slate-700 transition"
          >
            <div className="w-5 h-5 rounded-full bg-sky-500 overflow-hidden flex items-center justify-center shrink-0">
              {user?.user_metadata?.avatar_url ? (
                <Image src={user.user_metadata.avatar_url} alt="User" width={20} height={20} unoptimized />
              ) : (
                <User size={12} className="text-white"/>
              )}
            </div>
            <span className="max-w-[100px] truncate">{user?.user_metadata?.full_name?.split(' ')[0] || 'Perfil'}</span>
          </Link>

          <button 
            onClick={handleCerrarSesion}
            title="Cerrar Sesión"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
          >
            <LogOut size={18} />
          </button>
        </div>

      </header>

      {/* BARRA DE HERRAMIENTAS DE LA MALLA */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setRamoEnFoco({ id: null, nuevo: true })} 
            className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus size={16}/> Añadir Ramo
          </button>

          <button 
            onClick={agregarSemestre} 
            className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus size={16}/> Añadir Semestre
          </button>

          <button 
            onClick={agregarFila} 
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-extrabold text-xs px-4 py-2 rounded-lg transition"
          >
            Añadir Fila
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setModalCategoriasAbierto(true)} 
            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-extrabold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5"
          >
            <Layers size={15}/> Categorías
          </button>

          <button 
            onClick={handleExportarImagen} 
            disabled={exportando}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50"
          >
            <Download size={15}/> {exportando ? 'Exportando...' : 'Exportar Imagen'}
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL DE LA MALLA */}
      <main className="flex-1 p-8 overflow-auto custom-scrollbar">
        <div ref={mallaRef} className="bg-transparent rounded-2xl">
          <TableroMalla />
        </div>
      </main>

      {/* MODALES REQUERIDOS */}
      <ModalRamo />
      
      {modalCategoriasAbierto && (
        <ModalGestorCategorias onClose={() => setModalCategoriasAbierto(false)} />
      )}

    </div>
  )
}