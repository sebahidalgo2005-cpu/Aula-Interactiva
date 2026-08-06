'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { 
  Calendar as CalendarIcon, Clock, Plus, Trash2, 
  MapPin, ChevronLeft, ChevronRight, CheckCircle, XCircle, 
  Settings, AlertCircle, RefreshCw, AlertTriangle 
} from 'lucide-react'
import { useMallaStore } from '@/store/useMallaStore'

const DIAS_SEMANA = [
  { id: 'lunes', nombre: 'Lunes', index: 1 },
  { id: 'martes', nombre: 'Martes', index: 2 },
  { id: 'miercoles', nombre: 'Miércoles', index: 3 },
  { id: 'jueves', nombre: 'Jueves', index: 4 },
  { id: 'viernes', nombre: 'Viernes', index: 5 },
  { id: 'sabado', nombre: 'Sábado', index: 6 },
]

const HORAS_MOSTRADAS = Array.from({ length: 15 }, (_, i) => i + 8) 
const ALTO_HORA_PX = 60 

const calcularPosicionY = (horaStr) => {
  if (!horaStr) return 0
  const [horas, minutos] = horaStr.split(':').map(Number)
  return ((horas + minutos / 60) - 8) * ALTO_HORA_PX
}

const getLunesActual = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - (day - 1))
  return d
}

