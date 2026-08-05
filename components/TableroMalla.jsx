'use client'
import { useEffect } from 'react'
import { DndContext, useSensor, useSensors, PointerSensor, useDroppable, useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useMallaStore } from '@/store/useMallaStore'
import { createClient } from '@/utils/supabase/client'
import { Plus, Lock, Key } from 'lucide-react'

function RamoCard({ ramo }) {
  const { setRamoSeleccionado, ramoEnFoco, setRamoEnFoco, ramos } = useMallaStore()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: ramo.id })
  
  useEffect(() => {
    if (isDragging) setRamoEnFoco(null)
  }, [isDragging, setRamoEnFoco])

  const ramoFocoObj = ramos.find(r => r.id === ramoEnFoco)
  const esFoco = ramoEnFoco === ramo.id
  const esPrerrequisito = ramoEnFoco && ramoFocoObj?.prerrequisitos?.includes(ramo.id)
  const esAbiertoPorFoco = ramoEnFoco && ramo.prerrequisitos?.includes(ramoEnFoco)
  const oscurecer = ramoEnFoco && !esFoco && !esPrerrequisito && !esAbiertoPorFoco && !isDragging

  let visualClasses = "border-slate-300 text-slate-900 bg-white"
  let iconOverlay = null

  if (esFoco) {
    visualClasses = "ring-4 ring-sky-400 shadow-2xl scale-105 z-30 bg-white"
  } else if (esPrerrequisito) {
    visualClasses = "ring-4 ring-orange-400 shadow-lg shadow-orange-500/30 scale-105 z-20 bg-orange-50 border-orange-400"
    iconOverlay = <Lock size={16} className="absolute top-2 right-2 text-orange-500" strokeWidth={3} />
  } else if (esAbiertoPorFoco) {
    visualClasses = "ring-4 ring-emerald-400 shadow-lg shadow-emerald-500/30 scale-105 z-20 bg-emerald-50 border-emerald-400"
    iconOverlay = <Key size={16} className="absolute top-2 right-2 text-emerald-500" strokeWidth={3} />
  } else if (oscurecer) {
    visualClasses = "opacity-30 grayscale blur-[1px] scale-95 z-0"
  } else {
    if (ramo.estado === 'aprobado') visualClasses = "opacity-75 border-slate-400 text-slate-800 bg-slate-100"
    if (ramo.estado === 'cursando') visualClasses = "ring-4 ring-yellow-400 font-bold text-black bg-yellow-50"
  }

  const style = { 
    transform: CSS.Translate.toString(transform),
    borderLeftColor: ramo.color || '#3b82f6', 
    borderLeftWidth: '10px',
    zIndex: isDragging ? 50 : (esFoco || esPrerrequisito || esAbiertoPorFoco ? 20 : 1)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerEnter={() => !isDragging && setRamoEnFoco(ramo.id)}
      onPointerLeave={() => !isDragging && setRamoEnFoco(null)}
      className={`absolute inset-0 w-full h-full p-4 rounded-xl shadow-md cursor-grab active:cursor-grabbing text-sm flex flex-col justify-center text-left transition-all duration-300 border-y border-r border-l-0 ${visualClasses} ${isDragging ? 'shadow-2xl opacity-90 ring-4 ring-blue-400' : 'hover:shadow-lg'}`}
      onClick={() => setRamoSeleccionado(ramo)}
    >
      {iconOverlay}
      <span className="font-extrabold text-slate-900 text-[15px] leading-tight line-clamp-2 pr-4">{ramo.nombre}</span>
      <span className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{ramo.estado}</span>
      
      {esPrerrequisito && <span className="absolute bottom-2 left-3 text-[10px] font-extrabold text-orange-600 uppercase">Debes aprobarlo antes</span>}
      {esAbiertoPorFoco && <span className="absolute bottom-2 left-3 text-[10px] font-extrabold text-emerald-600 uppercase">Se desbloqueará</span>}
    </div>
  )
}

function CeldaMalla({ sem, fila, ramo, handleNuevoRamo }) {
  const { setNodeRef, isOver } = useDroppable({ id: `celda-${sem}-${fila}` })

  return (
    <div ref={setNodeRef} className={`relative h-24 mb-4 rounded-xl transition-all ${isOver && !ramo ? 'bg-blue-100 ring-2 ring-blue-500 scale-105' : ''}`}>
      {ramo ? (
        <RamoCard ramo={ramo} />
      ) : (
        <button onClick={() => handleNuevoRamo(sem, fila)} className="w-full h-full rounded-xl border-2 border-slate-300 border-dashed bg-white/40 hover:bg-white hover:border-blue-500 flex items-center justify-center text-slate-300 hover:text-blue-600 transition-colors shadow-sm">
          <Plus size={32} strokeWidth={2.5} />
        </button>
      )}
    </div>
  )
}

export default function TableroMalla() {
  const { ramos, moverRamo, agregarRamo, numSemestres, numFilas, setRamoEnFoco } = useMallaStore()
  const supabase = createClient()
  
  // Lectura segura de semestres (Si está vacío, muestra 6 por defecto)
  const semestresArray = Array.from({ length: numSemestres || 6 }, (_, i) => i + 1)
  const filasArray = Array.from({ length: numFilas || 6 }, (_, i) => i + 1)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = async (event) => {
    setRamoEnFoco(null) 
    const { active, over } = event
    if (!over) return

    const ramoId = active.id
    const overId = String(over.id)

    if (overId.startsWith('celda-')) {
      const [, semStr, filaStr] = overId.split('-')
      const nuevoSemestre = parseInt(semStr)
      const nuevaFila = parseInt(filaStr)

      const celdaOcupada = ramos.some(r => r.semestre_columna === nuevoSemestre && r.fila_posicion === nuevaFila && r.id !== ramoId)

      if (!celdaOcupada) {
        moverRamo(ramoId, nuevoSemestre, nuevaFila)
        await supabase.from('ramos').update({ semestre_columna: nuevoSemestre, fila_posicion: nuevaFila }).eq('id', ramoId)
      }
    }
  }

  const handleNuevoRamo = async (semestreColumna, filaPosicion) => {
    const { data: { user } } = await supabase.auth.getUser()
    const nuevoRamo = {
      usuario_id: user.id,
      nombre: 'Nuevo Ramo',
      color: '#3b82f6',
      estado: 'pendiente',
      semestre_columna: semestreColumna,
      fila_posicion: filaPosicion
    }
    
    const { data, error } = await supabase.from('ramos').insert(nuevoRamo).select().single()
    if (!error && data) agregarRamo(data)
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd} onDragStart={() => setRamoEnFoco(null)}>
      <div className="flex gap-6 overflow-x-auto pb-8 min-h-[800px] p-2 custom-scrollbar">
        {semestresArray.map((sem) => (
          <div key={`col-${sem}`} className="min-w-[240px] flex flex-col">
            <div className="text-center font-extrabold text-slate-800 bg-slate-200 border border-slate-300 py-3 rounded-xl mb-4 text-sm tracking-widest shadow-sm">
              SEMESTRE {sem}
            </div>
            
            <div className="flex-1 bg-slate-200/40 rounded-xl p-3 border-2 border-slate-300 border-dashed">
              {filasArray.map((fila) => {
                const ramoEnEstaCelda = ramos.find(r => r.semestre_columna === sem && r.fila_posicion === fila)
                return (
                  <CeldaMalla key={`celda-${sem}-${fila}`} sem={sem} fila={fila} ramo={ramoEnEstaCelda} handleNuevoRamo={handleNuevoRamo} />
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </DndContext>
  )
}