'use client'
import { useState } from 'react'
import { Calendar, dateFnsLocalizer } from 'react-big-calendar'
import { format, parse, startOfWeek, getDay } from 'date-fns'
import { es } from 'date-fns/locale'
import { useMallaStore } from '@/store/useMallaStore'
import { createClient } from '@/utils/supabase/client'
import { CheckCircle, XCircle, Clock, Trash2, X } from 'lucide-react'

// Configurar el calendario en Español
const locales = { 'es': es }
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales })

export default function CalendarioAcademico() {
  const { ramos, clases, agregarClase, actualizarAsistencia, eliminarClase } = useMallaStore()
  const supabase = createClient()
  
  const [modalAbierto, setModalAbierto] = useState(false)
  const [claseSeleccionada, setClaseSeleccionada] = useState(null)
  
  // Formulario para nueva clase
  const ramosCursando = ramos.filter(r => r.estado === 'cursando')
  const [nuevoEvento, setNuevoEvento] = useState({
    ramo_id: '',
    titulo: 'Clase Regular',
    fecha_inicio: new Date(),
    fecha_fin: new Date(new Date().setHours(new Date().getHours() + 1))
  })

  // Transformar nuestras clases al formato que lee el calendario
  const eventosCalendario = clases.map(c => ({
    ...c,
    start: new Date(c.fecha_inicio),
    end: new Date(c.fecha_fin),
    title: c.titulo
  }))

  const handleSeleccionarRango = ({ start, end }) => {
    if (ramosCursando.length === 0) return alert('Debes marcar al menos un ramo como "Cursando" para agregar clases.')
    setNuevoEvento({ ...nuevoEvento, fecha_inicio: start, fecha_fin: end, ramo_id: ramosCursando[0].id })
    setModalAbierto('crear')
  }

  const handleSeleccionarEvento = (evento) => {
    setClaseSeleccionada(evento)
    setModalAbierto('editar')
  }

  const handleGuardarNuevaClase = async () => {
    const claseData = {
      ramo_id: nuevoEvento.ramo_id,
      titulo: nuevoEvento.titulo,
      fecha_inicio: nuevoEvento.fecha_inicio.toISOString(),
      fecha_fin: nuevoEvento.fecha_fin.toISOString(),
      estado_asistencia: 'pendiente'
    }
    
    // Guardar en DB temporal o real (aquí asumiendo conexión a Supabase configurada)
    const { data, error } = await supabase.from('clases_calendario').insert(claseData).select().single()
    if (!error && data) {
      agregarClase(data)
    } else {
      // Fallback local si falla la red
      agregarClase({ ...claseData, id: Date.now() }) 
    }
    setModalAbierto(false)
  }

  const handleCambiarAsistencia = async (estado) => {
    actualizarAsistencia(claseSeleccionada.id, estado)
    await supabase.from('clases_calendario').update({ estado_asistencia: estado }).eq('id', claseSeleccionada.id)
    setModalAbierto(false)
  }

  // Estilos dinámicos para los bloques del calendario
  const eventStyleGetter = (evento) => {
    const ramo = ramos.find(r => r.id === evento.ramo_id)
    let backgroundColor = ramo ? ramo.color : '#3174ad'
    
    // Si faltó a clases, se opaca y se vuelve rojizo
    if (evento.estado_asistencia === 'ausente') backgroundColor = '#ef4444'
    if (evento.estado_asistencia === 'asistió') backgroundColor = '#10b981'

    return { style: { backgroundColor, borderRadius: '6px', opacity: 0.9, border: 'none', color: 'white' } }
  }

  return (
    <div className="h-full w-full bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Registro de Asistencia</h2>
      
      <div className="h-[700px]">
        <Calendar
          localizer={localizer}
          events={eventosCalendario}
          startAccessor="start"
          endAccessor="end"
          culture="es"
          selectable
          onSelectSlot={handleSeleccionarRango}
          onSelectEvent={handleSeleccionarEvento}
          eventPropGetter={eventStyleGetter}
          messages={{
            next: "Sig", previous: "Ant", today: "Hoy", month: "Mes", week: "Semana", day: "Día"
          }}
          className="font-sans"
        />
      </div>

      {/* Modal de Creación / Edición */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800">
                {modalAbierto === 'crear' ? 'Programar Clase' : 'Asistencia'}
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-slate-400 hover:text-slate-700"><X size={20}/></button>
            </div>

            {modalAbierto === 'crear' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Ramo en curso</label>
                  <select value={nuevoEvento.ramo_id} onChange={(e) => setNuevoEvento({...nuevoEvento, ramo_id: e.target.value})} className="w-full border rounded-lg p-2 outline-none">
                    {ramosCursando.map(r => <option key={r.id} value={r.id}>{r.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-600 mb-1">Tipo de Clase</label>
                  <input type="text" value={nuevoEvento.titulo} onChange={(e) => setNuevoEvento({...nuevoEvento, titulo: e.target.value})} className="w-full border rounded-lg p-2 outline-none"/>
                </div>
                <button onClick={handleGuardarNuevaClase} className="w-full bg-blue-600 text-white font-semibold py-2 rounded-lg hover:bg-blue-700 transition">
                  Agendar
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-center font-medium text-slate-700 mb-4">{claseSeleccionada.title}</p>
                <button onClick={() => handleCambiarAsistencia('asistió')} className="w-full flex items-center justify-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 font-semibold py-3 rounded-lg transition">
                  <CheckCircle size={20} /> Marcar como Asistida
                </button>
                <button onClick={() => handleCambiarAsistencia('ausente')} className="w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-3 rounded-lg transition">
                  <XCircle size={20} /> Marcar Inasistencia
                </button>
                <button onClick={() => handleCambiarAsistencia('pendiente')} className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold py-3 rounded-lg transition mt-4">
                  <Clock size={20} /> Dejar Pendiente
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}