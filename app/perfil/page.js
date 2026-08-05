'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Mail, Save, AlertTriangle, GraduationCap, Building2 } from 'lucide-react'

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  const [formData, setFormData] = useState({
    nombre: '',
    universidad: 'Mi Universidad',
    carrera: 'Ingeniería',
  })

  useEffect(() => {
    const cargarUsuario = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) {
        router.push('/')
        return
      }
      setUser(user)
      setFormData({
        ...formData,
        nombre: user.user_metadata?.full_name || '',
      })
      setLoading(false)
    }
    cargarUsuario()
  }, [])

  const handleGuardarCambios = async () => {
    setGuardando(true)
    setMensaje({ tipo: '', texto: '' })

    const { error } = await supabase.auth.updateUser({
      data: { full_name: formData.nombre }
    })

    if (error) {
      setMensaje({ tipo: 'error', texto: 'Hubo un error al guardar los cambios.' })
    } else {
      setMensaje({ tipo: 'exito', texto: '¡Perfil actualizado correctamente!' })
      await supabase.from('perfiles').update({ nombre: formData.nombre }).eq('id', user.id)
    }
    setGuardando(false)
  }

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f1f5f9] text-slate-800 font-bold text-xl">Cargando perfil...</div>

  return (
    <div className="min-h-screen bg-[#f1f5f9] font-sans pb-12">
      
      <header className="bg-[#0f172a] text-white py-4 px-8 shadow-md sticky top-0 z-10 flex items-center gap-6">
        <Link href="/malla" className="flex items-center gap-2 text-slate-400 hover:text-white font-bold transition bg-slate-800 px-4 py-2 rounded-lg">
          <ArrowLeft size={18} /> Volver a la Malla
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight">Configuración de Cuenta</h1>
      </header>
      
      <main className="max-w-4xl mx-auto mt-10 px-6">
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 mb-8 flex items-center gap-6">
          <div className="w-24 h-24 bg-sky-100 rounded-full border-4 border-sky-50 flex items-center justify-center overflow-hidden shrink-0">
            {user?.user_metadata?.avatar_url ? (
              <img src={user.user_metadata.avatar_url} alt="Foto de perfil" className="w-full h-full object-cover" />
            ) : (
              <User size={40} className="text-sky-600" />
            )}
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">{user?.user_metadata?.full_name}</h2>
            <p className="text-slate-500 font-medium flex items-center gap-2 mt-1">
              <Mail size={16} /> {user?.email}
            </p>
            <span className="inline-block mt-3 px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider rounded-full">
              Cuenta Vinculada con Google
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="col-span-1 space-y-2">
            <button className="w-full text-left px-4 py-3 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200 transition">
              Información Personal
            </button>
            <button className="w-full text-left px-4 py-3 bg-transparent text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition">
              Apariencia y Tema
            </button>
            <button className="w-full text-left px-4 py-3 bg-transparent text-slate-600 font-bold hover:bg-slate-100 rounded-lg transition">
              Notificaciones
            </button>
          </div>

          <div className="col-span-2 space-y-8">
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-xl font-extrabold text-slate-900 mb-6 border-b border-slate-100 pb-4">Detalles Personales</h3>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Nombre de Visualización</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full border-2 border-slate-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 font-bold" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Correo Electrónico</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input 
                      type="email" 
                      value={user?.email} 
                      disabled
                      className="w-full border-2 border-slate-200 bg-slate-50 rounded-lg py-2.5 pl-10 pr-4 text-slate-500 font-bold cursor-not-allowed" 
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2 font-medium">El correo electrónico se gestiona a través de tu proveedor de inicio de sesión (Google).</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
              <h3 className="text-xl font-extrabold text-slate-900 mb-6 border-b border-slate-100 pb-4">Preferencias Académicas</h3>
              
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Universidad / Institución</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      value={formData.universidad}
                      onChange={(e) => setFormData({...formData, universidad: e.target.value})}
                      className="w-full border-2 border-slate-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 font-bold" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Carrera en curso</label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 text-slate-400" size={20} />
                    <input 
                      type="text" 
                      value={formData.carrera}
                      onChange={(e) => setFormData({...formData, carrera: e.target.value})}
                      className="w-full border-2 border-slate-300 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 font-bold" 
                    />
                  </div>
                </div>
              </div>
            </div>

            {mensaje.texto && (
              <div className={`p-4 rounded-lg font-bold flex items-center gap-2 ${mensaje.tipo === 'exito' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                {mensaje.tipo === 'error' && <AlertTriangle size={20} />}
                {mensaje.texto}
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button 
                onClick={handleGuardarCambios}
                disabled={guardando}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition font-extrabold shadow-lg shadow-blue-500/30 text-lg"
              >
                <Save size={20} strokeWidth={2.5} /> 
                {guardando ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>

          </div>
        </div>

      </main>
    </div>
  )
}