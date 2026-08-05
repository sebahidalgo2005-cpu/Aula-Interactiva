'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, Plus, Trash2, Clock, AlertCircle, Check } from 'lucide-react'
import { useMallaStore } from '@/store/useMallaStore'

// Forzar la fecha local del usuario para evitar desfaces UTC al inicializar el input
const formatFechaLocal = (d) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function EvaluacionesPage() {
  const supabase = createClient()
  const router = useRouter()
  const { ramos, setRamos } = useMallaStore()
  const [loading, setLoading] = useState(true)
  const [evaluaciones, setEvaluaciones] = useState([])
  const [guardando, setGuardando] = useState(false)
  
  const [form, setForm] = useState({
    ramo_id: '', 
    titulo: '', 
    fecha_entrega: formatFechaLocal(new Date()), 
    tipo: 'prueba'
  })

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return router.push('/')

      const [ramosRes, evalRes] = await Promise.all([
        supabase.from('ramos').select('*').eq('usuario_id', user.id),
        supabase.from('evaluaciones').select('*').eq('usuario_id', user.id).order('fecha_entrega', { ascending: true })
      ])

      if (ramosRes.data) {
        setRamos(ramosRes.data)
        const cursando = ramosRes.data.filter(r => r.estado === 'cursando')
        if (cursando.length > 0) setForm(f => ({ ...f, ramo_id: cursando[0].id }))
      }
      
      if (evalRes.data) setEvaluaciones(evalRes.data)
      
      setLoading(false)
    }
    cargarDatos()
  }, [])

  const ramosCursando = ramos.filter(r => r.estado === 'cursando')

  const handleCrearEvaluacion = async (e) => {
    e.preventDefault()
    if (!form.ramo_id || !form.titulo) return alert("Completa todos los campos.")
    
    try {
      setGuardando(true)
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('evaluaciones')
        .insert({ ...form, usuario_id: user.id })
        .select()
        .single()
      
      if (error) throw error
      if (data) {
        setEvaluaciones([...evaluaciones, data].sort((a, b) => new Date(a.fecha_entrega) - new Date(b.fecha_entrega)))
        setForm(f => ({ ...f, titulo: '' }))
      }
    } catch (error) {
      console.error(error)
      alert("Hubo un error al guardar la evaluación.")
    } finally {
      setGuardando(false)
    }
  }

  const toggleCompletada = async (id, estadoActual) => {
    try {
      const nuevoEstado = !estadoActual
      setEvaluaciones(evaluaciones.map(ev => ev.id === id ? { ...ev, completada: nuevoEstado } : ev))
      
      const { error } = await supabase
        .from('evaluaciones')
        .update({ completada: nuevoEstado })
        .eq('id', id)
        
      if (error) throw error
    } catch (error) {
      console.error(error)
      alert("No se pudo actualizar el estado de la tarea.")
    }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta evaluación?")) return
    try {
      setEvaluaciones(evaluaciones.filter(ev => ev.id !== id))
      const { error } = await supabase.from('evaluaciones').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      console.error(error)
      alert("Error al eliminar el registro.")
    }
  }

  // Calculador de días restantes usando fechas locales para evitar brincos temporales
  const getDiasRestantes = (fechaStr) => {
    const hoy = new Date()
    hoy.setHours(0,0,0,0)
    // El string de base de datos asume mediodía para evitar problemas de UTC
    const entrega = new Date(fechaStr + 'T12:00:00')
    entrega.setHours(0,0,0,0)
    
    return Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24))
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f1f5f9] font-bold text-xl">Cargando evaluaciones...</div>

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        <header className="mb-8 flex justify-between items-center">
          <Link href="/malla" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <ArrowLeft size={18} /> Volver a la Malla
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Calendar className="text-blue-600" /> Pruebas y Tareas (Deadlines)
          </h1>
        </header>

        {/* FORMULARIO */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider mb-4">
            Añadir Evaluación o Tarea
          </h2>
          <form onSubmit={handleCrearEvaluacion} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Ramo</label>
              <select 
                value={form.ramo_id} 
                onChange={(e) => setForm({...form, ramo_id: e.target.value})} 
                className="w-full border-2 border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                {ramosCursando.length === 0 && <option value="">No hay ramos cursando</option>}
                {ramosCursando.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Título</label>
              <input 
                type="text" 
                required 
                placeholder="Solemne, Control..." 
                value={form.titulo} 
                onChange={(e) => setForm({...form, titulo: e.target.value})} 
                className="w-full border-2 border-slate-300 rounded-lg p-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tipo</label>
              <select 
                value={form.tipo} 
                onChange={(e) => setForm({...form, tipo: e.target.value})} 
                className="w-full border-2 border-slate-300 rounded-lg p-2.5 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="prueba">Prueba</option>
                <option value="tarea">Tarea</option>
                <option value="proyecto">Proyecto</option>
                <option value="examen">Examen</option>
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Fecha</label>
              <input 
                type="date" 
                required 
                value={form.fecha_entrega} 
                onChange={(e) => setForm({...form, fecha_entrega: e.target.value})} 
                className="w-full border-2 border-slate-300 rounded-lg p-2 font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
              />
            </div>
            
            <div className="md:col-span-5 flex justify-end">
              <button 
                type="submit" 
                disabled={guardando} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition shadow-md disabled:opacity-50"
              >
                <Plus size={18} /> {guardando ? 'Guardando...' : 'Programar Evaluación'}
              </button>
            </div>

          </form>
        </div>

        {/* LISTA DE EVALUACIONES */}
        <div className="space-y-4">
          <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">
            Próximos Vencimientos ({evaluaciones.length})
          </h2>
          
          {evaluaciones.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-sm">
              <p className="text-slate-500 font-bold">No tienes evaluaciones pendientes programadas.</p>
            </div>
          ) : (
            evaluaciones.map(evalItem => {
              const ramo = ramos.find(r => r.id === evalItem.ramo_id)
              const dias = getDiasRestantes(evalItem.fecha_entrega)
              
              let badgeColor = "bg-blue-100 text-blue-700"
              if (dias < 0) badgeColor = "bg-slate-100 text-slate-500"
              else if (dias === 0) badgeColor = "bg-red-500 text-white animate-pulse"
              else if (dias <= 3) badgeColor = "bg-red-100 text-red-700"

              return (
                <div 
                  key={evalItem.id} 
                  className={`p-5 rounded-2xl bg-white border-2 transition shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    evalItem.completada ? 'opacity-60 bg-slate-50 border-slate-200' : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleCompletada(evalItem.id, evalItem.completada)} 
                      className={`w-7 h-7 shrink-0 rounded-lg border-2 flex items-center justify-center transition ${
                        evalItem.completada 
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' 
                          : 'border-slate-300 hover:border-blue-500 text-transparent'
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="text-xs font-extrabold px-2 py-0.5 rounded uppercase tracking-wider" 
                          style={{ backgroundColor: (ramo?.color || '#3b82f6') + '20', color: ramo?.color || '#3b82f6' }}
                        >
                          {ramo?.nombre || 'Ramo Eliminado'}
                        </span>
                        <span className="text-xs font-bold text-slate-400 uppercase">
                          ({evalItem.tipo})
                        </span>
                      </div>
                      <h3 className={`font-extrabold text-lg text-slate-900 ${evalItem.completada ? 'line-through text-slate-400' : ''}`}>
                        {evalItem.titulo}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400">
                        {evalItem.fecha_entrega.split('-').reverse().join('/')}
                      </p>
                      <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-full mt-1 shadow-sm ${evalItem.completada ? 'bg-emerald-100 text-emerald-700' : badgeColor}`}>
                        {evalItem.completada ? 'Completada' : (dias < 0 ? 'Vencida' : dias === 0 ? '¡Es HOY!' : `Faltan ${dias} día(s)`)}
                      </span>
                    </div>
                    
                    <button 
                      onClick={() => handleEliminar(evalItem.id)} 
                      className="text-red-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}