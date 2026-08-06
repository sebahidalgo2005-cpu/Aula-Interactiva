'use client'
import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import html2canvas from 'html2canvas'
import Navbar from '@/components/Navbar'
import { Plus, Minus, Download, Layers, CloudUpload, FileText, Upload } from 'lucide-react'
import { useMallaStore } from '@/store/useMallaStore'
import TableroMalla from '@/components/TableroMalla'
import ModalRamo from '@/components/ModalRamo'
import ModalGestorCategorias from '@/components/ModalGestorCategorias'

export default function MallaPage() {
  const supabase = createClient()
  const router = useRouter()
  const mallaRef = useRef(null)
  const fileInputRef = useRef(null)

  const { 
    ramos, setRamos, semestres, setSemestres, categorias, setCategorias,
    agregarSemestre, eliminarSemestre, agregarFila, eliminarFila, setRamoEnFoco, setFilas
  } = useMallaStore()

  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [importando, setImportando] = useState(false)
  const [modalCategoriasAbierto, setModalCategoriasAbierto] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return router.push('/')
      setUser(user)

      const [ramosRes, semestresRes, catRes] = await Promise.all([
        supabase.from('ramos').select('*').eq('usuario_id', user.id),
        supabase.from('semestres').select('*').eq('usuario_id', user.id).order('numero', { ascending: true }),
        supabase.from('categorias').select('*').eq('usuario_id', user.id)
      ])

      // Cálculo Seguro de filas
      if (ramosRes.data) {
        setRamos(ramosRes.data)
        let maxFilaDetectada = 9
        ramosRes.data.forEach(r => {
          const fn = parseInt(r.fila, 10)
          if (!isNaN(fn) && fn > maxFilaDetectada) maxFilaDetectada = fn
        })
        setFilas(maxFilaDetectada + 1)
      }
      
      if (semestresRes.data && semestresRes.data.length > 0) setSemestres(semestresRes.data)
      else setSemestres([{ id: '1', numero: 1 }, { id: '2', numero: 2 }]) 
      
      if (catRes.data) setCategorias(catRes.data)
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const handleGuardarNube = async () => {
    setGuardando(true)
    try {
      const semestresData = semestres.map(s => ({ ...s, usuario_id: user.id }))
      await supabase.from('semestres').upsert(semestresData)
      
      const ramosData = ramos.map(r => ({ ...r, usuario_id: user.id }))
      if (ramosData.length > 0) {
        const { error } = await supabase.from('ramos').upsert(ramosData)
        if (error) throw error
      }
      alert("¡Malla guardada y sincronizada correctamente en la nube!")
    } catch (error) {
      console.error(error)
      alert("Error al sincronizar con la base de datos.")
    } finally {
      setGuardando(false)
    }
  }

  const handleImportarPDF = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImportando(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('usuario_id', user.id)

    try {
      const response = await fetch('/api/calendario/importar-malla', { method: 'POST', body: formData })
      if (!response.ok) throw new Error("Error en el servidor de IA")
      const data = await response.json()
      setRamos([...ramos, ...data.ramosExtraidos])
      alert("¡Malla analizada e importada con éxito!")
    } catch (error) {
      console.error(error)
      alert("Hubo un problema procesando el PDF. Intenta ingresarlos manualmente.")
    } finally {
      setImportando(false)
      if(fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExportarImagen = async () => {
    if (!mallaRef.current) return
    try {
      const canvas = await html2canvas(mallaRef.current, {
        scale: 2, useCORS: true, scrollX: 0, scrollY: 0,
        windowWidth: mallaRef.current.scrollWidth, windowHeight: mallaRef.current.scrollHeight
      })
      const link = document.createElement('a')
      link.href = canvas.toDataURL('image/png')
      link.download = `Mi_Malla_${new Date().toISOString().split('T')[0]}.png`
      link.click()
    } catch (err) {
      alert("No se pudo exportar la imagen.")
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f1f5f9] dark:bg-slate-900 font-bold text-xl text-slate-800 dark:text-white">Cargando Malla Académica...</div>

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors">
      <Navbar />

      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-3 flex items-center justify-between flex-wrap gap-4 sticky top-16 z-30 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setRamoEnFoco({ id: null, nuevo: true })} className="text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition hover:brightness-110" style={{ backgroundColor: 'var(--primary-color, #3b82f6)' }}>
            <Plus size={16}/> Añadir Ramo
          </button>

          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <button onClick={agregarSemestre} className="hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs px-3 py-2 flex items-center gap-1 transition"><Plus size={14}/> Sem</button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
            <button onClick={eliminarSemestre} className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 font-bold text-xs px-3 py-2 flex items-center gap-1 transition"><Minus size={14}/> Sem</button>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <button onClick={agregarFila} className="hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs px-3 py-2 flex items-center gap-1 transition"><Plus size={14}/> Fila</button>
            <div className="w-px h-4 bg-slate-300 dark:bg-slate-600"></div>
            <button onClick={eliminarFila} className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/50 font-bold text-xs px-3 py-2 flex items-center gap-1 transition"><Minus size={14}/> Fila</button>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setModalCategoriasAbierto(true)} className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 font-extrabold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5">
            <Layers size={14}/> Categorías
          </button>

          <input type="file" accept="application/pdf" ref={fileInputRef} onChange={handleImportarPDF} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} disabled={importando} className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-extrabold text-xs px-4 py-2 rounded-lg transition flex items-center gap-1.5 disabled:opacity-50">
            {importando ? <Upload size={14} className="animate-bounce"/> : <FileText size={14}/>} 
            {importando ? 'Leyendo...' : 'Importar PDF'}
          </button>

          <button onClick={handleExportarImagen} className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition">
            <Download size={14}/> Exportar
          </button>

          <button onClick={handleGuardarNube} disabled={guardando} className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 transition disabled:opacity-50">
            <CloudUpload size={14}/> {guardando ? 'Guardando...' : 'Guardar Nube'}
          </button>
        </div>
      </div>

      <main className="flex-1 p-8 overflow-auto custom-scrollbar relative">
        <div ref={mallaRef} className="bg-transparent rounded-2xl inline-block min-w-full">
          <TableroMalla />
        </div>
      </main>

      <ModalRamo />
      {modalCategoriasAbierto && <ModalGestorCategorias onClose={() => setModalCategoriasAbierto(false)} />}
    </div>
  )
}