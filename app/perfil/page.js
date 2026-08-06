'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  ArrowLeft, User, Mail, Save, AlertTriangle, GraduationCap, 
  Building2, Palette, Moon, Sun, Monitor, Bell, LogOut, Check 
} from 'lucide-react'

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState('personal') // 'personal' | 'tema' | 'notificaciones'
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  const [formData, setFormData] = useState({
    nombre: '',
    universidad: 'Mi Universidad',
    carrera: 'Ingeniería',
  })

  const [notificaciones, setNotificaciones] = useState({
    alertasEvaluaciones: true,
    alertaAsistencia: true,
    resumenSemanal: false
  })

  const [tema, setTema] = useState('light')

  useEffect(() => {
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
      setFormData(prev => ({
        ...prev,
        nombre: user.user_metadata?.full_name || '',
      }))
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
    setMensaje({ tipo: 'exito', texto: 'Apariencia actualizada correctamente.' })
  }

  const handleGuardarCambios = async () => {
    setGuardando(true)
    setMensaje({ tipo: '', texto: '' })

    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: formData.nombre }
      })

      if (error) throw error

      await supabase.from('perfiles').upsert({ 
        id: user.id, 
        nombre: formData.nombre,
        updated_at: new Date()
      })

      setMensaje({ tipo: 'exito', texto: '¡Perfil actualizado con éxito!' })
    } catch (error) {
      console.error(error)
      setMensaje({ tipo: 'error', texto: 'Error al actualizar el perfil.' })
    } finally {
      setGuardando(false)
    }
  }

  const handleCerrarSesion = async () => {
    if (window.confirm("¿Deseas cerrar sesión en Aula Interactiva?")) {
      await supabase.auth.signOut()
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1f5f9] dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-xl">
        Cargando perfil...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-12 transition-colors">
      
      {/* HEADER PRINCIPAL CON NAVEGACIÓN */}
      <header className="bg-[#0f172a] text-white py-4 px-8 shadow-md sticky top-0 z-20 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link href="/malla" className="flex items-center gap-2 text-slate-300 hover:text-white font-bold transition bg-slate-800 px-4 py-2 rounded-lg text-sm">
            <ArrowLeft size={16} /> Volver a la Malla
          </Link>
          <h1 className="text-xl font-extrabold tracking-tight">Mi Perfil y Ajustes</h1>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-slate-300 hover:text-white font-bold text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition">
            Dashboard
          </Link>
          <Link href="/calendario" className="text-slate-300 hover:text-white font-bold text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition">
            Calendario
          </Link>
          <Link href="/evaluaciones" className="text-slate-300 hover:text-white font-bold text-sm px-3 py-1.5 rounded-lg hover:bg-slate-800 transition">
            Evaluaciones
          </Link>
          <button 
            onClick={handleCerrarSesion}
            className="flex items-center gap-1.5 bg-red-600/80 hover:bg-red-600 text-white font-bold text-sm px-3.5 py-1.5 rounded-lg transition ml-2"
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto mt-10 px-6">
        
        {/* TARJETA USUARIO */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-8 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-6">
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
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">{user?.user_metadata?.full_name || 'Estudiante'}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1">
                <Mail size={16} /> {user?.email}
              </p>
              <span className="inline-block mt-3 px-3 py-1 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full">
                Cuenta Google Vinculada
              </span>
            </div>
          </div>

          <button 
            onClick={handleCerrarSesion}
            className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 dark:bg-slate-700 dark:hover:bg-red-950/50 dark:text-slate-200 dark:hover:text-red-400 font-extrabold px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 transition"
          >
            <LogOut size={18} /> Cerrar Sesión
          </button>
        </div>

        {/* NAVEGACIÓN DE SECCIONES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="col-span-1 space-y-2">
            <button 
              onClick={() => setSeccionActiva('personal')}
              className={`w-full text-left px-4 py-3 font-bold rounded-xl border transition flex items-center gap-2.5 ${
                seccionActiva === 'personal' 
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-400 border-blue-200 dark:border-blue-800' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <User size={18} /> Información Personal
            </button>
            
            <button 
              onClick={() => setSeccionActiva('tema')}
              className={`w-full text-left px-4 py-3 font-bold rounded-xl border transition flex items-center gap-2.5 ${
                seccionActiva === 'tema' 
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-400 border-blue-200 dark:border-blue-800' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Palette size={18} /> Apariencia y Tema
            </button>

            <button 
              onClick={() => setSeccionActiva('notificaciones')}
              className={`w-full text-left px-4 py-3 font-bold rounded-xl border transition flex items-center gap-2.5 ${
                seccionActiva === 'notificaciones' 
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-sky-400 border-blue-200 dark:border-blue-800' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/50 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Bell size={18} /> Notificaciones
            </button>
          </div>

          {/* CONTENIDO DE PESTAÑAS */}
          <div className="col-span-2 space-y-6">
            
            {/* 1. INFORMACIÓN PERSONAL */}
            {seccionActiva === 'personal' && (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">Detalles del Usuario</h3>
                  
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
                          value={user?.email || ''} 
                          disabled
                          className="w-full border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-lg py-2.5 pl-10 pr-4 text-slate-500 font-bold cursor-not-allowed" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">Preferencias Académicas</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Universidad</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input 
                          type="text" 
                          value={formData.universidad}
                          onChange={(e) => setFormData({...formData, universidad: e.target.value})}
                          className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white font-bold" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Carrera</label>
                      <div className="relative">
                        <GraduationCap className="absolute left-3 top-3 text-slate-400" size={20} />
                        <input 
                          type="text" 
                          value={formData.carrera}
                          onChange={(e) => setFormData({...formData, carrera: e.target.value})}
                          className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg py-2.5 pl-10 pr-4 focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 dark:text-white font-bold" 
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleGuardarCambios}
                    disabled={guardando}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl flex items-center gap-2 transition font-extrabold shadow-lg shadow-blue-500/30 text-base disabled:opacity-50"
                  >
                    <Save size={18} /> 
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </>
            )}

            {/* 2. APARIENCIA Y TEMA */}
            {seccionActiva === 'tema' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Tema de la Plataforma</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Elige el tema visual que prefieras para Aula Interactiva.</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  
                  <button 
                    onClick={() => cambiarTema('light')}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition ${
                      tema === 'light' 
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-sky-400 font-black shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Sun size={32} className="text-amber-500" />
                    <span className="text-sm">Modo Claro</span>
                  </button>

                  <button 
                    onClick={() => cambiarTema('dark')}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition ${
                      tema === 'dark' 
                        ? 'border-sky-500 bg-slate-900 text-sky-400 font-black shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <Moon size={32} className="text-indigo-400" />
                    <span className="text-sm">Modo Noche</span>
                  </button>

                  <button 
                    onClick={() => cambiarTema('navy')}
                    className={`p-5 rounded-2xl border-2 flex flex-col items-center justify-center gap-3 transition ${
                      tema === 'navy' 
                        ? 'border-blue-500 bg-slate-950 text-blue-400 font-black shadow-sm' 
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 bg-slate-900 text-slate-300'
                    }`}
                  >
                    <Monitor size={32} className="text-blue-400" />
                    <span className="text-sm">Azul Universitario</span>
                  </button>

                </div>
              </div>
            )}

            {/* 3. NOTIFICACIONES */}
            {seccionActiva === 'notificaciones' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-6">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Preferencias de Alertas</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white text-sm">Alertas de Evaluaciones Próximas</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Avisos cuando una prueba o tarea falte menos de 3 días.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificaciones.alertasEvaluaciones}
                      onChange={(e) => setNotificaciones({...notificaciones, alertasEvaluaciones: e.target.checked})}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                    <div>
                      <p className="font-extrabold text-slate-900 dark:text-white text-sm">Alerta de Asistencia Mínima</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Notificar si la asistencia a un ramo cae del porcentaje obligatorio.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificaciones.alertaAsistencia}
                      onChange={(e) => setNotificaciones({...notificaciones, alertaAsistencia: e.target.checked})}
                      className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* MENSAJES DE ESTADO */}
            {mensaje.texto && (
              <div className={`p-4 rounded-xl font-bold flex items-center gap-2 ${
                mensaje.tipo === 'exito' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
              }`}>
                {mensaje.tipo === 'exito' ? <Check size={18}/> : <AlertTriangle size={18}/>}
                {mensaje.texto}
              </div>
            )}

          </div>
        </div>

      </main>
    </div>
  )
}