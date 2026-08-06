'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import { 
  User, Mail, Save, AlertTriangle, GraduationCap, 
  Building2, Palette, Moon, Sun, Bell, LogOut, Check, Sliders 
} from 'lucide-react'

const PALETA_COLORES = [
  { nombre: 'Azul Real', hex: '#3b82f6' },
  { nombre: 'Violeta', hex: '#8b5cf6' },
  { nombre: 'Esmeralda', hex: '#10b981' },
  { nombre: 'Ámbar', hex: '#f59e0b' },
  { nombre: 'Rosa Neón', hex: '#ec4899' },
  { nombre: 'Rojo Carmesí', hex: '#ef4444' },
  { nombre: 'Cían', hex: '#06b6d4' },
  { nombre: 'Índigo', hex: '#6366f1' },
]

export default function PerfilPage() {
  const supabase = createClient()
  const router = useRouter()
  
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState('personal') 
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })

  const [formData, setFormData] = useState({
    nombre: '',
    universidad: 'Mi Universidad',
    carrera: 'Ingeniería',
  })

  const [notificaciones, setNotificaciones] = useState({
    alertasEvaluaciones: true,
    alertaAsistencia: true,
  })

  // Estados de Tema
  const [modoOscuro, setModoOscuro] = useState(false)
  const [colorPersonalizado, setColorPersonalizado] = useState('#3b82f6')

  useEffect(() => {
    // Cargar preferencias
    const darkInit = localStorage.getItem('themeMode') === 'dark'
    const colorInit = localStorage.getItem('primaryColor') || '#3b82f6'
    
    setModoOscuro(darkInit)
    setColorPersonalizado(colorInit)

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

  const aplicarModoTema = (esDark) => {
    setModoOscuro(esDark)
    localStorage.setItem('themeMode', esDark ? 'dark' : 'light')
    if (esDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  const aplicarColorTema = (hexColor) => {
    setColorPersonalizado(hexColor)
    localStorage.setItem('primaryColor', hexColor)
    document.documentElement.style.setProperty('--primary-color', hexColor)
    setMensaje({ tipo: 'exito', texto: '¡Color de tema actualizado en toda la web!' })
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f1f5f9] dark:bg-slate-900 text-slate-800 dark:text-white font-bold text-xl">
        Cargando perfil...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f1f5f9] dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-12 transition-colors">
      <Navbar />
      
      <main className="max-w-4xl mx-auto mt-8 px-6">
        
        {/* TARJETA DE USUARIO */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 mb-8 flex items-center justify-between flex-wrap gap-6">
          <div className="flex items-center gap-6">
            <div 
              className="w-20 h-24 bg-sky-100 dark:bg-sky-950 rounded-full border-4 border-white dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-sm"
              style={{ borderColor: colorPersonalizado }}
            >
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
                <User size={36} className="text-slate-600 dark:text-slate-300" />
              )}
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">{user?.user_metadata?.full_name || 'Estudiante'}</h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-2 mt-1 text-sm">
                <Mail size={15} /> {user?.email}
              </p>
              <span className="inline-block mt-2 px-3 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider rounded-full">
                Cuenta Google Activa
              </span>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN Y CONFIGURACIÓN */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="col-span-1 space-y-2">
            <button 
              onClick={() => setSeccionActiva('personal')}
              className={`w-full text-left px-4 py-3 font-bold rounded-xl border transition flex items-center gap-2.5 ${
                seccionActiva === 'personal' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm' 
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <User size={18} /> Información Personal
            </button>
            
            <button 
              onClick={() => setSeccionActiva('tema')}
              className={`w-full text-left px-4 py-3 font-bold rounded-xl border transition flex items-center gap-2.5 ${
                seccionActiva === 'tema' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm' 
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <Palette size={18} /> Apariencia y Colores
            </button>

            <button 
              onClick={() => setSeccionActiva('notificaciones')}
              className={`w-full text-left px-4 py-3 font-bold rounded-xl border transition flex items-center gap-2.5 ${
                seccionActiva === 'notificaciones' 
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-600 shadow-sm' 
                  : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/50 border-transparent'
              }`}
            >
              <Bell size={18} /> Notificaciones
            </button>
          </div>

          <div className="col-span-2 space-y-6">
            
            {/* INFORMACIÓN PERSONAL */}
            {seccionActiva === 'personal' && (
              <>
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-5">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Detalles Académicos</h3>
                  
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Nombre Completo</label>
                    <input 
                      type="text" 
                      value={formData.nombre}
                      onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                      className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg py-2.5 px-4 focus:ring-2 outline-none text-slate-900 dark:text-white font-bold" 
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Universidad</label>
                      <input 
                        type="text" 
                        value={formData.universidad}
                        onChange={(e) => setFormData({...formData, universidad: e.target.value})}
                        className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg py-2.5 px-4 outline-none font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Carrera</label>
                      <input 
                        type="text" 
                        value={formData.carrera}
                        onChange={(e) => setFormData({...formData, carrera: e.target.value})}
                        className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg py-2.5 px-4 outline-none font-bold" 
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={handleGuardarCambios}
                    disabled={guardando}
                    className="text-white px-8 py-3 rounded-xl flex items-center gap-2 font-extrabold shadow-md transition disabled:opacity-50"
                    style={{ backgroundColor: colorPersonalizado }}
                  >
                    <Save size={18} /> {guardando ? 'Guardando...' : 'Guardar Cambios'}
                  </button>
                </div>
              </>
            )}

            {/* SECTOR DE APARIENCIA Y COLORES LIBRES */}
            {seccionActiva === 'tema' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-6">
                
                {/* MODO CLARO / OSCURO */}
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">Modo Visual</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Elige entre fondo claro o modo noche para descansar la vista.</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      onClick={() => aplicarModoTema(false)}
                      className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-extrabold text-sm transition ${
                        !modoOscuro 
                          ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-slate-700 dark:text-white' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Sun size={20} className="text-amber-500" /> Claro
                    </button>

                    <button 
                      onClick={() => aplicarModoTema(true)}
                      className={`p-4 rounded-xl border-2 flex items-center justify-center gap-3 font-extrabold text-sm transition ${
                        modoOscuro 
                          ? 'border-blue-500 bg-slate-900 text-sky-400' 
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Moon size={20} className="text-indigo-400" /> Noche
                    </button>
                  </div>
                </div>

                {/* PALETA Y COLOR PICKER */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-1">Color de Acento Principal</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Este color personalizará los botones, insignias e indicadores de toda la web.</p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {PALETA_COLORES.map((col) => (
                      <button
                        key={col.hex}
                        onClick={() => aplicarColorTema(col.hex)}
                        className={`p-3 rounded-xl border-2 flex items-center gap-2.5 font-bold text-xs transition ${
                          colorPersonalizado.toLowerCase() === col.hex.toLowerCase()
                            ? 'border-slate-900 dark:border-white shadow-sm scale-[1.02]'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-400'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full shrink-0 shadow-xs" style={{ backgroundColor: col.hex }}></span>
                        <span className="truncate">{col.nombre}</span>
                      </button>
                    ))}
                  </div>

                  {/* SELECTOR LIBRE DE COLOR */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Sliders size={20} className="text-slate-500" />
                      <div>
                        <p className="font-extrabold text-sm text-slate-900 dark:text-white">Color Personalizado Libre</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Elige cualquier tono usando la paleta RGB.</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-mono font-bold uppercase">{colorPersonalizado}</span>
                      <input 
                        type="color" 
                        value={colorPersonalizado}
                        onChange={(e) => aplicarColorTema(e.target.value)}
                        className="w-10 h-10 rounded-lg border-2 border-slate-300 dark:border-slate-600 cursor-pointer bg-transparent p-0.5"
                      />
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* NOTIFICACIONES */}
            {seccionActiva === 'notificaciones' && (
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-4">
                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-4">Notificaciones del Sistema</h3>
                
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <div>
                    <p className="font-extrabold text-sm">Alertas de Evaluaciones</p>
                    <p className="text-xs text-slate-500">Notificar entregas próximas a vencer.</p>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={notificaciones.alertasEvaluaciones}
                    onChange={(e) => setNotificaciones({...notificaciones, alertasEvaluaciones: e.target.checked})}
                    className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

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