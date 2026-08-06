'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { BarChart2, Award, BookOpen, AlertCircle } from 'lucide-react'

export default function RendimientoPage() {
  const supabase = createClient()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ramos, setRamos] = useState([])

  useEffect(() => {
    const cargarRendimiento = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return router.push('/')

      const { data } = await supabase.from('ramos').select('*').eq('usuario_id', user.id)
      if (data) setRamos(data)
      setLoading(false)
    }
    cargarRendimiento()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1f5f9] dark:bg-slate-900 font-bold text-xl text-slate-800 dark:text-white">
        Cargando Informe de Rendimiento...
      </div>
    )
  }

  const ramosFinalizados = ramos.filter(r => r.nota_final && Number(r.nota_final) > 0)
  const promedioAcumulado = ramosFinalizados.length > 0
    ? (ramosFinalizados.reduce((acc, r) => acc + Number(r.nota_final), 0) / ramosFinalizados.length).toFixed(2)
    : '0.0'

  const aprobados = ramos.filter(r => r.estado === 'aprobado').length
  const cursando = ramos.filter(r => r.estado === 'cursando').length
  const reprobados = ramos.filter(r => r.estado === 'reprobado').length

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-12 transition-colors">
      <Navbar />

      <main className="max-w-6xl mx-auto mt-8 px-6 space-y-8">
        
        {/* CABECERA CON NOTA PGA */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart2 className="text-blue-500" /> Rendimiento y Promedio Académico
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
              Seguimiento de calificaciones y estado general de tus asignaturas.
            </p>
          </div>

          <div className="text-center bg-slate-50 dark:bg-slate-900 p-4 px-8 rounded-2xl border border-slate-200 dark:border-slate-700">
            <span className="text-xs font-black uppercase text-slate-400">Promedio General (PGA)</span>
            <p className="text-4xl font-black mt-1" style={{ color: 'var(--primary-color, #3b82f6)' }}>
              {promedioAcumulado}
            </p>
          </div>
        </div>

        {/* CONTADORES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-xl">
              <Award size={24} />
            </div>
            <div>
              <p className="text-2xl font-black">{aprobados}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Ramos Aprobados</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-950 text-blue-600 rounded-xl">
              <BookOpen size={24} />
            </div>
            <div>
              <p className="text-2xl font-black">{cursando}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">En Cursado</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-100 dark:bg-red-950 text-red-600 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-black">{reprobados}</p>
              <p className="text-xs font-bold text-slate-400 uppercase">Reprobados</p>
            </div>
          </div>
        </div>

        {/* TABLA DETALLADA DE RAMOS */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-700">
            <h2 className="font-extrabold text-lg text-slate-900 dark:text-white">Desglose por Asignatura</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 text-xs font-black uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <th className="p-4">Asignatura</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Nota Final</th>
                  <th className="p-4">Eximición</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700 text-sm font-bold">
                {ramos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400">Sin ramos registrados en la malla.</td>
                  </tr>
                ) : (
                  ramos.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition">
                      <td className="p-4 flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: r.color || '#3b82f6' }}></span>
                        <span className="text-slate-900 dark:text-white">{r.nombre}</span>
                      </td>
                      <td className="p-4 uppercase text-xs">
                        <span className={`px-2.5 py-1 rounded-full ${
                          r.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' :
                          r.estado === 'cursando' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-sky-300' :
                          'bg-slate-100 text-slate-500'
                        }`}>
                          {r.estado}
                        </span>
                      </td>
                      <td className="p-4 font-black text-base">
                        {r.nota_final ? Number(r.nota_final).toFixed(1) : '-'}
                      </td>
                      <td className="p-4 text-xs text-slate-500">
                        {r.exige_eximicion ? `Min: ${r.nota_eximicion || 5.0}` : 'Sin Eximición'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  )
}