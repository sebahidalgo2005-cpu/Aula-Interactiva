'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { 
  Layers, Calendar, CheckSquare, BarChart2, 
  AlertCircle, ArrowRight, BookOpen, Clock, CheckCircle2 
} from 'lucide-react'

export default function DashboardPage() {
  const supabase = createClient()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [ramos, setRamos] = useState([])
  const [evaluaciones, setEvaluaciones] = useState([])

  useEffect(() => {
    const cargarDashboard = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return router.push('/')
      
      setUser(user)

      const [ramosRes, evalRes] = await Promise.all([
        supabase.from('ramos').select('*').eq('usuario_id', user.id),
        supabase.from('evaluaciones').select('*').eq('usuario_id', user.id).order('fecha_entrega', { ascending: true })
      ])

      if (ramosRes.data) setRamos(ramosRes.data)
      if (evalRes.data) setEvaluaciones(evalRes.data)

      setLoading(false)
    }

    cargarDashboard()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1f5f9] dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-xl">
        Cargando Dashboard...
      </div>
    )
  }

  // Cálculos estadísticos en tiempo real
  const ramosAprobados = ramos.filter(r => r.estado === 'aprobado').length
  const ramosCursando = ramos.filter(r => r.estado === 'cursando')
  const evalPendientes = evaluaciones.filter(e => !e.completada)

  // Promedio notas general
  const ramosConNota = ramos.filter(r => r.nota_final && Number(r.nota_final) > 0)
  const promedioGeneral = ramosConNota.length > 0 
    ? (ramosConNota.reduce((acc, r) => acc + Number(r.nota_final), 0) / ramosConNota.length).toFixed(1)
    : 'N/A'

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-12 transition-colors">
      <Navbar />

      <main className="max-w-7xl mx-auto mt-8 px-6 space-y-8">
        
        {/* BIENVENIDA */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex justify-between items-center flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
              ¡Hola, {user?.user_metadata?.full_name?.split(' ')[0] || 'Estudiante'}! 👋
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-sm mt-1">
              Bienvenido a tu panel general académico.
            </p>
          </div>

          <Link 
            href="/malla" 
            className="text-white font-extrabold px-6 py-3 rounded-xl shadow-md transition flex items-center gap-2 text-sm"
            style={{ backgroundColor: 'var(--primary-color, #3b82f6)' }}
          >
            Ir a mi Malla <ArrowRight size={16} />
          </Link>
        </div>

        {/* MÉTRICAS PRINCIPALES */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-extrabold uppercase text-slate-400">Ramos Cursando</span>
              <BookOpen size={20} className="text-blue-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{ramosCursando.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Asignaturas inscritas este semestre</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-extrabold uppercase text-slate-400">Ramos Aprobados</span>
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{ramosAprobados}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Avance curricular registrado</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-extrabold uppercase text-slate-400">Promedio General</span>
              <BarChart2 size={20} className="text-indigo-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{promedioGeneral}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">PGA de asignaturas finalizadas</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-extrabold uppercase text-slate-400">Tareas Pendientes</span>
              <Clock size={20} className="text-amber-500" />
            </div>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{evalPendientes.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Evaluaciones programadas</p>
          </div>

        </div>

        {/* CONTENIDO PRINCIPAL EN DOS COLUMNAS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PRÓXIMOS DEADLINES */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-700 pb-4">
              <h2 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="text-blue-500" size={20} /> Próximas Evaluaciones
              </h2>
              <Link href="/evaluaciones" className="text-xs font-bold text-blue-600 dark:text-sky-400 hover:underline">
                Ver todas →
              </Link>
            </div>

            {evalPendientes.length === 0 ? (
              <p className="text-slate-500 font-bold text-sm text-center py-8">
                ¡Al día! No tienes pruebas o tareas pendientes.
              </p>
            ) : (
              evalPendientes.slice(0, 5).map(ev => {
                const ramo = ramos.find(r => r.id === ev.ramo_id)
                return (
                  <div key={ev.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-sky-400">
                        {ramo?.nombre || 'General'}
                      </span>
                      <h3 className="font-extrabold text-slate-900 dark:text-white text-base mt-1">{ev.titulo}</h3>
                    </div>
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {ev.fecha_entrega.split('-').reverse().join('/')}
                    </span>
                  </div>
                )
              })
            )}
          </div>

          {/* ACCESOS RÁPIDOS */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">
              Módulos
            </h2>

            <div className="space-y-3">
              <Link href="/malla" className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 transition font-extrabold text-sm">
                <span className="flex items-center gap-2.5"><Layers size={18} className="text-blue-500" /> Malla Curricular</span>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>

              <Link href="/calendario" className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 transition font-extrabold text-sm">
                <span className="flex items-center gap-2.5"><Calendar size={18} className="text-indigo-500" /> Calendario y Clases</span>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>

              <Link href="/rendimiento" className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl hover:bg-slate-100 transition font-extrabold text-sm">
                <span className="flex items-center gap-2.5"><BarChart2 size={18} className="text-emerald-500" /> Rendimiento y Notas</span>
                <ArrowRight size={16} className="text-slate-400" />
              </Link>
            </div>
          </div>

        </div>

      </main>
    </div>
  )
}