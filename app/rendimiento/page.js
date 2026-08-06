'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Award, BookOpen, CheckCircle, BarChart2 } from 'lucide-react'
import { useMallaStore } from '@/store/useMallaStore'

// Función Robusta: Solo calcula nota interna si configuraste el 100% de la ponderación. 
// Si no, confía en la "Nota Final" manual.
const obtenerNotaRamo = (ramo) => {
  let notaAcumulada = 0
  let porcentajeEvaluado = 0
  
  if (ramo.grupos && ramo.grupos.length > 0) {
    ramo.grupos.forEach(grupo => {
      if (grupo.notas && grupo.notas.length > 0) {
        const promedioGrupo = grupo.notas.reduce((a, b) => a + Number(b.calificacion || 0), 0) / grupo.notas.length
        notaAcumulada += (promedioGrupo * (Number(grupo.ponderacion || 0) / 100))
        porcentajeEvaluado += Number(grupo.ponderacion || 0)
      }
    })
  }

  // Si tiene el 100% de las notas ingresadas, retornamos el cálculo real.
  if (porcentajeEvaluado === 100) return notaAcumulada
  
  // Si no, devolvemos la nota manual ingresada en ajustes generales (por defecto 4.0).
  return Number(ramo.nota_final) > 0 ? Number(ramo.nota_final) : 4.0
}

export default function RendimientoPage() {
  const supabase = createClient()
  const router = useRouter()
  const { ramos, setRamos } = useMallaStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) return router.push('/')

      const { data: ramosDB } = await supabase.from('ramos').select('*').eq('usuario_id', user.id)
      if (ramosDB) setRamos(ramosDB)
      setLoading(false)
    }
    cargarDatos()
  }, [])

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f1f5f9] font-bold text-xl">Calculando rendimiento...</div>

  const ramosAprobados = ramos.filter(r => r.estado === 'aprobado')
  const totalCreditosAprobados = ramosAprobados.reduce((acc, r) => acc + (Number(r.creditos) || 0), 0)
  
  let sumaPonderadaAcumulada = 0
  let sumaCreditosAcumulados = 0

  ramosAprobados.forEach(r => {
    const cred = Number(r.creditos) || 0
    const nota = obtenerNotaRamo(r)
    sumaPonderadaAcumulada += (nota * cred)
    sumaCreditosAcumulados += cred
  })

  const ppa = sumaCreditosAcumulados === 0 ? '0.00' : (sumaPonderadaAcumulada / sumaCreditosAcumulados).toFixed(2)
  const semestresUnicos = [...new Set(ramos.map(r => r.semestre_columna))].sort((a, b) => a - b)

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        <header className="mb-8 flex justify-between items-center">
          <Link href="/malla" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <ArrowLeft size={18} /> Volver a la Malla
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <TrendingUp className="text-blue-600" /> Rendimiento Académico y PPA
          </h1>
        </header>

        {/* METRICAS PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
              <Award size={28} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">PPA Global</p>
              <p className="text-3xl font-black text-slate-900">{ppa}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle size={28} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Créditos Aprobados</p>
              <p className="text-3xl font-black text-slate-900">
                {totalCreditosAprobados} <span className="text-xs font-medium text-slate-400">SCT</span>
              </p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <BookOpen size={28} />
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">Ramos Aprobados</p>
              <p className="text-3xl font-black text-slate-900">
                {ramosAprobados.length} <span className="text-xs font-medium text-slate-400">de {ramos.length}</span>
              </p>
            </div>
          </div>

        </div>

        {/* DESGLOSE POR SEMESTRE */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart2 className="text-blue-600" /> Desglose Semestral
          </h2>
          
          <div className="space-y-4">
            {semestresUnicos.map(sem => {
              const ramosSemestre = ramos.filter(r => r.semestre_columna === sem)
              const aprobadosSem = ramosSemestre.filter(r => r.estado === 'aprobado')
              
              let sumaPondSem = 0
              let sumaCredSem = 0
              
              aprobadosSem.forEach(r => {
                const cred = Number(r.creditos) || 0
                const nota = obtenerNotaRamo(r)
                sumaPondSem += (nota * cred)
                sumaCredSem += cred
              })
              
              const gpaSem = sumaCredSem === 0 ? '0.00' : (sumaPondSem / sumaCredSem).toFixed(2)

              return (
                <div key={sem} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Semestre {sem}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {aprobadosSem.length} de {ramosSemestre.length} ramos aprobados
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-400 uppercase">Promedio Semestral</p>
                      <p className="text-lg font-black text-blue-600">{gpaSem}</p>
                    </div>
                    <div className="text-right border-l border-slate-200 pl-6">
                      <p className="text-xs font-bold text-slate-400 uppercase">Créditos</p>
                      <p className="text-lg font-black text-slate-800">{sumaCredSem} SCT</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}