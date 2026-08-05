'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BookOpen, GraduationCap, MapPin, ArrowRight, CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { useMallaStore } from '@/store/useMallaStore'

const DIAS_SEMANA = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado']

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()
  const { ramos, setRamos, horarios, setHorarios } = useMallaStore()
  
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState(null)
  const [diaActualStr, setDiaActualStr] = useState('')

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return router.push('/')
      
      setUsuario(user)

      const [ramosRes, horariosRes] = await Promise.all([
        supabase.from('ramos').select('*').eq('usuario_id', user.id),
        supabase.from('horarios').select('*').eq('usuario_id', user.id)
      ])

      if (ramosRes.data) setRamos(ramosRes.data)
      if (horariosRes.data) setHorarios(horariosRes.data)

      const hoyIndex = new Date().getDay()
      setDiaActualStr(DIAS_SEMANA[hoyIndex])
      setLoading(false)
    }
    cargarDatos()
  }, [])

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f1f5f9] font-bold text-xl">Cargando tu panel de control...</div>

  // Matemáticas de Progreso
  const totalRamos = ramos.length
  const aprobados = ramos.filter(r => r.estado === 'aprobado').length
  const cursando = ramos.filter(r => r.estado === 'cursando')
  const avance = totalRamos === 0 ? 0 : Math.round((aprobados / totalRamos) * 100)

  // Clases filtradas para "Hoy" y que sean de ramos en estado "cursando"
  const clasesHoy = horarios
    .filter(h => h.dia === diaActualStr && cursando.some(r => r.id === h.ramo_id))
    .sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio))

  // Filtro inteligente de ramos en peligro de reprobación por inasistencias
  const ramosEnPeligro = cursando.filter(ramo => {
    if (!ramo.exige_asistencia) return false
    const historial = ramo.asistencia || []
    const clasesJustificadas = historial.filter(h => h.estado === 'justificado').length
    const clasesValidas = historial.length - clasesJustificadas
    
    // Si no hay clases registradas aún, no puede estar en peligro
    if (clasesValidas === 0) return false
    
    const presentes = historial.filter(h => h.estado === 'presente').length
    const pct = Math.round((presentes / clasesValidas) * 100)
    
    return pct < (ramo.porcentaje_asistencia_minima || 70)
  })

  // Saludo personalizado extrayendo el primer nombre del usuario
  const primerNombre = usuario?.user_metadata?.full_name?.split(' ')[0] || 'Estudiante'

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-8 font-sans">
      <div className="max-w-[1200px] mx-auto">
        
        {/* ENCABEZADO */}
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">¡Hola, {primerNombre}! 👋</h1>
            <p className="text-slate-500 font-medium mt-1">Aquí tienes tu resumen académico del día.</p>
          </div>
          <Link href="/malla" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition shadow-md shadow-blue-500/20">
            Ir a mi Malla <ArrowRight size={18} />
          </Link>
        </header>

        {/* TARJETAS SUPERIORES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <GraduationCap size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Avance de Carrera</p>
              <p className="text-3xl font-black text-slate-900">{avance}%</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <CheckCircle size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Ramos Aprobados</p>
              <p className="text-3xl font-black text-slate-900">
                {aprobados} <span className="text-sm font-medium text-slate-400">de {totalRamos}</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Semestre Actual</p>
              <p className="text-3xl font-black text-slate-900">
                {cursando.length} <span className="text-sm font-medium text-slate-400">ramos</span>
              </p>
            </div>
          </div>

        </div>

        {/* CONTENIDO PRINCIPAL: CLASES Y ALERTAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Tus clases de hoy */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mb-6">
                <Clock className="text-blue-600" /> Tus Clases de Hoy
              </h2>
              
              {clasesHoy.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <p className="text-slate-500 font-bold">No tienes clases registradas para hoy.</p>
                  <p className="text-sm text-slate-400 mt-1">¡Disfruta tu tiempo libre!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {clasesHoy.map(clase => {
                    const ramo = ramos.find(r => r.id === clase.ramo_id)
                    return (
                      <div key={clase.id} className="flex gap-4 p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group bg-slate-50/50">
                        <div className="w-24 shrink-0 text-center border-r border-slate-200 pr-4 flex flex-col justify-center">
                          <p className="text-lg font-black text-slate-800">{clase.hora_inicio}</p>
                          <p className="text-xs font-bold text-slate-400">{clase.hora_fin}</p>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-extrabold text-slate-900">{ramo?.nombre}</h3>
                          {clase.sala && (
                            <p className="text-sm font-bold text-blue-600 flex items-center gap-1 mt-1">
                              <MapPin size={14} /> {clase.sala}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Columna Derecha: Alertas de Asistencia */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2 mb-4">
                <AlertCircle className="text-red-500" /> Alertas Académicas
              </h2>
              
              {ramosEnPeligro.length === 0 ? (
                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 text-sm font-bold">
                  ¡Todo en orden! No tienes ramos en peligro por inasistencias.
                </div>
              ) : (
                <div className="space-y-3">
                  {ramosEnPeligro.map(ramo => (
                    <div key={ramo.id} className="bg-red-50 border border-red-200 p-4 rounded-xl shadow-sm">
                      <p className="font-extrabold text-red-800 text-sm leading-tight mb-1">{ramo.nombre}</p>
                      <p className="text-xs text-red-600 font-medium">
                        Estás por debajo del {ramo.porcentaje_asistencia_minima}% de asistencia mínima exigida.
                      </p>
                      <Link href="/calendario" className="text-xs font-bold text-red-700 hover:text-red-900 mt-2 inline-block underline transition-colors">
                        Revisar registro en calendario
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  )
}