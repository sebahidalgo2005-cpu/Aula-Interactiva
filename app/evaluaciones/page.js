'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { Calendar, Plus, Trash2, Check, CheckSquare } from 'lucide-react'
import { useMallaStore } from '@/store/useMallaStore'

const formatFechaLocal = (d) => {
  if (!d) return ''
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
    fecha_entrega: '', 
    tipo: 'prueba'
  })

  useEffect(() => {
    setForm(f => ({ ...f, fecha_entrega: formatFechaLocal(new Date()) }))

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
      alert("Error al guardar la evaluación.")
    } finally {
      setGuardando(false)
    }
  }

  const toggleCompletada = async (id, estadoActual) => {
    const nuevoEstado = !estadoActual
    const estadoPrevio = [...evaluaciones]
    
    try {
      setEvaluaciones(evaluaciones.map(ev => ev.id === id ? { ...ev, completada: nuevoEstado } : ev))
      const { error } = await supabase.from('evaluaciones').update({ completada: nuevoEstado }).eq('id', id)
      if (error) throw error
    } catch (error) {
      console.error(error)
      setEvaluaciones(estadoPrevio)
      alert("Error al actualizar la tarea.")
    }
  }

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta evaluación?")) return
    const estadoPrevio = [...evaluaciones]
    
    try {
      setEvaluaciones(evaluaciones.filter(ev => ev.id !== id))
      const { error } = await supabase.from('evaluaciones').delete().eq('id', id)
      if (error) throw error
    } catch (error) {
      console.error(error)
      setEvaluaciones(estadoPrevio)
      alert("Error al eliminar la evaluación.")
    }
  }

  const getDiasRestantes = (fechaStr) => {
    const hoy = new Date()
    hoy.setHours(0,0,0,0)
    const entrega = new Date(fechaStr + 'T12:00:00')
    entrega.setHours(0,0,0,0)
    return Math.ceil((entrega - hoy) / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1f5f9] dark:bg-slate-900 font-bold text-xl text-slate-800 dark:text-white">
        Cargando Evaluaciones...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-12 transition-colors">
      <Navbar />

      <main className="max-w-4xl mx-auto mt-8 px-6 space-y-8">
        
        {/* FORMULARIO DE NUEVA EVALUACIÓN */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
          <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <CheckSquare size={18} className="text-blue-500"/> Programar Prueba o Tarea
          </h2>

          <form onSubmit={handleCrearEvaluacion} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Ramo</label>
              <select 
                value={form.ramo_id} 
                onChange={(e) => setForm({...form, ramo_id: e.target.value})} 
                className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2.5 font-bold outline-none"
              >
                {ramosCursando.length === 0 && <option value="">No hay ramos en cursando</option>}
                {ramosCursando.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
              </select>
            </div>

            <div className="lg:col-span-2">
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Título / Concepto</label>
              <input 
                type="text" 
                required 
                placeholder="Ej: Prueba 1, Tarea 2" 
                value={form.titulo} 
                onChange={(e) => setForm({...form, titulo: e.target.value})} 
                className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2 font-bold outline-none" 
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Tipo</label>
              <select 
                value={form.tipo} 
                onChange={(e) => setForm({...form, tipo: e.target.value})} 
                className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2.5 font-bold outline-none"
              >
                <option value="prueba">Prueba</option>
                <option value="tarea">Tarea</option>
                <option value="proyecto">Proyecto</option>
                <option value="examen">Examen</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Fecha Entrega</label>
              <input 
                type="date" 
                required 
                value={form.fecha_entrega} 
                onChange={(e) => setForm({...form, fecha_entrega: e.target.value})} 
                className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2 font-bold outline-none" 
              />
            </div>

            <div className="lg:col-span-5 flex justify-end">
              <button 
                type="submit" 
                disabled={guardando} 
                className="text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 shadow-md disabled:opacity-50"
                style={{ backgroundColor: 'var(--primary-color, #3b82f6)' }}
              >
                <Plus size={18} /> {guardando ? 'Guardando...' : 'Agendar Evaluación'}
              </button>
            </div>
          </form>
        </div>

        {/* LISTA DE EVALUACIONES */}
        <div className="space-y-4">
          <h2 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white">
            Evaluaciones Programadas ({evaluaciones.length})
          </h2>

          {evaluaciones.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 font-bold">Sin evaluaciones agendadas.</p>
            </div>
          ) : (
            evaluaciones.map(evalItem => {
              const ramo = ramos.find(r => r.id === evalItem.ramo_id)
              const dias = getDiasRestantes(evalItem.fecha_entrega)

              let badgeClass = "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-sky-300"
              if (dias < 0) badgeClass = "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
              else if (dias === 0) badgeClass = "bg-red-500 text-white animate-pulse"
              else if (dias <= 3) badgeClass = "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"

              return (
                <div 
                  key={evalItem.id} 
                  className={`p-5 rounded-2xl bg-white dark:bg-slate-800 border-2 transition shadow-sm flex items-center justify-between gap-4 ${
                    evalItem.completada ? 'opacity-60 border-slate-200 dark:border-slate-700' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => toggleCompletada(evalItem.id, evalItem.completada)} 
                      className={`w-7 h-7 shrink-0 rounded-lg border-2 flex items-center justify-center transition ${
                        evalItem.completada 
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-sm' 
                          : 'border-slate-300 dark:border-slate-600 text-transparent'
                      }`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </button>
                    
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded" style={{ backgroundColor: (ramo?.color || '#3b82f6') + '20', color: ramo?.color || '#3b82f6' }}>
                          {ramo?.nombre || 'General'}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">({evalItem.tipo})</span>
                      </div>
                      <h3 className={`font-extrabold text-lg ${evalItem.completada ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                        {evalItem.titulo}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400">{evalItem.fecha_entrega.split('-').reverse().join('/')}</p>
                      <span className={`inline-block text-xs font-black px-2.5 py-1 rounded-full mt-1 ${evalItem.completada ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : badgeClass}`}>
                        {evalItem.completada ? 'Completada' : (dias < 0 ? 'Vencida' : dias === 0 ? '¡Es HOY!' : `Faltan ${dias} día(s)`)}
                      </span>
                    </div>

                    <button onClick={() => handleEliminar(evalItem.id)} className="text-red-400 hover:text-red-600 p-2">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

      </main>
    </div>
  )
}