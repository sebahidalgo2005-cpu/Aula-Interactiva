'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, User, Mail, Save, AlertTriangle, GraduationCap, Building2, Palette, Moon, Sun, Monitor } from 'lucide-react'

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState('personal') // 'personal' | 'tema'
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  const [formData, setFormData] = useState({
    nombre: '',
    universidad: 'Mi Universidad',
    carrera: 'Ingeniería',
  })

  const [tema, setTema] = useState('light')

  useEffect(() => {
    // 1. Cargar preferencia de tema visual
    const temaGuardado = localStorage.getItem('theme') || 'light'
    setTema(temaGuardado)
    aplicarTemaDocumento(temaGuardado)

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

  const aplicarTemaDocumento = (nuevoTema) => {
    const root = document.documentElement
    root.classList.remove('dark', 'theme-navy')
    
    if (nuevoTema === 'dark') {
      root.classList.add('dark')
    } else if (nuevoTema === 'navy') {
      root.classList.add('dark', 'theme-navy')
    }
  }

  const cambiarTema = (nuevoTema) => {
    setTema(nuevoTema)
    localStorage.setItem('theme', nuevoTema)
    aplicarTemaDocumento(nuevoTema)
  }

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

  if (loading) return <div className="flex h-screen items-center justify-center bg-[#f1f5f9] dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-xl">Cargando perfil...</div>

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-12 transition-colors">
      
      <header className="bg-[#0f172a] text-white py-4 px-8 shadow-md sticky top-0 z-10 flex items-center gap-6">
        <Link href="/malla" className="flex items-center gap-2 text-slate-400 hover:text-white font-bold transition bg-slate-800 px-4 py-2 rounded-lg">
          <ArrowLeft size={18} /> Volver a la Malla
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight">Configuración de Cuenta</h1>
      </header>
      
      <main className="max-w-4xl mx-auto mt-10 px-6">
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-8 flex items-center gap-6">
          <div className="w-24 h-24 bg-sky-100 dark:bg-sky-950 rounded-full border-4 border-sky-50 dark:border-sky-900 flex items-center justify-center overflow-hidden shrink-0">
            {user?.user_metadata?.avatar_url ? (
              <Image 
                src={user.user_metadata.avatar_url} 
                alt="Foto de perfil" 
                width={96} 
                height={96} 
                unoptimized
                className="w-full h-full object-cover" 
              />
            ) : (
              <User size={40} className="text-sky-600 dark:text-sky-400" />
            )}
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{user?.user_metadata?.full_name}</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
              <Mail size={16} /> {user?.email}
            </p>
            <span className="inline-block mt-3 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full">
              Cuenta Vinculada con Google
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="col-span-1 space-y-2">
            <button 
              onClick={() => setSeccionActiva('personal')}
              className={`w-full text-left px-4 py-3 font-bold rounded-lg border transition ${
                seccionActiva === 'personal' 
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-400 border-blue-200 dark:border-blue-800' 
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
              }`}
            >
              Información Personal
            </button>
            <button 
              onClick={() => setSeccionActiva('tema')}
              className={`w-full text-left px-4 py-3 font-bold rounded-lg border transition flex items-center gap-2 ${
                seccionActiva === 'tema' 
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-400 border-blue-200 dark:border-blue-800' 
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
              }`}
            >
              <Palette size={18} /> Apariencia y Tema
            </button>
          </div>

          <div className="col-span-2 space-y-8">
            
            {seccionActiva === 'personal' && (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">Detalles Personales</h3>
                  
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nombre de Visualización</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input 
                          type="text" 
                          value={formData.nombre}
                          onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                          className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white font-bold" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Correo Electrónico</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input 
                          type="email" 
                          value={user?.email} 
                          disabled
                          className="w-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-lg py-2.5 pl-10 pr-4 text-slate-500 font-bold cursor-not-allowed" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleGuardarCambios}
                    disabled={guardando}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition font-extrabold shadow-lg shadow-blue-500/30 text-lg disabled:opacity-50"
                  >
                    <Save size={20} /> 
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </>
            )}

            {seccionActiva === 'tema' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Tema de la Plataforma</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Elige el estilo de color de tu preferencia.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Modo Claro */}
                  <button 
                    onClick={() => cambiarTema('light')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition ${
                      tema === 'light' 
                        ? 'border-blue-600 bg-blue-50/50 text-blue-700 font-black' 
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <Sun size={32} className="text-amber-500" />
                    <span className="text-sm">Modo Claro</span>
                  </button>

                  {/* Modo Noche */}
                  <button 
                    onClick={() => cambiarTema('dark')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition ${
                      tema === 'dark' 
                        ? 'border-sky-500 bg-slate-900 text-sky-400 font-black' 
                        : 'border-slate-200 hover:border-slate-300 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Moon size={32} className="text-indigo-400" />
                    <span className="text-sm">Modo Noche</span>
                  </button>

                  {/* Azul Universitario */}
                  <button 
                    onClick={() => cambiarTema('navy')}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center gap-3 transition ${
                      tema === 'navy' 
                        ? 'border-blue-500 bg-slate-950 text-blue-400 font-black' 
                        : 'border-slate-200 hover:border-slate-300 bg-slate-900 text-slate-300'
                    }`}
                  >
                    <Monitor size={32} className="text-blue-400" />
                    <span className="text-sm">Azul Universitario</span>
                  </button>

                </div>
              </div>
            )}

            {mensaje.texto && (
              <div className={`p-4 rounded-lg font-bold flex items-center gap-2 ${mensaje.tipo === 'exito' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {mensaje.texto}
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  )
}