const formatFechaLocal = (d) => {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default function CalendarioIntegradoPage() {
  const supabase = createClient()
  const router = useRouter()
  const { ramos, setRamos, horarios, setHorarios, agregarHorario, eliminarHorario, actualizarRamo } = useMallaStore()
  
  const [loading, setLoading] = useState(true)
  const [pestañaActiva, setPestañaActiva] = useState('semana') 
  
  const [lunesSemana, setLunesSemana] = useState(null)
  const [horaActual, setHoraActual] = useState(null)
  const [evaluaciones, setEvaluaciones] = useState([])
  
  const [modalAsistencia, setModalAsistencia] = useState(null)
  const [usuarioId, setUsuarioId] = useState(null)
  const [guardando, setGuardando] = useState(false)
  
  const [formBase, setFormBase] = useState({ 
    ramo_id: '', dia: 'lunes', hora_inicio: '08:30', hora_fin: '10:00', sala: '' 
  })

  useEffect(() => {
    setLunesSemana(getLunesActual())
    setHoraActual(new Date())

    const cargarDatos = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return router.push('/')
      
      setUsuarioId(user.id)

      const [ramosRes, horariosRes, evalRes] = await Promise.all([
        supabase.from('ramos').select('*').eq('usuario_id', user.id),
        supabase.from('horarios').select('*').eq('usuario_id', user.id),
        supabase.from('evaluaciones').select('*').eq('usuario_id', user.id)
      ])

      if (ramosRes.data) setRamos(ramosRes.data)
      if (horariosRes.data) setHorarios(horariosRes.data)
      if (evalRes.data) setEvaluaciones(evalRes.data)

      const ramosCursandoInit = (ramosRes.data || []).filter(r => r.estado === 'cursando')
      if (ramosCursandoInit.length > 0) {
        setFormBase(f => ({ ...f, ramo_id: ramosCursandoInit[0].id }))
      }
      setLoading(false)
    }
    
    cargarDatos()
    const interval = setInterval(() => setHoraActual(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  const ramosCursando = ramos.filter(r => r.estado === 'cursando')
  const ramosCursandoIds = ramosCursando.map(r => r.id)
  const horariosActivos = horarios.filter(h => ramosCursandoIds.includes(h.ramo_id))

  const handleCrearBloqueBase = async (e) => {
    e.preventDefault()
    if (!formBase.ramo_id) return alert("Selecciona un ramo.")
    if (formBase.hora_fin <= formBase.hora_inicio) return alert("La hora de fin debe ser posterior a la hora de inicio.")
    
    try {
      setGuardando(true)
      const { data, error } = await supabase
        .from('horarios')
        .insert({ ...formBase, usuario_id: usuarioId })
        .select()
        .single()
        
      if (error) throw error
      if (data) { 
        agregarHorario(data)
        setFormBase(f => ({ ...f, sala: '' })) 
      }
    } catch (error) {
      console.error(error)
      alert("Error al guardar el bloque en la base de datos.")
    } finally {
      setGuardando(false)
    }
  }

  const handleBorrarBloqueBase = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este bloque horario?")) return
    try {
      eliminarHorario(id)
      await supabase.from('horarios').delete().eq('id', id)
    } catch (error) {
      alert("Error al eliminar el bloque.")
    }
  }

  const guardarAsistencia = async (estado) => {
    if (!modalAsistencia) return
    const { ramoId, fechaStr, horarioId } = modalAsistencia
    
    const ramoObjetivo = ramos.find(r => r.id === ramoId)
    if (!ramoObjetivo) {
      setModalAsistencia(null)
      return
    } 
    
    const asistenciaPrevia = [...(ramoObjetivo.asistencia || [])]
    
    try {
      let nuevaAsistencia = asistenciaPrevia.filter(a => !(a.fecha === fechaStr && a.horario_id === horarioId))
      
      if (estado !== 'borrar') {
        nuevaAsistencia.push({ 
          id: Date.now(), 
          fecha: fechaStr, 
          horario_id: horarioId, 
          estado 
        })
      }
      
      actualizarRamo(ramoId, { asistencia: nuevaAsistencia })
      setModalAsistencia(null)
      
      const { error } = await supabase
        .from('ramos')
        .update({ asistencia: nuevaAsistencia })
        .eq('id', ramoId)
        
      if (error) throw error
    } catch (error) {
      console.error(error)
      actualizarRamo(ramoId, { asistencia: asistenciaPrevia })
      alert("No se pudo guardar la asistencia. Intenta nuevamente.")
    }
  }

  const vincularGoogleCalendar = () => {
    if (!usuarioId) return
    const host = window.location.origin
    const urlApi = `${host}/api/calendario/${usuarioId}`
    
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      alert("⚠️ MODO LOCALHOST DETECTADO:\n\nGoogle Calendar requiere una URL pública de internet.\nAl desplegar en Vercel/Netlify se sincronizará automáticamente.\n\nTu URL Webcal copiada: " + urlApi)
      navigator.clipboard.writeText(urlApi)
      return
    }
    
    window.open(`https://calendar.google.com/calendar/render?cid=${encodeURIComponent(urlApi)}`, '_blank')
  }

  if (loading || !lunesSemana || !horaActual) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1f5f9] dark:bg-slate-900 font-bold text-xl text-slate-800 dark:text-white">
        Cargando Agenda...
      </div>
    )
  }

  const diasDeLaSemanaActual = DIAS_SEMANA.map((dia, index) => {
    const fObj = new Date(lunesSemana)
    fObj.setDate(lunesSemana.getDate() + index)
    return { ...dia, fechaObj: fObj, fechaStr: formatFechaLocal(fObj) }
  })

  const esSemanaActual = lunesSemana <= horaActual && (new Date(lunesSemana.getTime() + 7*24*60*60*1000)) > horaActual
  const diaActualIndex = horaActual.getDay() === 0 ? 6 : horaActual.getDay() - 1 
  const lineaRojaY = calcularPosicionY(`${horaActual.getHours()}:${horaActual.getMinutes()}`)

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-12 transition-colors">
      <Navbar />

      <main className="mx-auto mt-6 px-6" style={{ maxWidth: '1400px' }}>
        
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button 
              onClick={() => setPestañaActiva('semana')} 
              className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${pestañaActiva === 'semana' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
            >
              <CalendarIcon size={16}/> Horario y Asistencia
            </button>
            <button 
              onClick={() => setPestañaActiva('base')} 
              className={`px-5 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition ${pestañaActiva === 'base' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'}`}
            >
              <Settings size={16}/> Plantilla Base
            </button>
          </div>

          {pestañaActiva === 'semana' && (
            <button 
              onClick={vincularGoogleCalendar} 
              className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-sm flex items-center gap-2 transition"
            >
              <RefreshCw size={16} /> Sincronizar Google Calendar
            </button>
          )}
        </div>

        {ramosCursando.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-center shadow-sm">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">No tienes ramos en estado "Cursando".</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Cambia el estado de tus asignaturas desde la malla para ver la agenda.</p>
          </div>
        ) : (
          <>
            {pestañaActiva === 'semana' && (
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                
                <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
                  <h2 className="font-extrabold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-1">
                    Control de Asistencia
                  </h2>
                  
                  {ramosCursando.map(ramo => {
                    const historial = ramo.asistencia || []
                    const clasesPresente = historial.filter(h => h.estado === 'presente').length
                    const clasesJustificadas = historial.filter(h => h.estado === 'justificado').length
                    
                    const clasesValidas = historial.length - clasesJustificadas
                    const pct = clasesValidas === 0 ? 100 : Math.round((clasesPresente / clasesValidas) * 100)
                    const min = ramo.porcentaje_asistencia_minima || 70
                    const enPeligro = ramo.exige_asistencia && clasesValidas > 0 && pct < min

                    return (
                      <div key={ramo.id} className={`p-4 rounded-2xl shadow-sm border-2 ${enPeligro ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ramo.color || '#3b82f6' }}></div>
                          <span className="font-extrabold text-slate-900 dark:text-white text-sm truncate">{ramo.nombre}</span>
                        </div>
                        
                        {ramo.exige_asistencia ? (
                          <>
                            <div className="flex justify-between items-end mb-1">
                              <span className={`text-2xl font-black ${enPeligro ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                {pct}%
                              </span>
                              <span className="text-xs font-bold text-slate-400 mb-1">Min: {min}%</span>
                            </div>
                            
                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-2 overflow-hidden">
                              <div className={`h-2 rounded-full transition-all ${enPeligro ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }}></div>
                            </div>
                            
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                              {clasesPresente} presentes de {clasesValidas} clases válidas.
                            </p>

                            {enPeligro && (
                              <p className="text-[10px] font-extrabold text-red-600 dark:text-red-400 mt-2 flex items-center gap-1 uppercase">
                                <AlertCircle size={12}/> Peligro Reprobación
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-xs text-slate-400 font-bold mt-2">Sin asistencia obligatoria.</p>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="flex-1 w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                  
                  <div className="p-4 flex justify-between items-center bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="text-xl font-extrabold text-slate-800 dark:text-white">
                      {lunesSemana.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()}
                    </h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setLunesSemana(new Date(lunesSemana.getTime() - 7*24*60*60*1000))} 
                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                      >
                        <ChevronLeft size={20}/>
                      </button>
                      <button 
                        onClick={() => setLunesSemana(getLunesActual())} 
                        className="px-4 font-bold text-sm border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                      >
                        Hoy
                      </button>
                      <button 
                        onClick={() => setLunesSemana(new Date(lunesSemana.getTime() + 7*24*60*60*1000))} 
                        className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition"
                      >
                        <ChevronRight size={20}/>
                      </button>
                    </div>
                  </div>

                  <div className="flex ml-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                    {diasDeLaSemanaActual.map(dia => {
                      const esHoy = dia.fechaStr === formatFechaLocal(horaActual)
                      const evalHoy = evaluaciones.filter(ev => ev.fecha_entrega === dia.fechaStr)

                      return (
                        <div key={dia.id} className="flex-1 text-center py-2 px-1 flex flex-col items-center border-r border-slate-100 dark:border-slate-700/50">
                          <span className={`text-[11px] font-extrabold uppercase ${esHoy ? 'text-blue-600 dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`}>
                            {dia.nombre.slice(0,3)}
                          </span>
                          <span className={`text-xl font-black w-9 h-9 flex items-center justify-center rounded-full mt-1 transition-all ${esHoy ? 'bg-blue-600 text-white shadow-md' : 'text-slate-700 dark:text-slate-200'}`}>
                            {dia.fechaObj.getDate()}
                          </span>

                          {evalHoy.length > 0 && (
                            <div className="w-full mt-2 space-y-1">
                              {evalHoy.map(ev => {
                                const ramoObj = ramos.find(r => r.id === ev.ramo_id)
                                return (
                                  <div 
                                    key={ev.id} 
                                    title={`${ev.titulo} (${ramoObj?.nombre || 'General'})`}
                                    className={`text-[9px] font-black p-1 rounded text-left truncate flex items-center gap-1 shadow-xs ${
                                      ev.completada 
                                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 line-through' 
                                        : 'bg-amber-500 text-white animate-pulse'
                                    }`}
                                  >
                                    <AlertTriangle size={10} className="shrink-0" />
                                    <span className="truncate">{ev.titulo}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  <div className="flex relative overflow-y-auto custom-scrollbar" style={{ maxHeight: '650px' }}>
                    <div className="w-16 shrink-0 bg-white dark:bg-slate-800 relative border-r border-slate-100 dark:border-slate-700">
                      {HORAS_MOSTRADAS.map(hora => (
                        <div key={hora} className="relative" style={{ height: `${ALTO_HORA_PX}px` }}>
                          <span className="absolute -top-2.5 right-2 text-xs font-medium text-slate-400">
                            {hora}:00
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex-1 flex relative">
                      <div className="absolute inset-0 pointer-events-none">
                        {HORAS_MOSTRADAS.map(hora => (
                          <div key={hora} className="border-t border-slate-100 dark:border-slate-700/50 w-full" style={{ height: `${ALTO_HORA_PX}px` }}></div>
                        ))}
                      </div>

                      {diasDeLaSemanaActual.map((dia, index) => {
                        const clasesHoy = horariosActivos.filter(h => h.dia === dia.id)
                        
                        return (
                          <div key={dia.id} className="flex-1 border-l border-slate-100 dark:border-slate-700/50 relative">
                            {esSemanaActual && diaActualIndex === index && (
                              <div className="absolute left-0 right-0 h-0.5 bg-red-500 z-30 pointer-events-none" style={{ top: `${lineaRojaY}px` }}>
                                <div className="absolute -left-1.5 -top-1.5 w-3.5 h-3.5 bg-red-500 rounded-full"></div>
                              </div>
                            )}

                            {clasesHoy.map(clase => {
                              const ramoObj = ramos.find(r => r.id === clase.ramo_id)
                              const regAsistencia = (ramoObj?.asistencia || []).find(a => a.fecha === dia.fechaStr && a.horario_id === clase.id)
                              
                              const topPx = calcularPosicionY(clase.hora_inicio)
                              const altoPx = calcularPosicionY(clase.hora_fin) - topPx
                              const colorRamo = ramoObj?.color || '#3b82f6'

                              let bgClass = "bg-white dark:bg-slate-700 border-l-4 border border-slate-200 dark:border-slate-600"
                              if (regAsistencia?.estado === 'presente') bgClass = "bg-emerald-100 dark:bg-emerald-900/40 border-emerald-300 border-l-4"
                              else if (regAsistencia?.estado === 'ausente') bgClass = "bg-red-100 dark:bg-red-900/40 border-red-300 border-l-4"

                              return (
                                <div 
                                  key={clase.id} 
                                  onClick={() => setModalAsistencia({ 
                                    ramoId: clase.ramo_id, 
                                    horarioId: clase.id, 
                                    fechaStr: dia.fechaStr, 
                                    nombre: ramoObj?.nombre, 
                                    horario: `${clase.hora_inicio} - ${clase.hora_fin}`, 
                                    estadoActual: regAsistencia?.estado 
                                  })}
                                  className={`absolute left-0.5 right-0.5 rounded-md p-1.5 overflow-hidden shadow-sm transition-all cursor-pointer z-10 hover:z-50 hover:scale-[1.02] ${bgClass}`}
                                  style={{ top: `${topPx}px`, height: `${altoPx}px`, borderLeftColor: colorRamo }}
                                >
                                  <div className="text-[11px] font-extrabold leading-tight text-slate-800 dark:text-slate-100 line-clamp-2">
                                    {ramoObj?.nombre}
                                  </div>
                                  <div className="text-[10px] font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                                    {clase.hora_inicio} - {clase.hora_fin} {clase.sala && `| ${clase.sala}`}
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {pestañaActiva === 'base' && (
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
                <h2 className="text-base font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">Añadir bloque semanal a la plantilla</h2>
                
                <form onSubmit={handleCrearBloqueBase} className="grid grid-cols-1 md:grid-cols-7 gap-4 items-end">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Ramo</label>
                    <select 
                      value={formBase.ramo_id} 
                      onChange={(e) => setFormBase({...formBase, ramo_id: e.target.value})} 
                      className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2.5 font-bold outline-none"
                    >
                      <option value="">Selecciona un ramo</option>
                      {ramosCursando.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Día</label>
                    <select 
                      value={formBase.dia} 
                      onChange={(e) => setFormBase({...formBase, dia: e.target.value})} 
                      className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2.5 font-bold outline-none"
                    >
                      {DIAS_SEMANA.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Inicio</label>
                    <input 
                      type="time" 
                      required 
                      value={formBase.hora_inicio} 
                      onChange={(e) => setFormBase({...formBase, hora_inicio: e.target.value})} 
                      className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2 font-bold outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Fin</label>
                    <input 
                      type="time" 
                      required 
                      value={formBase.hora_fin} 
                      onChange={(e) => setFormBase({...formBase, hora_fin: e.target.value})} 
                      className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2 font-bold outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Sala</label>
                    <input 
                      type="text" 
                      placeholder="Ej: B-12" 
                      value={formBase.sala} 
                      onChange={(e) => setFormBase({...formBase, sala: e.target.value})} 
                      className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2 font-bold outline-none" 
                    />
                  </div>

                  <div>
                    <button 
                      type="submit" 
                      disabled={guardando}
                      className="w-full text-white p-2.5 rounded-lg font-bold flex justify-center items-center gap-2 transition disabled:opacity-50"
                      style={{ backgroundColor: 'var(--primary-color, #3b82f6)' }}
                    >
                      <Plus size={18} /> {guardando ? 'Guardando' : 'Agregar'}
                    </button>
                  </div>
                </form>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 pt-4">
                  {DIAS_SEMANA.map(dia => {
                    const bloquesDelDia = horariosActivos.filter(h => h.dia === dia.id).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))
                    return (
                      <div key={dia.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                        <div className="bg-slate-900 text-white text-center py-2.5 font-extrabold text-xs uppercase">
                          {dia.nombre}
                        </div>
                        <div className="p-3 flex-1 space-y-3 bg-slate-50/50 dark:bg-slate-900/40" style={{ minHeight: '250px' }}>
                          {bloquesDelDia.map(bloque => {
                            const ramoObj = ramos.find(r => r.id === bloque.ramo_id)
                            return (
                              <div key={bloque.id} className="p-3 rounded-xl shadow-sm bg-white dark:bg-slate-700 border-y border-r border-l-8 relative" style={{ borderLeftColor: ramoObj?.color || '#3b82f6' }}>
                                <div className="flex justify-between items-start">
                                  <span className="font-extrabold text-xs pr-2">{ramoObj?.nombre}</span>
                                  <button onClick={() => handleBorrarBloqueBase(bloque.id)} className="text-red-400 hover:text-red-600 p-1">
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                                <div className="text-[11px] font-bold text-slate-500 dark:text-slate-300 mt-2 flex items-center gap-1">
                                  <Clock size={12} /> {bloque.hora_inicio} - {bloque.hora_fin}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {modalAsistencia && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
             <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 dark:border-slate-700 p-6 space-y-4">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white leading-tight">{modalAsistencia.nombre}</h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-2"><CalendarIcon size={14}/> {modalAsistencia.fechaStr.split('-').reverse().join('/')} | {modalAsistencia.horario}</p>
              
              <div className="space-y-3">
                <button onClick={() => guardarAsistencia('presente')} className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-extrabold text-sm"><span className="flex items-center gap-2"><CheckCircle size={18}/> Fui a clases (Presente)</span></button>
                <button onClick={() => guardarAsistencia('ausente')} className="w-full flex items-center justify-between p-3.5 rounded-xl border-2 border-red-200 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 font-extrabold text-sm"><span className="flex items-center gap-2"><XCircle size={18}/> Falté a clases (Ausente)</span></button>
              </div>

              <div className="pt-2 flex justify-between items-center">
                {modalAsistencia.estadoActual ? <button onClick={() => guardarAsistencia('borrar')} className="text-xs font-bold text-slate-400 hover:text-red-500">Borrar registro</button> : <div></div>}
                <button onClick={() => setModalAsistencia(null)} className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-lg">Cerrar</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}