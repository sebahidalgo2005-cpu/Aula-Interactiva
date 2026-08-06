'use client'
import { useState, useEffect } from 'react'
import { useMallaStore } from '@/store/useMallaStore'
import { createClient } from '@/utils/supabase/client'
import { X, Trash2, Save, Plus, BookOpen, Calculator, FolderOpen, AlertCircle, Edit3, Eye, Tag, Sliders, Lock, Key, CalendarRange, Award, UploadCloud } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'

export default function ModalRamo() {
  const { ramoSeleccionado, setRamoSeleccionado, actualizarRamo, eliminarRamo, ramos, categorias } = useMallaStore()
  const supabase = createClient()
  
  const [tab, setTab] = useState('general')
  const [modoEdicionApuntes, setModoEdicionApuntes] = useState(true)
  const [notaHipotetica, setNotaHipotetica] = useState(5.5)
  const [activarSimulador, setActivarSimulador] = useState(false)
  const [guardando, setGuardando] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '', color: '#3b82f6', estado: 'pendiente',
    creditos: '5', nota_final: '4.0', // FIX: Usamos String para los decimales fluidos
    fecha_inicio: '', fecha_fin: '', 
    permite_eximicion: false, nota_eximicion: '5.5', nota_aprobacion: '4.0',
    exige_asistencia: false, porcentaje_asistencia_minima: '70',
    apuntes: '# Apuntes de Clase', prerrequisitos: [], grupos: [], archivos: []
  })

  useEffect(() => {
    if (ramoSeleccionado) {
      setFormData({
        nombre: ramoSeleccionado.nombre || '', 
        color: ramoSeleccionado.color || '#3b82f6',
        estado: ramoSeleccionado.estado || 'pendiente', 
        creditos: String(ramoSeleccionado.creditos ?? 5),
        nota_final: String(ramoSeleccionado.nota_final ?? 4.0), 
        fecha_inicio: ramoSeleccionado.fecha_inicio || '', 
        fecha_fin: ramoSeleccionado.fecha_fin || '', 
        permite_eximicion: ramoSeleccionado.permite_eximicion || false,
        nota_eximicion: String(ramoSeleccionado.nota_eximicion ?? 5.5), 
        nota_aprobacion: String(ramoSeleccionado.nota_aprobacion ?? 4.0),
        exige_asistencia: ramoSeleccionado.exige_asistencia || false,
        porcentaje_asistencia_minima: String(ramoSeleccionado.porcentaje_asistencia_minima ?? 70),
        apuntes: ramoSeleccionado.apuntes || '# Apuntes de Clase',
        prerrequisitos: ramoSeleccionado.prerrequisitos?.filter(id => ramos.some(r => r.id === id)) || [],
        grupos: ramoSeleccionado.grupos || [],
        archivos: ramoSeleccionado.archivos || []
      })
      setActivarSimulador(false)
    }
  }, [ramoSeleccionado, ramos])

  if (!ramoSeleccionado) return null

  const ramosQueAbre = ramos.filter(r => r.prerrequisitos?.includes(ramoSeleccionado.id))

  const calcularProgresoNotas = () => {
    let notaAcumulada = 0; let porcentajeEvaluado = 0
    formData.grupos.forEach(grupo => {
      if (grupo.notas && grupo.notas.length > 0) {
        const promedioGrupo = grupo.notas.reduce((a, b) => a + Number(b.calificacion || 0), 0) / grupo.notas.length
        notaAcumulada += (promedioGrupo * (Number(grupo.ponderacion || 0) / 100))
        porcentajeEvaluado += Number(grupo.ponderacion || 0)
      }
    })
    const porcentajeRestante = Math.max(0, 100 - porcentajeEvaluado)
    let notaFinalSimulada = notaAcumulada
    if (activarSimulador && porcentajeRestante > 0) notaFinalSimulada += (notaHipotetica * (porcentajeRestante / 100))

    let notaFaltanteEximicion = null; let notaFaltanteAprobacion = null
    
    // Parseo rápido para matemática interna de la UI
    const numEximicion = parseFloat(formData.nota_eximicion) || 0
    const numAprobacion = parseFloat(formData.nota_aprobacion) || 0
    
    if (porcentajeRestante > 0) {
      if (formData.permite_eximicion) notaFaltanteEximicion = (numEximicion - notaAcumulada) / (porcentajeRestante / 100)
      notaFaltanteAprobacion = (numAprobacion - notaAcumulada) / (porcentajeRestante / 100)
    }
    return { notaAcumulada, notaFinalSimulada: activarSimulador ? notaFinalSimulada : notaAcumulada, porcentajeEvaluado, porcentajeRestante, notaFaltanteEximicion, notaFaltanteAprobacion }
  }

  const progreso = calcularProgresoNotas()

  const handleGuardar = async () => {
    try {
      setGuardando(true)

      // FIX: Parseo seguro a número antes de enviar a BD
      const datosParaBD = {
        ...formData,
        nota_final: parseFloat(formData.nota_final) || 0,
        creditos: parseInt(formData.creditos) || 0,
        nota_eximicion: parseFloat(formData.nota_eximicion) || 0,
        nota_aprobacion: parseFloat(formData.nota_aprobacion) || 0,
        porcentaje_asistencia_minima: parseInt(formData.porcentaje_asistencia_minima) || 0,
        fecha_inicio: formData.fecha_inicio && formData.fecha_inicio.trim() !== '' ? formData.fecha_inicio : null,
        fecha_fin: formData.fecha_fin && formData.fecha_fin.trim() !== '' ? formData.fecha_fin : null,
      }

      actualizarRamo(ramoSeleccionado.id, datosParaBD)

      const { error } = await supabase.from('ramos').update(datosParaBD).eq('id', ramoSeleccionado.id)
      if (error) throw error

      setRamoSeleccionado(null)
    } catch (error) {
      console.error("Error al guardar en Supabase:", error)
      alert(`Error al guardar en la base de datos:\n${error.message}`)
    } finally {
      setGuardando(false)
    }
  }

  const handleBorrar = async () => {
    if (!window.confirm("¿Estás seguro de eliminar este ramo por completo?")) return
    try {
      if (formData.archivos && formData.archivos.length > 0) {
        const rutasParaBorrar = formData.archivos.map(a => a.ruta)
        await supabase.storage.from('material_estudio').remove(rutasParaBorrar)
      }

      eliminarRamo(ramoSeleccionado.id)
      const { error } = await supabase.from('ramos').delete().eq('id', ramoSeleccionado.id)
      if (error) throw error
      setRamoSeleccionado(null)
    } catch (error) {
      console.error("Error al borrar el ramo:", error)
      alert(`Error al eliminar el ramo:\n${error.message}`)
    }
  }

  const agregarGrupo = () => setFormData({ ...formData, grupos: [...formData.grupos, { id: Date.now(), nombre: 'Nuevo Grupo', ponderacion: 0, notas: [] }] })
  const agregarNota = (grupoId) => setFormData({ ...formData, grupos: formData.grupos.map(g => g.id === grupoId ? { ...g, notas: [...g.notas, { id: Date.now(), calificacion: "4.0" }] } : g) })
  const actualizarNombreGrupo = (grupoId, nombre) => setFormData({ ...formData, grupos: formData.grupos.map(g => g.id === grupoId ? { ...g, nombre } : g) })
  const actualizarPonderacionGrupo = (grupoId, ponderacion) => setFormData({ ...formData, grupos: formData.grupos.map(g => g.id === grupoId ? { ...g, ponderacion: Number(ponderacion) || 0 } : g) })
  const actualizarCalificacionNota = (grupoId, notaId, calificacion) => setFormData({ ...formData, grupos: formData.grupos.map(g => g.id === grupoId ? { ...g, notas: g.notas.map(n => n.id === notaId ? { ...n, calificacion: calificacion } : n) } : g) })

  const togglePrerrequisito = (idRamo) => {
    const existe = formData.prerrequisitos.includes(idRamo)
    setFormData({ ...formData, prerrequisitos: existe ? formData.prerrequisitos.filter(id => id !== idRamo) : [...formData.prerrequisitos, idRamo] })
  }

  return (
    <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden border border-slate-200">
        <div className="bg-slate-50 border-b">
          <div className="flex justify-between items-center p-5 border-b" style={{ backgroundColor: formData.color + '20' }}>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
              <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: formData.color }}></div>
              {formData.nombre}
            </h2>
            <button onClick={() => setRamoSeleccionado(null)} className="text-slate-500 hover:text-red-600 hover:bg-red-50 transition rounded-full p-2"><X size={24} strokeWidth={2.5} /></button>
          </div>
          <div className="flex px-5 pt-3 gap-6">
            <button onClick={() => setTab('general')} className={`pb-3 font-bold flex items-center gap-2 border-b-4 transition-colors ${tab === 'general' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><BookOpen size={18} /> Ajustes Generales</button>
            <button onClick={() => setTab('notas')} className={`pb-3 font-bold flex items-center gap-2 border-b-4 transition-colors ${tab === 'notas' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><Calculator size={18} /> Notas y Eximición</button>
            <button onClick={() => setTab('archivos')} className={`pb-3 font-bold flex items-center gap-2 border-b-4 transition-colors ${tab === 'archivos' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800'}`}><FolderOpen size={18} /> Aula Virtual & LaTeX</button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {tab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className=" text-sm font-bold text-slate-900 mb-2">Nombre del Ramo</label>
                  <input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="w-full border-2 border-slate-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-600 outline-none text-slate-900 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className=" text-sm font-bold text-slate-900 mb-2 flex items-center gap-1"><Tag size={14}/> Categoría</label>
                    <select value={categorias.find(c => c.color === formData.color)?.nombre || ""} onChange={(e) => { const cat = categorias.find(c => c.nombre === e.target.value); if (cat) setFormData({...formData, color: cat.color}) }} className="w-full border-2 border-slate-300 rounded-lg p-2.5 outline-none bg-white text-slate-900 font-bold text-sm">
                      <option value="">Seleccionar...</option>
                      {categorias.map(cat => <option key={cat.id} value={cat.nombre}>{cat.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-2">Estado</label>
                    <select value={formData.estado} onChange={(e) => setFormData({...formData, estado: e.target.value})} className="w-full border-2 border-slate-300 rounded-lg p-2.5 outline-none bg-white text-slate-900 font-bold text-sm">
                      <option value="pendiente">Pendiente</option>
                      <option value="cursando">Cursando</option>
                      <option value="aprobado">Aprobado</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 bg-blue-50/50 p-5 rounded-xl border-2 border-blue-200 shadow-sm">
                <div>
                  <label className=" text-xs font-bold text-blue-900 mb-1 uppercase flex items-center gap-1"><Award size={14}/> Créditos (SCT)</label>
                  {/* FIX: Mantenemos el estado en String para que no borre puntos/comas */}
                  <input type="text" value={formData.creditos} onChange={(e) => setFormData({...formData, creditos: e.target.value})} className="w-full border-2 border-blue-200 rounded-lg p-2.5 font-bold text-slate-900 bg-white outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-blue-900 mb-1 uppercase">Nota Final (PPA)</label>
                  {/* FIX: Mantenemos el estado en String */}
                  <input type="text" value={formData.nota_final} onChange={(e) => setFormData({...formData, nota_final: e.target.value})} className="w-full border-2 border-blue-200 rounded-lg p-2.5 font-bold text-slate-900 bg-white outline-none" />
                </div>
              </div>

              {formData.estado === 'cursando' && (
                <div className="bg-slate-50 p-5 rounded-xl border-2 border-slate-200 shadow-sm flex items-center gap-6">
                  <div className="flex items-center gap-3 text-slate-700">
                    <CalendarRange size={32} />
                    <div><h3 className="font-extrabold text-sm uppercase">Tramo del Semestre</h3><p className="text-xs font-medium opacity-80">Rango para el calendario</p></div>
                  </div>
                  <div className="flex-1 flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Inicio</label>
                      <input type="date" value={formData.fecha_inicio || ""} onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})} className="w-full border-2 border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-900 bg-white" />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">Fin</label>
                      <input type="date" value={formData.fecha_fin || ""} onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})} className="w-full border-2 border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-900 bg-white" />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2"><AlertCircle size={18} className="text-blue-600"/> Reglas del Ramo</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input type="checkbox" checked={formData.permite_eximicion} onChange={(e) => setFormData({...formData, permite_eximicion: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                      <span className="text-sm font-bold text-slate-900">Permite Eximición</span>
                    </label>
                    {formData.permite_eximicion && (
                      <div className="pl-7">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Nota requerida</label>
                        <input type="text" value={formData.nota_eximicion} onChange={(e) => setFormData({...formData, nota_eximicion: e.target.value})} className="w-24 border-2 border-slate-300 rounded p-1.5 text-sm font-bold text-slate-900" />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input type="checkbox" checked={formData.exige_asistencia} onChange={(e) => setFormData({...formData, exige_asistencia: e.target.checked})} className="w-5 h-5 text-blue-600 rounded" />
                      <span className="text-sm font-bold text-slate-900">Exige Asistencia</span>
                    </label>
                    {formData.exige_asistencia && (
                      <div className="pl-7">
                        <label className="block text-xs font-bold text-slate-500 mb-1">Mínimo (%)</label>
                        <input type="text" value={formData.porcentaje_asistencia_minima} onChange={(e) => setFormData({...formData, porcentaje_asistencia_minima: e.target.value})} className="w-24 border-2 border-slate-300 rounded p-1.5 text-sm font-bold text-slate-900" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-orange-50/50 p-5 rounded-xl border-2 border-orange-200 shadow-sm">
                  <h3 className="font-extrabold text-orange-800 mb-2 flex items-center gap-2"><Lock size={16}/> Debes aprobar antes:</h3>
                  <div className="flex flex-wrap gap-2">
                    {ramos.filter(r => r.id !== ramoSeleccionado.id).map(r => {
                      const seleccionado = formData.prerrequisitos.includes(r.id)
                      return (
                        <button key={r.id} type="button" onClick={() => togglePrerrequisito(r.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition border-2 ${seleccionado ? 'bg-orange-500 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-300'}`}>
                          {r.nombre}
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="bg-emerald-50/50 p-5 rounded-xl border-2 border-emerald-200 shadow-sm">
                  <h3 className="font-extrabold text-emerald-800 mb-2 flex items-center gap-2"><Key size={16}/> Aprobar este ramo abre:</h3>
                  {ramosQueAbre.length === 0 ? (
                    <div className="text-center p-4 bg-white/50 border border-emerald-100 rounded-lg text-emerald-600/70 text-xs font-bold">Ninguno.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {ramosQueAbre.map(r => <span key={r.id} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 text-white">{r.nombre}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'notas' && (
            <div className="space-y-6">
              <div className="bg-slate-900 text-white p-6 rounded-xl shadow-lg space-y-4">
                <div className="flex gap-6 items-center">
                  <div className="flex-1">
                    <p className="text-sky-300 text-sm font-bold mb-1 uppercase">Promedio del Ramo</p>
                    <p className="text-5xl font-extrabold">{progreso.notaAcumulada.toFixed(1)}</p>
                    <p className="text-xs text-slate-400 mt-2 font-medium">Evaluado al {progreso.porcentajeEvaluado}%.</p>
                  </div>
                </div>
                {progreso.porcentajeRestante > 0 && (
                  <div className="pt-4 border-t border-slate-800 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-sky-300">
                        <input type="checkbox" checked={activarSimulador} onChange={(e) => setActivarSimulador(e.target.checked)} className="w-4 h-4 text-sky-500 rounded" />
                        <Sliders size={16} /> Activar Simulador (Nota Hipotética)
                      </label>
                      {activarSimulador && <span className="text-xs font-extrabold bg-sky-500/20 text-sky-300 px-3 py-1 rounded-full border border-sky-500/30">Resultado: {progreso.notaFinalSimulada.toFixed(1)}</span>}
                    </div>
                    {activarSimulador && (
                      <div className="flex items-center gap-4 bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                        <span className="text-xs text-slate-300 font-bold">Si obtengo un:</span>
                        <input type="range" min="1.0" max="7.0" step="0.1" value={notaHipotetica} onChange={(e) => setNotaHipotetica(parseFloat(e.target.value))} className="flex-1 accent-sky-500 cursor-pointer" />
                        <span className="font-mono text-lg font-extrabold text-sky-400 w-12 text-right">{notaHipotetica.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {formData.grupos.map((grupo) => (
                  <div key={grupo.id} className="bg-white border-2 border-slate-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4 pb-3 border-b-2 border-slate-100">
                      <input type="text" value={grupo.nombre} onChange={(e) => actualizarNombreGrupo(grupo.id, e.target.value)} className="font-extrabold text-slate-900 text-lg outline-none border-b-2 border-dashed border-slate-300 bg-transparent" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-600">Vale el</span>
                        <input type="number" value={grupo.ponderacion} onChange={(e) => actualizarPonderacionGrupo(grupo.id, e.target.value)} className="w-16 border-2 border-slate-300 rounded p-1 text-center font-extrabold text-slate-900" /> <span className="font-bold">%</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {grupo.notas.map((nota, nIndex) => (
                        <div key={nota.id} className="flex justify-between items-center bg-slate-100 p-3 rounded-lg border">
                          <span className="text-sm font-bold text-slate-700">Evaluación {nIndex + 1}</span>
                          <input type="text" value={nota.calificacion} onChange={(e) => actualizarCalificacionNota(grupo.id, nota.id, e.target.value)} className="w-20 border-2 rounded p-1 font-mono text-center text-blue-700 font-extrabold" />
                        </div>
                      ))}
                      <button onClick={() => agregarNota(grupo.id)} className="w-full text-sm text-blue-700 font-bold py-3 hover:bg-blue-50 rounded-lg transition mt-2">+ Añadir Calificación</button>
                    </div>
                  </div>
                ))}
                <button onClick={agregarGrupo} className="w-full flex justify-center items-center gap-2 border-2 border-dashed border-slate-400 text-slate-600 py-4 rounded-xl hover:bg-blue-50 transition font-bold"><Plus size={20} /> Añadir Categoría de Evaluación</button>
              </div>
            </div>
          )}

          {tab === 'archivos' && (
            <div className="space-y-6">
              
              <div className="bg-white p-5 rounded-xl border-2 border-slate-200 shadow-sm">
                <h3 className="font-extrabold text-slate-900 mb-4 flex items-center gap-2"><UploadCloud size={18} className="text-blue-600"/> Material de Estudio (PDF, DOCX, PPT)</h3>
                
                <div className="space-y-3 mb-4">
                  {formData.archivos?.length > 0 ? formData.archivos.map((archivo, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border border-slate-200">
                       <a href={archivo.url} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-2"><FolderOpen size={16}/> {archivo.nombre}</a>
                       
                       <button onClick={async () => {
                         if(window.confirm("¿Seguro que deseas borrar permanentemente este archivo?")) {
                           await supabase.storage.from('material_estudio').remove([archivo.ruta]);
                           
                           // FIX: Sincronización instantánea de DB al borrar
                           const archivosRestantes = formData.archivos.filter((_, i) => i !== idx);
                           setFormData({...formData, archivos: archivosRestantes});
                           await supabase.from('ramos').update({ archivos: archivosRestantes }).eq('id', ramoSeleccionado.id);
                         }
                       }} className="text-red-500 hover:text-red-700 p-1"><Trash2 size={16}/></button>

                    </div>
                  )) : <p className="text-sm text-slate-500 font-medium">No hay archivos subidos aún.</p>}
                </div>

                <label className="w-full flex justify-center items-center gap-2 border-2 border-dashed border-blue-400 text-blue-600 py-3 rounded-xl hover:bg-blue-50 transition font-bold cursor-pointer">
                  <UploadCloud size={20} /> Subir Archivo Nuevo
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const { data: { user } } = await supabase.auth.getUser();
                      const ruta = `${user.id}/${ramoSeleccionado.id}/${Date.now()}-${file.name}`;
                      
                      const { error: uploadError } = await supabase.storage.from('material_estudio').upload(ruta, file);
                      if (uploadError) return alert("Error al subir el archivo. Verifica que el Bucket 'material_estudio' exista en Supabase y tenga permisos.");
                      
                      const { data: { publicUrl } } = supabase.storage.from('material_estudio').getPublicUrl(ruta);
                      
                      const nuevosArchivos = [...(formData.archivos || []), { nombre: file.name, url: publicUrl, ruta: ruta }];
                      
                      // FIX: Sincronización instantánea de DB al subir
                      setFormData({ ...formData, archivos: nuevosArchivos });
                      await supabase.from('ramos').update({ archivos: nuevosArchivos }).eq('id', ramoSeleccionado.id);
                    }} 
                  />
                </label>
              </div>

              <div className="flex justify-between items-center bg-slate-200 p-2 rounded-xl mt-6">
                <span className="text-xs font-extrabold text-slate-700 uppercase pl-2">Editor Markdown & LaTeX</span>
                <div className="flex gap-2">
                  <button onClick={() => setModoEdicionApuntes(true)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${modoEdicionApuntes ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}><Edit3 size={14} /> Editar</button>
                  <button onClick={() => setModoEdicionApuntes(false)} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${!modoEdicionApuntes ? 'bg-blue-600 text-white' : 'bg-white text-slate-700'}`}><Eye size={14} /> Vista Previa</button>
                </div>
              </div>
              {modoEdicionApuntes ? (
                <textarea value={formData.apuntes} onChange={(e) => setFormData({...formData, apuntes: e.target.value})} className="w-full h-96 p-4 font-mono text-sm border-2 border-slate-300 rounded-xl outline-none text-slate-900 bg-white" />
              ) : (
                <div className="w-full h-96 p-6 border-2 border-slate-300 rounded-xl bg-white overflow-y-auto prose max-w-none text-slate-900">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{formData.apuntes}</ReactMarkdown>
                </div>
              )}
            </div>
          )}

        </div>

        <div className="flex justify-between items-center p-5 bg-white border-t-2 border-slate-100">
          <button onClick={handleBorrar} className="text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg flex items-center gap-2 transition font-bold text-sm"><Trash2 size={18} /> Eliminar Ramo</button>
          <button onClick={handleGuardar} disabled={guardando} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition font-bold shadow-lg disabled:opacity-50">
            <Save size={20} /> {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>

      </div>
    </div>
  )
}