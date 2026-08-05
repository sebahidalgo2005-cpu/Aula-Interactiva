'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Trash2, Edit, Layers } from 'lucide-react'
import { useMallaStore } from '@/store/useMallaStore'
import ModalRamo from '@/components/ModalRamo'

export default function ListaRamosPage() {
  const supabase = createClient()
  const router = useRouter()
  const { ramos, setRamos, eliminarRamo, setRamoSeleccionado } = useMallaStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cargarRamos = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/')
        return
      }

      const { data: ramosDB } = await supabase.from('ramos').select('*').eq('usuario_id', user.id)
      if (ramosDB) setRamos(ramosDB)
      setLoading(false)
    }
    cargarRamos()
  }, [])

  const handleBorrar = async (id) => {
    eliminarRamo(id)
    await supabase.from('ramos').delete().eq('id', id)
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f1f5f9] font-bold text-slate-800">Cargando listado...</div>

  return (
    <div className="min-h-screen bg-[#f1f5f9] p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <Link href="/malla" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 font-bold transition bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <ArrowLeft size={18} /> Volver a la Malla
          </Link>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="text-blue-600" /> Lista General de Ramos (Control de Fantasmas)
          </h1>
        </header>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs uppercase tracking-wider font-extrabold">
                <th className="p-4">Nombre del Ramo</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Semestre (Columna)</th>
                <th className="p-4">Fila</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm font-medium">
              {ramos.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400 font-bold">No hay ramos registrados todavía.</td>
                </tr>
              ) : (
                ramos.map((ramo) => (
                  <tr key={ramo.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: ramo.color || '#3b82f6' }}></div>
                      <span className="font-extrabold text-slate-900">{ramo.nombre}</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase ${ramo.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-800' : ramo.estado === 'cursando' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-100 text-slate-700'}`}>
                        {ramo.estado}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">Semestre {ramo.semestre_columna}</td>
                    <td className="p-4 font-bold text-slate-700">Fila {ramo.fila_posicion}</td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => setRamoSeleccionado(ramo)}
                        className="bg-blue-50 text-blue-600 hover:bg-blue-100 p-2 rounded-lg font-bold transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <Edit size={16} /> Editar
                      </button>
                      <button 
                        onClick={() => handleBorrar(ramo.id)}
                        className="bg-red-50 text-red-600 hover:bg-red-100 p-2 rounded-lg font-bold transition inline-flex items-center gap-1 shadow-sm"
                      >
                        <Trash2 size={16} /> Borrar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ModalRamo />
    </div>
  )
}