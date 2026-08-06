'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import TableroMalla from '@/components/TableroMalla'
import ModalGestorCategorias from '@/components/ModalGestorCategorias'
import ModalRamo from '@/components/ModalRamo'
import { useMallaStore } from '@/store/useMallaStore'
import { Settings, Plus, Minus, LogOut, Link as LinkIcon, Calendar as CalendarIcon, LayoutDashboard, TrendingUp, Download, Share2, UploadCloud, UserCircle } from 'lucide-react'
import Link from 'next/link'
import html2canvas from 'html2canvas' 

export default function MallaPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const { ramos, setRamos, setHorarios, modificarSemestres, modificarFilas, setModalCategoriasAbierto, temaPlataforma, setTemaPlataforma } = useMallaStore()
  
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [exportando, setExportando] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  // FIX PROFESIONAL: Estado para el procesador de IA
  const [procesandoIA, setProcesandoIA] = useState(false)

  useEffect(() => {
    let estaMontado = true
    setIsClient(true)

    const cargarDatos = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return router.push('/')
        if (estaMontado) setUser(user)

        const { data: ramosDB, error: dbError } = await supabase.from('ramos').select('*').eq('usuario_id', user.id)
        const { data: horariosDB } = await supabase.from('horarios').select('*').eq('usuario_id', user.id)

        if (dbError) throw dbError

        if (estaMontado) {
          if (ramosDB && Array.isArray(ramosDB)) setRamos(ramosDB)
          if (horariosDB && Array.isArray(horariosDB)) setHorarios(horariosDB)
        }
      } catch (error) {
        console.error("Error al cargar la malla:", error)
      } finally {
        if (estaMontado) setLoading(false)
      }
    }
    cargarDatos()
    return () => { estaMontado = false }
  }, [router, setRamos, setHorarios])

  const exportarMalla = async () => {
    setExportando(true)
    try {
      const elementoMalla = document.getElementById('contenedor-malla')
      if (!elementoMalla) return
      
      const oldOverflow = elementoMalla.style.overflow;
      elementoMalla.style.overflow = 'visible';
      
      const canvas = await html2canvas(elementoMalla, { 
        scale: 2, 
        backgroundColor: '#f8fafc', 
        useCORS: true,
        windowWidth: elementoMalla.scrollWidth,
        windowHeight: Math.max(elementoMalla.scrollHeight, window.innerHeight)
      })

      elementoMalla.style.overflow = oldOverflow;

      const enlace = document.createElement('a')
      enlace.download = 'Mi_Malla_Academica.png'
      enlace.href = canvas.toDataURL('image/png')
      enlace.click()
    } catch (error) {
      alert("Error al exportar la malla.")
    } finally {
      setExportando(false)
    }
  }

  const compartirMalla = () => {
    const mallaLimpia = ramos.map(({ id, usuario_id, ...resto }) => resto)
    const mallaJSON = JSON.stringify(mallaLimpia)
    navigator.clipboard.writeText(mallaJSON)
    alert("¡Código de tu malla copiado al portapapeles! Envíalo a tus compañeros para que lo importen.")
  }

  // FIX PROFESIONAL: Función conectada para Importar Malla vía IA
  const handleImportarIA = async (e) => {
    const file = e.target.files[0]
    if (!file || !user) return
    setProcesandoIA(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('usuario_id', user.id)

      const response = await fetch('/api/calendario/importar-malla', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) throw new Error("Fallo en el servidor al analizar el documento.")
      
      alert("¡Malla importada y procesada correctamente!")
      window.location.reload() // Sincronización rápida
    } catch (error) {
      alert("Error al importar: " + error.message)
    } finally {
      setProcesandoIA(false)
      e.target.value = null // Resetea el input file
    }
  }

  if (loading) return (
    <div className="flex h-screen items-center justify-center text-white font-bold text-xl transition-colors duration-300" style={{ backgroundColor: isClient ? (temaPlataforma || '#0f172a') : '#0f172a' }}>
      Cargando Malla...
    </div>
  )

  const totalRamos = ramos.length
  const aprobados = ramos.filter(r => r.estado === 'aprobado').length
  const porcentaje = totalRamos === 0 ? 0 : Math.round((aprobados / totalRamos) * 100)

  return (
    <div className="flex h-screen bg-[#f1f5f9] font-sans">
      
      <aside className="w-[280px] text-white flex flex-col shrink-0 border-r border-slate-900 shadow-xl z-20 transition-colors duration-300" style={{ backgroundColor: isClient ? (temaPlataforma || '#0f172a') : '#0f172a' }}>
        <div className="p-6 pb-2">
          <h1 className="text-2xl font-extrabold text-white mb-2 tracking-tight">Mi Malla Académica</h1>
          <button className="text-sm text-sky-300 hover:text-white flex items-center gap-2 transition font-medium"><LinkIcon size={14} /> Editar Nombre</button>
        </div>

        <div className="px-6 pb-4 pt-2">
          <label className="text-xs font-bold text-slate-300 uppercase flex items-center gap-2 cursor-pointer hover:text-white transition">
            Color del Tema: 
            <input 
              type="color" 
              value={isClient ? (temaPlataforma || '#0f172a') : '#0f172a'} 
              onChange={(e) => setTemaPlataforma(e.target.value)} 
              className="w-8 h-8 p-0 border-0 rounded cursor-pointer bg-transparent"
            />
          </label>
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
          <Link href="/dashboard" className="w-full flex items-center gap-3 bg-slate-800/80 hover:bg-slate-700 text-sm py-2.5 px-4 rounded-md transition text-white font-bold border border-slate-700/50">
            <LayoutDashboard size={16} className="text-sky-400" /> Panel de Inicio
          </Link>
          <Link href="/rendimiento" className="w-full flex items-center gap-3 bg-slate-800/80 hover:bg-slate-700 text-sm py-2.5 px-4 rounded-md transition text-white font-bold border border-slate-700/50 mt-2">
            <TrendingUp size={16} className="text-emerald-400" /> Rendimiento & PPA
          </Link>
          <Link href="/evaluaciones" className="w-full flex items-center gap-3 bg-slate-800/80 hover:bg-slate-700 text-sm py-2.5 px-4 rounded-md transition text-white font-bold border border-slate-700/50 mt-2">
            <CalendarIcon size={16} className="text-amber-400" /> Pruebas y Tareas
          </Link>
          <Link href="/calendario" className="w-full flex items-center gap-3 bg-blue-600 hover:bg-blue-700 text-sm py-2.5 px-4 rounded-md transition text-white font-bold shadow-md shadow-blue-500/20 mt-2">
            <CalendarIcon size={16} /> Horario y Asistencia
          </Link>
          <Link href="/perfil" className="w-full flex items-center gap-3 bg-slate-800/80 hover:bg-slate-700 text-sm py-2.5 px-4 rounded-md transition text-white font-bold border border-slate-700/50 mt-2">
            <UserCircle size={16} className="text-purple-400" /> Mi Perfil
          </Link>

          <h3 className="text-xs font-bold text-slate-400 mt-6 mb-3 tracking-widest uppercase">Herramientas Pro</h3>
          <button onClick={exportarMalla} disabled={exportando} className="w-full flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 text-sm py-2.5 px-4 rounded-md text-left transition text-white font-bold shadow-md">
            <Download size={16} /> {exportando ? 'Exportando...' : 'Exportar Malla (PNG)'}
          </button>
          <button onClick={compartirMalla} className="w-full flex items-center gap-3 bg-teal-600 hover:bg-teal-700 text-sm py-2.5 px-4 rounded-md text-left transition text-white font-bold shadow-md mt-2">
            <Share2 size={16} /> Compartir Plantilla
          </button>
          
          {/* FIX PROFESIONAL: Botón IA Activado con Input Integrado */}
          <label className={`w-full flex items-center gap-3 ${procesandoIA ? 'bg-amber-800' : 'bg-amber-600 hover:bg-amber-700'} text-sm py-2.5 px-4 rounded-md text-left transition text-white font-bold shadow-md mt-2 cursor-pointer`}>
            <UploadCloud size={16} /> {procesandoIA ? 'Procesando IA...' : 'Importar Malla (IA)'}
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleImportarIA} disabled={procesandoIA} />
          </label>

          <h3 className="text-xs font-bold text-slate-400 mt-6 mb-3 tracking-widest uppercase">Diseño de Cuadrícula</h3>
          <button onClick={() => setModalCategoriasAbierto(true)} className="w-full flex items-center gap-3 bg-black/20 hover:bg-black/40 text-sm py-2.5 px-4 rounded-md transition font-medium"><Settings size={16} className="text-slate-300" /> Categorías</button>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button onClick={() => modificarSemestres(1)} className="flex justify-center items-center gap-2 bg-black/20 hover:bg-black/40 text-xs py-2 rounded-md transition"><Plus size={14} /> Columna</button>
            <button onClick={() => modificarSemestres(-1)} className="flex justify-center items-center gap-2 bg-black/20 hover:bg-black/40 text-xs py-2 rounded-md transition"><Minus size={14} /> Columna</button>
            <button onClick={() => modificarFilas(1)} className="flex justify-center items-center gap-2 bg-black/20 hover:bg-black/40 text-xs py-2 rounded-md transition"><Plus size={14} /> Fila</button>
            <button onClick={() => modificarFilas(-1)} className="flex justify-center items-center gap-2 bg-black/20 hover:bg-black/40 text-xs py-2 rounded-md transition"><Minus size={14} /> Fila</button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700/50 bg-black/30">
          <button onClick={async () => { await supabase.auth.signOut(); router.push('/') }} className="w-full flex justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white text-sm py-2 rounded-md transition font-bold"><LogOut size={16} /> Salir</button>
        </div>
      </aside>

      <main id="contenedor-malla" className="flex-1 overflow-auto p-8 relative bg-[#f1f5f9]">
        <TableroMalla />
      </main>

      <ModalGestorCategorias />
      <ModalRamo />
    </div>
  )
}