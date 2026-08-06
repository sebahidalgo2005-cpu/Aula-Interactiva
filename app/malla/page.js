'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import html2canvas from 'html2canvas'
import Navbar from '@/components/Navbar'
import { Plus, Download, Layers } from 'lucide-react'
import { useMallaStore } from '@/store/useMallaStore'
import TableroMalla from '@/components/TableroMalla'
import ModalRamo from '@/components/ModalRamo'
import ModalGestorCategorias from '@/components/ModalGestorCategorias'

export default function MallaPage() {
  const supabase = createClient()
  const router = useRouter()
  const mallaRef = useRef(null)

  const { 
    setRamos, setSemestres, 
    agregarSemestre, agregarFila, setRamoEnFoco, setCategorias
  } = useMallaStore()

  const [loading, setLoading] = useState(true)
  const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState(false)
  const [exportando, setExportando] = useState(false)

  useEffect(() => {
    let isMounted = true

    const cargarDatos = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return router.push('/')

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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1f5f9] dark:bg-slate-900 font-bold text-xl text-slate-800 dark:text-white">
        Cargando Malla Académica...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors">
      <Navbar />

      {/* BARRA DE ACCIONES DE LA MALLA */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-8 py-3 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setRamoEnFoco({ id: null, nuevo: true })} 
            className="text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition"
            style={{ backgroundColor: 'var(--primary-color, #3b82f6)' }}
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

      {/* ÁREA DE TABLERO */}
      <main className="flex-1 p-8 overflow-auto custom-scrollbar">
        <div ref={mallaRef} className="bg-transparent rounded-2xl">
          <TableroMalla />
        </div>
      </main>

      <ModalRamo />
      {modalCategoriasAbierto && (
        <ModalGestorCategorias onClose={() => setModalCategoriasAbierto(false)} />
      )}

    </div>
  )
}