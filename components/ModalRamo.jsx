'use client'
import { useState, useEffect } from 'react'
import { useMallaStore } from '@/store/useMallaStore'
import { X, Save, Trash2, Plus, Calculator, Users, Link as LinkIcon, Book } from 'lucide-react'

export default function ModalRamo() {
  const { ramoEnFoco, setRamoEnFoco, actualizarRamo, agregarRamo, eliminarRamo, categorias, ramos } = useMallaStore()
  
  const [formData, setFormData] = useState(null)
  const [pestaña, setPestaña] = useState('general')

  useEffect(() => {
    if (!ramoEnFoco) return
    if (ramoEnFoco.nuevo) {
      setFormData({
        nombre: '', sigla: '', creditos: 0, estado: 'pendiente', 
        color: '#3b82f6', categoria_id: '',
        notas: [], prerrequisitos: [], exige_asistencia: false, 
        porcentaje_asistencia_minima: 70, exige_eximicion: false, nota_eximicion: 5.0
      })
    } else {
      setFormData({ ...ramoEnFoco })
    }
  }, [ramoEnFoco])

  if (!ramoEnFoco || !formData) return null

  const handleGuardar = () => {
    if (!formData.nombre) return alert("El nombre es obligatorio")
    
    let notaFinalCalculada = formData.nota_final || 0
    if (formData.notas && formData.notas.length > 0) {
      const sumaPonderada = formData.notas.reduce((acc, n) => acc + (Number(n.nota) * (Number(n.ponderacion)/100)), 0)
      notaFinalCalculada = sumaPonderada.toFixed(1)
    }

    const datosListos = { 
      ...formData, 
      creditos: parseInt(formData.creditos) || 0,
      nota_final: notaFinalCalculada
    }

    if (ramoEnFoco.nuevo) {
      datosListos.id = Date.now().toString()
      datosListos.semestre_id = '1'
      datosListos.fila = 0
      agregarRamo(datosListos)
    } else {
      actualizarRamo(ramoEnFoco.id, datosListos)
    }
    setRamoEnFoco(null)
  }

  const handleBorrar = () => {
    if(window.confirm(`¿Seguro que deseas eliminar el ramo "${formData.nombre}"?`)){
      eliminarRamo(ramoEnFoco.id)
    }
  }

  const agregarNota = () => {
    setFormData({ ...formData, notas: [...(formData.notas || []), { id: Date.now(), nombre: 'Nueva Evaluación', nota: 0, ponderacion: 0 }] })
  }
  
  const actualizarNota = (id, campo, valor) => {
    setFormData({ ...formData, notas: formData.notas.map(n => n.id === id ? { ...n, [campo]: valor } : n) })
  }
  
  const borrarNota = (id) => {
    setFormData({ ...formData, notas: formData.notas.filter(n => n.id !== id) })
  }

  const pesoActual = (formData.notas || []).reduce((acc, n) => acc + Number(n.ponderacion), 0)
  const notaActualPonderada = (formData.notas || []).reduce((acc, n) => acc + (Number(n.nota) * (Number(n.ponderacion)/100)), 0)
  const pesoFaltante = 100 - pesoActual
  const notaParaAprobar = pesoFaltante > 0 ? ((4.0 - notaActualPonderada) / (pesoFaltante / 100)).toFixed(1) : 'N/A'
  const notaParaEximirse = formData.exige_eximicion && pesoFaltante > 0 ? ((Number(formData.nota_eximicion) - notaActualPonderada) / (pesoFaltante / 100)).toFixed(1) : 'N/A'

  const togglePrerrequisito = (idRamoTarget) => {
    const pre = formData.prerrequisitos || []
    if (pre.includes(idRamoTarget)) {
      setFormData({...formData, prerrequisitos: pre.filter(p => p !== idRamoTarget)})
    } else {
      setFormData({...formData, prerrequisitos: [...pre, idRamoTarget]})
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col" style={{ maxHeight: '90vh' }}>
        
        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center" style={{ borderTop: `6px solid ${formData.color}` }}>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {ramoEnFoco.nuevo ? 'Nuevo Ramo' : formData.nombre}
          </h2>
          <button onClick={() => setRamoEnFoco(null)} className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full hover:bg-slate-200 transition text-slate-500">
            <X size={18} />
          </button>
        </div>

        <div className="flex bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
          <button onClick={() => setPestaña('general')} className={`flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-2 transition ${pestaña==='general' ? 'text-blue-600 dark:text-sky-400 border-b-2 border-blue-600' : 'text-slate-400'}`}><Book size={14}/> General</button>
          <button onClick={() => setPestaña('notas')} className={`flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-2 transition ${pestaña==='notas' ? 'text-blue-600 dark:text-sky-400 border-b-2 border-blue-600' : 'text-slate-400'}`}><Calculator size={14}/> Notas</button>
          <button onClick={() => setPestaña('requisitos')} className={`flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-2 transition ${pestaña==='requisitos' ? 'text-blue-600 dark:text-sky-400 border-b-2 border-blue-600' : 'text-slate-400'}`}><LinkIcon size={14}/> Requisitos</button>
          <button onClick={() => setPestaña('asistencia')} className={`flex-1 py-3 text-xs font-black uppercase flex items-center justify-center gap-2 transition ${pestaña==='asistencia' ? 'text-blue-600 dark:text-sky-400 border-b-2 border-blue-600' : 'text-slate-400'}`}><Users size={14}/> Asistencia</button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {pestaña === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-xs font-black text-slate-500 uppercase">Nombre del Ramo</label>
                  <input type="text" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2.5 font-bold outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">Sigla</label>
                  <input type="text" value={formData.sigla} onChange={e => setFormData({...formData, sigla: e.target.value.toUpperCase()})} className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2.5 font-bold outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">Créditos</label>
                  <input type="number" value={formData.creditos} onChange={e => setFormData({...formData, creditos: e.target.value})} className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2.5 font-bold outline-none" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">Estado</label>
                  <select value={formData.estado} onChange={e => setFormData({...formData, estado: e.target.value})} className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2.5 font-bold outline-none">
                    <option value="pendiente">Pendiente</option>
                    <option value="cursando">Cursando</option>
                    <option value="aprobado">Aprobado</option>
                    <option value="reprobado">Reprobado</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">Categoría</label>
                  <select value={formData.categoria_id} onChange={e => {
                    const cat = categorias.find(c => c.id === e.target.value)
                    setFormData({...formData, categoria_id: e.target.value, color: cat ? cat.color : formData.color})
                  }} className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-2.5 font-bold outline-none">
                    <option value="">Sin Categoría</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-black text-slate-500 uppercase">Color Personalizado</label>
                  <input type="color" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className="w-full h-12 rounded-lg cursor-pointer" />
                </div>
              </div>
            </div>
          )}

          {pestaña === 'notas' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-blue-50 dark:bg-slate-900/50 p-4 rounded-xl border border-blue-100 dark:border-slate-700">
                <div className="flex-1">
                  <label className="flex items-center gap-2 text-sm font-bold">
                    <input type="checkbox" checked={formData.exige_eximicion} onChange={e => setFormData({...formData, exige_eximicion: e.target.checked})} className="w-4 h-4" />
                    ¿Este ramo permite eximición?
                  </label>
                </div>
                {formData.exige_eximicion && (
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500">Nota Eximición:</span>
                    <input type="number" step="0.1" value={formData.nota_eximicion} onChange={e => setFormData({...formData, nota_eximicion: e.target.value})} className="w-20 border-2 rounded p-1 font-bold text-center dark:bg-slate-800" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-extrabold text-slate-900 dark:text-white">Registro de Evaluaciones</h3>
                  <button onClick={agregarNota} className="bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"><Plus size={14}/> Fila</button>
                </div>

                <div className="space-y-2">
                  {(formData.notas || []).map(nota => (
                    <div key={nota.id} className="w-full flex items-center gap-2">
                      <input type="text" value={nota.nombre} onChange={e => actualizarNota(nota.id, 'nombre', e.target.value)} className="flex-1 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg p-2 font-bold text-sm" placeholder="Ej: Solemne 1" />
                      <input type="number" step="0.1" value={nota.nota} onChange={e => actualizarNota(nota.id, 'nota', e.target.value)} className="w-20 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg p-2 font-bold text-sm text-center" placeholder="Nota" />
                      <div className="flex items-center gap-1 w-24">
                        <input type="number" value={nota.ponderacion} onChange={e => actualizarNota(nota.id, 'ponderacion', e.target.value)} className="w-16 border-2 border-slate-200 dark:border-slate-700 dark:bg-slate-900 rounded-lg p-2 font-bold text-sm text-center" placeholder="%" />
                        <span className="text-xs font-bold text-slate-400">%</span>
                      </div>
                      <button onClick={() => borrarNota(nota.id)} className="p-2 text-red-400 hover:text-red-600 bg-red-50 dark:bg-red-900/30 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-bold text-sm">Promedio Ponderado Actual:</span>
                  <span className="font-black text-lg text-blue-600 dark:text-sky-400">{notaActualPonderada.toFixed(2)}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-4">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${pesoActual}%` }}></div>
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-500">
                  <span>Peso Evaluado: {pesoActual}%</span>
                  <span>Falta por evaluar: {pesoFaltante}%</span>
                </div>

                {pesoFaltante > 0 && pesoFaltante <= 100 && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                    <p className="text-xs font-bold flex justify-between">Para aprobar (4.0) necesitas sacar en lo restante: <span className="text-emerald-600 font-black">{notaParaAprobar}</span></p>
                    {formData.exige_eximicion && (
                      <p className="text-xs font-bold flex justify-between">Para eximirte ({formData.nota_eximicion}) necesitas sacar: <span className="text-amber-600 font-black">{notaParaEximirse}</span></p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {pestaña === 'requisitos' && (
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase">¿Qué ramos abren este ramo?</h3>
              <p className="text-xs text-slate-500 mb-4">Selecciona las asignaturas que debes aprobar antes de cursar este ramo.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto custom-scrollbar pr-2" style={{ maxHeight: '300px' }}>
                {ramos.filter(r => r.id !== formData.id).map(r => {
                  const isChecked = (formData.prerrequisitos || []).includes(r.id)
                  return (
                    <label key={r.id} className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition ${isChecked ? 'border-blue-500 bg-blue-50 dark:bg-slate-800' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
                      <input type="checkbox" checked={isChecked} onChange={() => togglePrerrequisito(r.id)} className="w-4 h-4 accent-blue-600" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 line-clamp-2">{r.nombre}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          )}

          {pestaña === 'asistencia' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                <input type="checkbox" checked={formData.exige_asistencia} onChange={e => setFormData({...formData, exige_asistencia: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                <div>
                  <h4 className="font-bold text-sm">Este ramo exige asistencia obligatoria</h4>
                  <p className="text-xs text-slate-500">Habilita el contador y alertas en el calendario.</p>
                </div>
              </div>

              {formData.exige_asistencia && (
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase">Porcentaje Mínimo para Aprobar (%)</label>
                  <input type="number" value={formData.porcentaje_asistencia_minima} onChange={e => setFormData({...formData, porcentaje_asistencia_minima: e.target.value})} className="w-full border-2 border-slate-300 dark:border-slate-600 dark:bg-slate-900 rounded-lg p-3 font-black text-lg outline-none focus:border-blue-500 mt-2" />
                </div>
              )}
            </div>
          )}

        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center shrink-0">
          {!ramoEnFoco.nuevo ? (
            <button onClick={handleBorrar} className="flex items-center gap-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg font-bold text-sm transition">
              <Trash2 size={16}/> Eliminar Ramo
            </button>
          ) : <div></div>}
          
          <div className="flex gap-2">
            <button onClick={() => setRamoEnFoco(null)} className="px-5 py-2 rounded-lg font-bold text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              Cancelar
            </button>
            <button onClick={handleGuardar} className="px-6 py-2 rounded-lg font-extrabold text-sm text-white flex items-center gap-2 shadow-md transition hover:brightness-110" style={{ backgroundColor: 'var(--primary-color, #3b82f6)' }}>
              <Save size={16}/> Guardar
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}